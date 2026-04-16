import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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

class QuestionRequest(BaseModel):
    question: str

class AnswerResponse(BaseModel):
    question: str
    answer: str

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
