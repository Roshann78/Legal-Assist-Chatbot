<div align="center">

# LegalAssist AI

**Your intelligent, document-grounded legal and banking assistant for India!**

![Visitors](https://visitor-badge.laobi.icu/badge?page_id=Roshann78.Legal-Assist-Chatbot&color=blue)
![Forks](https://img.shields.io/github/forks/Roshann78/Legal-Assist-Chatbot?style=flat-square&color=orange)
![Stars](https://img.shields.io/github/stars/Roshann78/Legal-Assist-Chatbot?style=flat-square&color=yellow)
![Issues](https://img.shields.io/github/issues/Roshann78/Legal-Assist-Chatbot?style=flat-square&color=red)
![License](https://img.shields.io/github/license/Roshann78/Legal-Assist-Chatbot?style=flat-square&color=green)

[Features](#features) • [Tech Stack](#tech-stack) • [Knowledge Base](#knowledge-base) • [Setup](#setup)

</div>

---

## Overview

Welcome to **LegalAssist AI**! Navigating Indian law and banking regulations can be overwhelming, but it doesn't have to be. We built this specialized query system to provide you with **contextually accurate, highly reliable** information. 

By leveraging **Retrieval Augmented Generation (RAG)**, LegalAssist AI grounds its responses in verified source documents rather than guessing or relying on outdated LLM memory. This means **zero hallucinations** and 100% factual, source-backed answers to your complex legal and financial questions.

---

## Architecture Workflow

Here's a behind-the-scenes look at how the entire system operates end-to-end:

### Complete System Architecture

```mermaid
graph TB
    classDef frontend fill:#dbeafe,stroke:#2563eb,stroke-width:2px,color:#1e3a5f;
    classDef backend fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f;
    classDef ai fill:#e1f5fe,stroke:#0288d1,stroke-width:2px,color:#01579b;
    classDef db fill:#f3e5f5,stroke:#8e24aa,stroke-width:2px,color:#4a148c;
    classDef voice fill:#d1fae5,stroke:#059669,stroke-width:2px,color:#064e3b;

    subgraph FRONTEND ["🖥️ Frontend — Next.js 15"]
        UI["Landing Page"]:::frontend
        LEGAL_UI["Legal Chat"]:::frontend
        BANK_UI["Banking Chat"]:::frontend
        DOC_UI["Document Chat"]:::frontend
        COMP_UI["RAG vs Base Compare"]:::frontend
        VOICE["🎙️ Voice I/O\nWeb Speech API\n8 Indian Languages"]:::voice
    end

    subgraph BACKEND ["⚙️ Backend — FastAPI"]
        API["API Router\napp.py"]:::backend
        LEGAL_CHAIN["Legal RAG Chain\nrag_chain.py"]:::backend
        BANK_CHAIN["Banking RAG Chain\napp.py"]:::backend
        DOC_CHAIN["Document Chain\nSession-based"]:::backend
        COMPARE["Compare Engine\nThreadPoolExecutor"]:::backend
    end

    subgraph AI_LAYER ["🧠 AI Layer"]
        LLM["Llama 3.3 70B\nvia Groq API"]:::ai
        EMBED["Sentence-Transformers\nall-MiniLM-L6-v2"]:::ai
    end

    subgraph DATA_LAYER ["💾 Data Layer"]
        LEGAL_DB[("ChromaDB\nLegal\n11,694 vectors")]:::db
        BANK_DB[("ChromaDB\nBanking\n1,403 vectors")]:::db
        TEMP_DB[("ChromaDB\nTemp Sessions")]:::db
        LEGAL_PDF["📄 29 Legal PDFs"]:::db
        BANK_PDF["📄 11 Banking PDFs"]:::db
    end

    UI --> LEGAL_UI & BANK_UI & DOC_UI & COMP_UI
    VOICE -.->|Speech-to-Text| LEGAL_UI & BANK_UI & COMP_UI
    
    LEGAL_UI -->|POST /ask| API
    BANK_UI -->|POST /ask-banking| API
    DOC_UI -->|POST /upload-document\nPOST /ask-document| API
    COMP_UI -->|POST /compare| API

    API --> LEGAL_CHAIN & BANK_CHAIN & DOC_CHAIN & COMPARE
    
    LEGAL_CHAIN --> EMBED --> LEGAL_DB
    BANK_CHAIN --> EMBED --> BANK_DB
    DOC_CHAIN --> EMBED --> TEMP_DB
    
    LEGAL_CHAIN & BANK_CHAIN & DOC_CHAIN & COMPARE --> LLM

    LEGAL_PDF -->|ingest.py| LEGAL_DB
    BANK_PDF -->|ingest_banking.py| BANK_DB
```

### Data Ingestion Pipeline (Offline — Run Once)

```mermaid
graph LR
    classDef process fill:#fef3c7,stroke:#d97706,stroke-width:2px;
    classDef db fill:#f3e5f5,stroke:#8e24aa,stroke-width:2px;
    classDef data fill:#dbeafe,stroke:#2563eb,stroke-width:2px;

    A["📁 data/ or data_banking/\nRaw PDF Files"]:::data
    B["PyPDFDirectoryLoader\nExtracts text from every page"]:::process
    C["RecursiveCharacterTextSplitter\nchunk_size=1000\nchunk_overlap=200"]:::process
    D["HuggingFace Embeddings\nall-MiniLM-L6-v2\n384-dimensional vectors"]:::process
    E[("ChromaDB\nPersisted to disk")]:::db

    A -->|"Load"| B -->|"Split"| C -->|"Embed"| D -->|"Store"| E
```

### User Query Flow (Real-time — Every Question)

```mermaid
graph LR
    classDef user fill:#dbeafe,stroke:#2563eb,stroke-width:2px;
    classDef process fill:#fef3c7,stroke:#d97706,stroke-width:2px;
    classDef ai fill:#e1f5fe,stroke:#0288d1,stroke-width:2px;
    classDef db fill:#f3e5f5,stroke:#8e24aa,stroke-width:2px;

    Q["❓ User Question"]:::user
    EMB["Embed Question\nSame MiniLM-L6-v2"]:::process
    SEARCH["Similarity Search\nTop K=5 or K=8 chunks"]:::process
    DB[("ChromaDB")]:::db
    CTX["Retrieved Context\nMost relevant text chunks"]:::process
    PROMPT["Prompt Template\nQuestion + Context + Rules"]:::process
    LLM["🧠 Llama 3.3 70B\nvia Groq LPU"]:::ai
    ANS["✅ Grounded Answer\nFormatted with Markdown"]:::user

    Q --> EMB --> SEARCH
    DB -.->|"Vector Match"| SEARCH
    SEARCH --> CTX --> PROMPT
    Q -->|"Raw Question"| PROMPT
    PROMPT --> LLM --> ANS
```

### Compare Mode Flow (Concurrent Execution)

```mermaid
graph TD
    classDef user fill:#dbeafe,stroke:#2563eb,stroke-width:2px;
    classDef rag fill:#d1fae5,stroke:#059669,stroke-width:2px;
    classDef base fill:#fee2e2,stroke:#dc2626,stroke-width:2px;
    classDef ai fill:#e1f5fe,stroke:#0288d1,stroke-width:2px;

    Q["❓ User Question"]:::user
    POOL["ThreadPoolExecutor\nmax_workers=2"]:::user

    subgraph THREAD1 ["Thread 1 — RAG Path"]
        R1["Retrieve from ChromaDB"]:::rag
        R2["Build Prompt with Context"]:::rag
        R3["Llama 3.3 + RAG"]:::rag
        R4["✅ RAG Answer\nGrounded & Cited"]:::rag
    end

    subgraph THREAD2 ["Thread 2 — Base Path"]
        B1["No Retrieval"]:::base
        B2["Direct Prompt\nGeneral Knowledge Only"]:::base
        B3["Llama 3.3 Raw"]:::base
        B4["⚠️ Base Answer\nMay Hallucinate"]:::base
    end

    Q --> POOL
    POOL --> R1 --> R2 --> R3 --> R4
    POOL --> B1 --> B2 --> B3 --> B4
    R4 & B4 -->|"Side-by-side"| RESULT["📊 Comparison Panel\nin Frontend"]
```

### Document Chat Flow (Dynamic RAG)

```mermaid
graph LR
    classDef user fill:#dbeafe,stroke:#2563eb,stroke-width:2px;
    classDef process fill:#fef3c7,stroke:#d97706,stroke-width:2px;
    classDef db fill:#f3e5f5,stroke:#8e24aa,stroke-width:2px;

    UPLOAD["📤 User Uploads PDF"]:::user
    PARSE["PyPDFLoader\nExtract Text"]:::process
    CHUNK["Text Splitter\n1000 chars"]:::process
    EMBED["Embed Chunks"]:::process
    TMPDB[("Temp ChromaDB\nIn-memory Collection\nSession ID: uuid4")]:::db
    ASK["❓ User Asks Question"]:::user
    RETRIEVE["Similarity Search\nAgainst Uploaded Doc"]:::process
    LLM["🧠 Llama 3.3"]:::process
    ANS["✅ Answer from\nYour Document"]:::user

    UPLOAD --> PARSE --> CHUNK --> EMBED --> TMPDB
    ASK --> RETRIEVE
    TMPDB -.-> RETRIEVE
    RETRIEVE --> LLM --> ANS
```

### Voice Feature Pipeline (Browser-Native)

```mermaid
graph LR
    classDef voice fill:#d1fae5,stroke:#059669,stroke-width:2px;
    classDef process fill:#fef3c7,stroke:#d97706,stroke-width:2px;
    classDef ui fill:#dbeafe,stroke:#2563eb,stroke-width:2px;

    MIC["🎙️ Microphone\nUser speaks"]:::voice
    STT["SpeechRecognition API\nwebkitSpeechRecognition"]:::voice
    TEXT["Transcribed Text\nen-IN / hi-IN / ta-IN..."]:::process
    INPUT["Chat Input Field"]:::ui
    AI["AI Response\nMarkdown Format"]:::ui
    STRIP["stripMarkdown()\nRemove #, **, `, links"]:::process
    TTS["SpeechSynthesis API\nrate=0.9, pitch=1"]:::voice
    SPEAKER["🔊 Speaker\nAI speaks the answer"]:::voice

    MIC --> STT --> TEXT --> INPUT
    AI --> STRIP --> TTS --> SPEAKER
```

---

## Features

What can LegalAssist AI do for you? Let's take a look:

| Feature | Description | Status |
| :--- | :--- | :---: |
| **Legal Assistant** | Query SC judgments, IPC, CrPC, and the Constitution with ease. | ✅ Live |
| **Banking Assistant**| Decode RBI guidelines, PMJDY, KYC, and rural banking policies. | ✅ Live |
| **Document Chat** | Upload *any* PDF document and chat with it instantly! | ✅ Live |
| **RAG vs Base AI** | See the difference! Side-by-side comparison of RAG vs standard LLM. | ✅ Live |
| **🎙️ Voice Input** | Speak your questions using browser mic — supports 8 Indian languages. | ✅ Live |
| **🔊 Voice Output** | AI reads answers aloud with text-to-speech, auto-strips markdown. | ✅ Live |

---

## Tech Stack

We used the best tools in the ecosystem to build this application:

| Layer | Technology |
| :--- | :--- |
| **LLM** | Llama 3.3 70B via Groq API (LPU inference) |
| **RAG Framework** | LangChain (LCEL pipelines) |
| **Vector Database** | ChromaDB (persisted locally) |
| **Embeddings** | `sentence-transformers/all-MiniLM-L6-v2` (384-dim) |
| **Backend** | FastAPI (Python 3.12) + Uvicorn |
| **Frontend** | Next.js 15, React 18, Tailwind CSS |
| **Voice** | Web Speech API (SpeechRecognition + SpeechSynthesis) |
| **PDF Parsing** | PyPDF (via LangChain loaders) |
| **Concurrency** | ThreadPoolExecutor (Compare Mode) |

---

## The Knowledge Base

Our system is packed with verified, high-quality data.

### Legal Knowledge Base
> **29 Source Documents | 11,694 Vectors Indexed**
- **Covers:** Supreme Court judgments, Constitution of India, IPC, CrPC, Indian Evidence Act, RTI Act, Domestic Violence Act.
- **Key Cases Included:** *DK Basu, Vishaka, Maneka Gandhi, Kesavananda Bharati, Shreya Singhal, KS Puttaswamy, SR Bommai, Bachan Singh,* and 20+ more!

### Banking Knowledge Base
> **11 Source Documents | 1,403 Vectors Indexed**
- **Covers:** PMJDY guidelines, RBI Banking Ombudsman Scheme, KYC guidelines, Fair Practices Code, and the Banking Regulation Act 1949.

---

## Project Structure

```text
LegalAssist-AI/
├── data/                        # 📄 Legal PDFs (29 files — SC judgments, IPC, CrPC, Constitution)
├── data_banking/                # 📄 Banking PDFs (11 files — RBI, PMJDY, KYC)
├── notebooks/                   # 🧪 Jupyter notebooks for testing
│
├── src/                         # ⚙️ Python Backend (FastAPI)
│   ├── app.py                   #    Main server — all API endpoints, banking chain, compare logic
│   ├── rag_chain.py             #    Legal RAG chain — retriever + prompt + LLM pipeline
│   ├── ingest.py                #    Legal document ingestion → chroma_db/
│   └── ingest_banking.py        #    Banking document ingestion → chroma_db_banking/
│
├── frontend/                    # 🖥️ Next.js Application
│   ├── app/
│   │   ├── page.tsx             #    Main SPA — all 4 feature views + chat logic
│   │   ├── layout.tsx           #    Root layout with fonts & metadata
│   │   └── globals.css          #    Design system — CSS variables, typography
│   ├── components/
│   │   ├── Navbar.tsx           #    Navigation bar
│   │   ├── HeroSection.tsx      #    Landing page hero
│   │   ├── FeaturesSection.tsx  #    Feature cards
│   │   ├── HowItWorks.tsx       #    How it works section
│   │   ├── Footer.tsx           #    Footer
│   │   └── VoiceButton.tsx      #    🎙️ Microphone button with pulse animation
│   └── hooks/
│       └── useVoice.ts          #    🔊 Custom hook — speech recognition + synthesis
│
├── chroma_db/                   # 💾 Legal vector store (11,694 vectors)
├── chroma_db_banking/           # 💾 Banking vector store (1,403 vectors)
├── .env                         # 🔑 Secrets — GROQ_API_KEY (not committed)
├── requirements.txt             # 📦 Python dependencies
└── README.md
```

---

## API Endpoints

Our FastAPI backend provides several clean, easy-to-use endpoints:

| Method | Endpoint | What it does |
|:---:|:---|:---|
| `POST` | `/ask` | Queries the **Legal** RAG chain |
| `POST` | `/ask-banking` | Queries the **Banking** RAG chain |
| `POST` | `/upload-document`| Uploads a PDF and creates a session |
| `POST` | `/ask-document` | Chats with your uploaded PDF |
| `POST` | `/compare` | Side-by-side RAG vs Base Llama output |
| `GET`  | `/health` | Server health check |
| `GET`  | `/docs` | Interactive Swagger API documentation |

---

## Setup & Installation

Ready to run this locally? Follow these simple steps.

### Prerequisites
- **Python 3.12+**
- **Node.js 18+**
- **Groq API Key** (Get it free at [console.groq.com](https://console.groq.com))

### Quick Start Guide

**1. Clone the repo**
```bash
git clone https://github.com/Roshann78/Legal-Assist-Chatbot.git
cd Legal-Assist-Chatbot
```

**2. Setup Python Environment**
```bash
python -m venv venv
venv\Scripts\activate   # On Windows
```

**3. Install Dependencies & Add Keys**
```bash
pip install -r requirements.txt
# Create a .env file in the root and add:
# GROQ_API_KEY=your_super_secret_key_here
```

**4. Ingest the Data**
```bash
python src/ingest.py           # Process legal docs
python src/ingest_banking.py   # Process banking docs
```

**5. Fire up the Backend!**
```bash
cd src
uvicorn app:app --reload
```

**6. Launch the Frontend!**
```bash
# Open a new terminal window
cd frontend
npm run dev
```
Now open [http://localhost:3000](http://localhost:3000) and enjoy!

---

## How RAG Works (The Magic)

Curious about how it works? Here's the complete 3-phase breakdown:

```mermaid
graph TD
    classDef phase fill:#fef3c7,stroke:#d97706,stroke-width:2px;
    classDef detail fill:#f9f9f9,stroke:#333,stroke-width:1px;

    subgraph PHASE1 ["📥 Phase 1: Ingestion (Offline — Run Once)"]
        P1A["Take 40+ raw PDF files"]:::detail
        P1B["Extract text using PyPDFLoader"]:::detail
        P1C["Split into 1000-char chunks\nwith 200-char overlap"]:::detail
        P1D["Convert each chunk into a\n384-dimensional math vector"]:::detail
        P1E["Store all vectors in ChromaDB\non local disk"]:::detail
        P1A --> P1B --> P1C --> P1D --> P1E
    end

    subgraph PHASE2 ["🔍 Phase 2: Retrieval (Real-time)"]
        P2A["User asks a question"]:::detail
        P2B["Convert question into a vector\nusing the SAME embedding model"]:::detail
        P2C["Run similarity search\nFind top K closest text chunks"]:::detail
        P2D["Return the most relevant\noriginal text passages"]:::detail
        P2A --> P2B --> P2C --> P2D
    end

    subgraph PHASE3 ["🧠 Phase 3: Generation (Real-time)"]
        P3A["Combine: Question + Retrieved Context\n+ Formatting Rules"]:::detail
        P3B["Send to Llama 3.3 70B\nvia Groq API at 100s of tokens/sec"]:::detail
        P3C["LLM reads context and generates\na grounded, factual answer"]:::detail
        P3D["Return formatted Markdown response\nto the user"]:::detail
        P3A --> P3B --> P3C --> P3D
    end

    PHASE1 -.->|"Vectors ready\nin ChromaDB"| PHASE2
    PHASE2 -->|"Context chunks"| PHASE3
```

**Why does this matter?** Without RAG, LLMs guess from training data memory. With RAG, the LLM reads your actual documents before answering — **zero hallucinations**, 100% source-backed.

---

## Limitations & Disclaimer

- **Scope:** Answers are strictly limited to the documents in our current knowledge base.
- **PDF Quality:** Scanned, image-only PDFs cannot currently be processed.
- **Sessions:** Document chat sessions are temporary and clear on server restart.

> **DISCLAIMER:** This project is for educational and informational purposes only! It is **not** a substitute for professional legal or financial advice. Always consult a qualified professional before making serious decisions.

---
<div align="center">
Made with ❤️ for the Indian Legal & Banking ecosystem.
</div>
