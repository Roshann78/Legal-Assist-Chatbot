import os
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

class CompareResponse(BaseModel):
    question: str
    rag_answer: str
    base_answer: str

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
def compare_answers(request: QuestionRequest):
    question = request.question
    
    executor = ThreadPoolExecutor(max_workers=2)
    loop = asyncio.new_event_loop()
    
    def get_rag_answer():
        return chain.invoke(question)
    
    def get_base_answer():
        response = base_llm.invoke("Please answer this question with clear formatting, use numbered points and paragraphs, not a single block of text: " + question)
        return response.content
    
    with ThreadPoolExecutor(max_workers=2) as executor:
        rag_future = executor.submit(get_rag_answer)
        base_future = executor.submit(get_base_answer)
        rag_answer = rag_future.result()
        base_answer = base_future.result()
    
    
    return CompareResponse(
        question=question,
        rag_answer=rag_answer,
        base_answer=base_answer
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

Use ONLY the following context from the uploaded document to answer the question. Be specific and clear.

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

