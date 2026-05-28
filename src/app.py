import os
import sys
import platform

# Workaround: platform.machine() hangs on Windows due to WMI query in Python 3.12
# sys.platform doesn't use WMI, so it's safe to check
if sys.platform == 'win32':
    platform.machine = lambda: 'AMD64'

import asyncio
import tempfile
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_groq import ChatGroq
from rag_chain import load_rag_chain

app = FastAPI(
    title="Legal Assist Chatbot API",
    description="RAG based legal assistant for Indian Supreme Court judgments",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


print("Loading RAG chain...")
chain = load_rag_chain()
print("RAG chain loaded and ready!")

print("Loading banking RAG chain...")
from langchain_chroma import Chroma as ChromaBank
from langchain_huggingface import HuggingFaceEmbeddings as HFEmbeddings
from langchain_core.prompts import ChatPromptTemplate as BankingPromptTemplate
from langchain_core.runnables import RunnablePassthrough as BankingPassthrough
from langchain_core.output_parsers import StrOutputParser as BankingOutputParser

banking_embeddings = HFEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

banking_vectorstore = ChromaBank(
    persist_directory="chroma_db_banking",
    embedding_function=banking_embeddings
)

banking_retriever = banking_vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 5}
)

banking_llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    groq_api_key=os.getenv("GROQ_API_KEY")
)

banking_template = """
You are an expert banking and financial assistant specializing in Indian banking, RBI guidelines, government schemes and rural finance.

Use ONLY the provided context from actual RBI documents and banking guidelines to answer the question accurately. Do NOT use any external knowledge or information not present in the context.

FORMATTING RULES:
- Never write a single long paragraph
- Use numbered lists for steps or procedures
- Use bullet points for features or benefits
- Bold important scheme names, section numbers, or key terms
- Start with a direct one line answer
- Then provide detailed explanation
- Focus on practical help for common people

If the answer is not in the context say:
"I don't have enough information in my banking documents to answer this accurately."

Context:
{context}

Question: {question}

Answer:
"""

banking_prompt = BankingPromptTemplate.from_template(banking_template)

def banking_format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

banking_chain = (
    {"context": banking_retriever | banking_format_docs,
     "question": BankingPassthrough()}
    | banking_prompt
    | banking_llm
    | BankingOutputParser()
)

print("Banking RAG chain loaded and ready!")

document_sessions = {}

base_llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.7,
    groq_api_key=os.getenv("GROQ_API_KEY")
)

class QuestionRequest(BaseModel):
    question: str

class AnswerResponse(BaseModel):
    question: str
    answer: str

class CompareRequest(BaseModel):
    question: str
    domain: str = "legal"

class CompareResponse(BaseModel):
    question: str
    rag_answer: str
    base_answer: str
    domain: str

@app.get("/")
def root():
    return {"message": "Legal Assist Chatbot API is running!"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/ask", response_model=AnswerResponse)
def ask_question(request: QuestionRequest):
    answer = chain.invoke(request.question)
    return AnswerResponse(
        question=request.question,
        answer=answer
    )

@app.post("/compare", response_model=CompareResponse)
def compare_answers(request: CompareRequest):
    question = request.question
    domain = request.domain

    def get_rag_answer():
        if domain == "banking":
            return banking_chain.invoke(question)
        else:
            return chain.invoke(question)

    def get_base_answer():
        if domain == "banking":
            base_prompt = f"""You are a banking assistant. Answer this question from general knowledge only, no specific documents. Use clear formatting with numbered points and paragraphs: {question}"""
        else:
            base_prompt = f"""You are a legal assistant. Answer this question from general knowledge only, no specific documents. Use clear formatting with numbered points and paragraphs: {question}"""
        response = base_llm.invoke(base_prompt)
        return response.content

    with ThreadPoolExecutor(max_workers=2) as executor:
        rag_future = executor.submit(get_rag_answer)
        base_future = executor.submit(get_base_answer)
        rag_answer = rag_future.result()
        base_answer = base_future.result()

    return CompareResponse(
        question=question,
        rag_answer=rag_answer,
        base_answer=base_answer,
        domain=domain
    )

class DocumentQuestionRequest(BaseModel):
    session_id: str
    question: str

@app.post("/upload-document")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        return {"error": "Only PDF files are supported"}

    with tempfile.NamedTemporaryFile(delete=False,
                                     suffix='.pdf') as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    from langchain_community.document_loaders import PyPDFLoader
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    from langchain_chroma import Chroma
    import uuid

    loader = PyPDFLoader(tmp_path)
    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    chunks = splitter.split_documents(documents)

    session_id = str(uuid.uuid4())

    from langchain_huggingface import HuggingFaceEmbeddings
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        collection_name=f"session_{session_id}"
    )

    document_sessions[session_id] = vectorstore

    os.unlink(tmp_path)

    return {
        "session_id": session_id,
        "filename": file.filename,
        "pages": len(documents),
        "chunks": len(chunks),
        "message": "Document uploaded successfully"
    }

@app.post("/ask-document")
def ask_document(request: DocumentQuestionRequest):
    if request.session_id not in document_sessions:
        return {"error": "Session not found. Please upload a document first."}

    vectorstore = document_sessions[request.session_id]

    retriever = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 5}
    )

    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0,
        groq_api_key=os.getenv("GROQ_API_KEY")
    )

    template = """
You are an expert assistant helping users understand documents they have uploaded.

Use ONLY the following context from the uploaded document to answer the question. Be specific and clear. Do NOT use any external knowledge or information not present in the context.

FORMATTING RULES:
- Break answer into clear paragraphs or numbered points
- Bold important terms or section references
- Never write one long paragraph
- If the answer is not in the document say "This information is not found in the uploaded document."

Context:
{context}

Question: {question}

Answer:
"""

    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.runnables import RunnablePassthrough
    from langchain_core.output_parsers import StrOutputParser

    prompt = ChatPromptTemplate.from_template(template)

    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    doc_chain = (
        {"context": retriever | format_docs,
         "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    answer = doc_chain.invoke(request.question)

    return {
        "question": request.question,
        "answer": answer,
        "session_id": request.session_id
    }

@app.post("/ask-banking", response_model=AnswerResponse)
def ask_banking(request: QuestionRequest):
    answer = banking_chain.invoke(request.question)
    return AnswerResponse(
        question=request.question,
        answer=answer
    )
