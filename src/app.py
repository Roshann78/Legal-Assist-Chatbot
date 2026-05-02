import os
import asyncio
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI
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
        response = base_llm.invoke(question)
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
