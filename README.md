<div align="center">
  <div style="background-color: #0f172a; padding: 20px; border-radius: 15px; display: inline-block;">
    <h1 style="color: white; margin: 0;">⚖️ LexAI: Legal Assist Chatbot</h1>
  </div>
  <br/><br/>
  <p><i>A full-stack, AI-powered Legal Research Assistant leveraging Retrieval-Augmented Generation over Landmark Indian Supreme Court Judgments.</i></p>

  <!-- Badges -->
  <img src="https://img.shields.io/badge/Python-3.11+-blue.svg" alt="Python" />
  <img src="https://img.shields.io/badge/Next.js-14+-black.svg" alt="Next.js" />
  <img src="https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/LangChain-🦜🔗-green.svg" alt="LangChain" />
  <img src="https://img.shields.io/badge/Vector_DB-ChromaDB-orange.svg" alt="ChromaDB" />
  <img src="https://img.shields.io/badge/LLM-Llama_3.3_70B-purple.svg" alt="LLMs" />
</div>

<br />

## 📖 Comprehensive Overview

**LexAI** is a state-of-the-art Retrieval-Augmented Generation (RAG) ecosystem built to assist legal professionals, researchers, and citizens in understanding granular Indian legal contexts. 

Recently upgraded into a complete **full-stack web application**, LexAI features a blazing-fast Python **FastAPI backend** handling document retrieval and LLM reasoning, seamlessly connected to a modern, responsive **Next.js & Tailwind CSS frontend** that provides a premium, professional user experience mimicking top-tier legal firm aesthetics.

The agent grounds its knowledge directly in a curated vector database of monumental Indian Constitutional Law cases, effectively minimizing model hallucinations.

---

## ✨ System Features

### 🖥️ Modern Web Interface (Frontend)
- **Professional Firm Aesthetic:** A sleek, deep-navy sidebar paired with a clean, distraction-free main chat interface. 
- **Interactive Chat Experience:** User and AI chat bubbles with distinct styling, typing indicators, loading states, and smooth auto-scrolling.
- **One-Click Query Presets:** Helpful starter questions provided natively in the welcome screen.
- **Fully Responsive:** Tailwind-powered design that scales elegantly across desktops, tablets, and mobile devices.

### ⚙️ Robust API (Backend)
- **FastAPI Powered:** Lightweight, asynchronous server exposing dedicated `/health` and `/ask` REST endpoints.
- **CORS Configured:** Secure middleware setup designed to support local and network traffic communication between the UI and backend. 

### 🧠 Advanced AI & RAG Pipeline
- **Smart Ingestion Pipeline (`ingest.py`):** Automatically extracts, chunks (1000 tokens with 200 overlap), and embeds densely populated PDF legal judgments.
- **High-Fidelity Retrieval (`rag_chain.py`):** Utilizes `HuggingFaceEmbeddings` (`sentence-transformers`) stored locally in `ChromaDB` using advanced Similarity Search capabilities.
- **Groq-Accelerated LLM Inference:** Powered by Meta's `Llama-3.3-70b-versatile` running on Groq LPU inference engines for lightning-fast answer generation.

---

## 🛠️ Complete Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend UI/UX** | Next.js (React), Tailwind CSS, TypeScript, Lucide React Icons |
| **Backend API** | Python, FastAPI, Uvicorn, Pydantic |
| **AI Framework** | LangChain Core & Community |
| **LLM & Embeddings** | Groq (`langchain-groq`), HuggingFace (`sentence-transformers/all-MiniLM-L6-v2`) |
| **Database & Ingestion** | ChromaDB, PyPDFDirectoryLoader, RecursiveCharacterTextSplitter |
| **Environment Tools** | `dotenv` (.env.local, .env) |

---

## 📂 Architecture & Directory Structure

```text
LexAI (Legal Assist Chatbot)/
├── frontend/                  # Next.js React Web UI
│   ├── app/                   # Next.js App Router (page.tsx, layout.tsx)
│   ├── next.config.ts         # Next.js configuration (Dev Origins allowed)
│   └── package.json           # Node dependencies
├── src/                       # FastAPI & Langchain Python Backend
│   ├── app.py                 # FastAPI server and endpoints
│   ├── ingest.py              # Data processing and ChromaDB ingestion logic
│   └── rag_chain.py           # LLM Prompting and Chain Logic
├── data/                      # Source PDFs of Landmark Judgments
├── chroma_db/                 # Persistent Local Vector Database
├── notebooks/                 # Jupyter Notebook testing environments
├── requirements.txt           # Python application dependencies
└── README.md                  # Detailed Project Documentation
```

---

## ⚖️ Curated Landmark Cases

The current system relies on the following Indian Supreme Court decisions:
1. **Maneka Gandhi vs Union Of India (1978):** Expanded the scope of Article 21 (Right to Life and Personal Liberty).
2. **Shreya Singhal vs U.O.I (2015):** Struck down Section 66A of the IT Act, championing Freedom of Speech and Expression.
3. **D.K. Basu vs State Of West Bengal (1996):** Laid down foundational guidelines for arrest/detention to prevent custodial violence.
4. **Vishaka & Ors vs State Of Rajasthan (1997):** Established the primary guidelines against workplace sexual harassment.

---

## 🚀 Setup & Installation Guide

Setting up LexAI locally requires starting both the Backend Python Server and the Frontend Node.js Server.

### Phase 1: Global Setup & Backend
1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Legal-Assist-Chatbot
   ```
2. **Setup Python Virtual Environment:**
   ```bash
   python -m venv venv
   
   # On Windows:
   venv\Scripts\activate
   
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   pip install langchain-huggingface sentence-transformers  # Required for AI Embeddings
   ```
4. **Environment Variables (.env):** Create a `.env` file in the root directory and add your API keys:
   ```env
   GROQ_API_KEY="your_groq_api_key_here"
   ```
5. *(Optional)* **Re-ingest Documents:** If you add new PDFs to the `data/` folder, run the ingestion script:
   ```bash
   cd src
   python ingest.py
   cd ..
   ```

### Phase 2: Start the FastAPI Backend
Ensure your virtual environment is active, then start the API server:
```bash
cd src
uvicorn app:app --reload
```
*The backend will boot up and actively listen on `http://127.0.0.1:8000`.*

### Phase 3: Setup & Start the Frontend
Open a **new terminal window**, ensuring you are in the project root:
1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```
2. **Install Node Modules:**
   ```bash
   npm install
   ```
3. **Verify Environment Variables:** Make sure your `frontend/.env.local` exists and contains:
   ```env
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
   ```
4. **Start Development Server:**
   ```bash
   npm run dev
   ```
*The frontend interface is now accessible at `http://localhost:3000`!*

---

## ⚠️ Disclaimer
*LexAI is an experimental AI tool designed solely for legal learning, development, and conceptual research. It should **not** be used as a substitute for certified, professional legal counsel. While the RAG architecture strictly grounds context, external AI models may occasionally interpret texts inaccurately.*

---
<p align="center"><b>Built with dedication to simplify legal research through AI.</b></p>
