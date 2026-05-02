import os
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

def load_rag_chain():
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    vectorstore = Chroma(
        persist_directory="chroma_db",
        embedding_function=embeddings
    )

    retriever = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 8}
    )

    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0,
        groq_api_key=os.getenv("GROQ_API_KEY")
    )

    template = """
You are an expert legal assistant specializing in Indian law, Supreme Court judgments and constitutional law.

Use the following context from actual legal documents to answer the question accurately.

IMPORTANT FORMATTING RULES - always follow these:
- Never write a single long paragraph
- Always break your answer into clear sections
- Use numbered lists for sequential information like guidelines, steps, or procedures
- Use bullet points for non-sequential information
- Add a blank line between each point or section
- If citing a case, put the case name in bold
- If citing a section or article number, put it in bold
- Start with a one line direct answer to the question
- Then provide detailed explanation below
- End with a brief practical implication if relevant

If the answer is not in the context say:
"I don't have enough information in my documents to answer this accurately."

Context:
{context}

Question: {question}

Answer:
"""

    prompt = ChatPromptTemplate.from_template(template)

    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    chain = (
        {"context": retriever | format_docs, 
         "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    return chain

if __name__ == "__main__":
    chain = load_rag_chain()
    query = "What are the fundamental rights of a person?"
    print(chain.invoke(query))
