# Graph Report - .  (2026-05-03)

## Corpus Check
- Corpus is ~3,214 words - fits in a single context window. You may not need a graph.

## Summary
- 50 nodes · 45 edges · 7 communities detected
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Legal Cases & Frontend UI|Legal Cases & Frontend UI]]
- [[_COMMUNITY_RAG Chain & API Logic|RAG Chain & API Logic]]
- [[_COMMUNITY_FastAPI App Structure|FastAPI App Structure]]
- [[_COMMUNITY_Document Ingestion Pipeline|Document Ingestion Pipeline]]
- [[_COMMUNITY_Cross-Origin Configuration|Cross-Origin Configuration]]
- [[_COMMUNITY_FastAPI Server Instance|FastAPI Server Instance]]
- [[_COMMUNITY_Root Layout Component|Root Layout Component]]

## God Nodes (most connected - your core abstractions)
1. `load_rag_chain` - 6 edges
2. `Legal Buddy Project` - 5 edges
3. `Maneka Gandhi vs Union Of India (1978)` - 5 edges
4. `ask_question Endpoint` - 4 edges
5. `Preset Legal Questions` - 4 edges
6. `D.K. Basu vs State of West Bengal (1996)` - 4 edges
7. `Vishaka & Ors vs State of Rajasthan (1997)` - 4 edges
8. `AnswerResponse` - 3 edges
9. `ingest_documents Pipeline` - 3 edges
10. `ChromaDB Vectorstore` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Legal Buddy Project` --references--> `Shreya Singhal vs U.O.I (2015)`  [EXTRACTED]
  README.md → data/Shreya_Singhal_vs_U_O_I_on_24_March_2015.PDF
- `RAG Architecture` --rationale_for--> `Legal Expert Prompt Template`  [INFERRED]
  README.md → src/rag_chain.py
- `Maneka Gandhi vs Union Of India (1978)` --references--> `Article 21 - Right to Life and Personal Liberty`  [EXTRACTED]
  data/Maneka_Gandhi_vs_Union_Of_India_on_25_January_1978.PDF → README.md
- `CORS Middleware` --semantically_similar_to--> `Next.js Dev Origins Config`  [INFERRED] [semantically similar]
  src/app.py → frontend/next.config.ts
- `Legal Buddy Project` --references--> `Maneka Gandhi vs Union Of India (1978)`  [EXTRACTED]
  README.md → data/Maneka_Gandhi_vs_Union_Of_India_on_25_January_1978.PDF

## Hyperedges (group relationships)
- **RAG Pipeline Flow** — ingest_ingest_documents, rag_chain_chromadb_vectorstore, rag_chain_similarity_retriever, rag_chain_groq_llm, rag_chain_load_rag_chain [EXTRACTED 0.95]
- **Landmark Indian Supreme Court Cases** — maneka_gandhi_case, shreya_singhal_case, dk_basu_case, vishaka_case [EXTRACTED 1.00]
- **Frontend-Backend API Contract** — page_handlesend, app_ask_question, app_questionrequest, app_answerresponse [EXTRACTED 0.95]

## Communities

### Community 0 - "Legal Cases & Frontend UI"
Cohesion: 0.23
Nodes (12): D.K. Basu vs State of West Bengal (1996), Maneka Gandhi vs Union Of India (1978), handleSend Chat Handler, LegalBuddy Chat Component, Preset Legal Questions, Article 21 - Right to Life and Personal Liberty, Arrest & Detention Guidelines, Legal Buddy Project (+4 more)

### Community 1 - "RAG Chain & API Logic"
Cohesion: 0.22
Nodes (9): AnswerResponse, ask_question Endpoint, QuestionRequest, format_docs Helper, Groq LLM (Llama-3.3-70b), Legal Expert Prompt Template, load_rag_chain, Similarity Retriever (k=5) (+1 more)

### Community 2 - "FastAPI App Structure"
Cohesion: 0.38
Nodes (4): BaseModel, AnswerResponse, ask_question(), QuestionRequest

### Community 4 - "Document Ingestion Pipeline"
Cohesion: 0.67
Nodes (4): Document Chunking Strategy, HuggingFace Embeddings (all-MiniLM-L6-v2), ingest_documents Pipeline, ChromaDB Vectorstore

### Community 8 - "Cross-Origin Configuration"
Cohesion: 1.0
Nodes (2): CORS Middleware, Next.js Dev Origins Config

### Community 13 - "FastAPI Server Instance"
Cohesion: 1.0
Nodes (1): FastAPI Server

### Community 14 - "Root Layout Component"
Cohesion: 1.0
Nodes (1): Root Layout

## Knowledge Gaps
- **14 isolated node(s):** `FastAPI Server`, `QuestionRequest`, `AnswerResponse`, `Document Chunking Strategy`, `format_docs Helper` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Cross-Origin Configuration`** (2 nodes): `CORS Middleware`, `Next.js Dev Origins Config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `FastAPI Server Instance`** (1 nodes): `FastAPI Server`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Root Layout Component`** (1 nodes): `Root Layout`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `load_rag_chain` connect `RAG Chain & API Logic` to `Document Ingestion Pipeline`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Why does `Legal Buddy Project` connect `Legal Cases & Frontend UI` to `RAG Chain & API Logic`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Maneka Gandhi vs Union Of India (1978)` (e.g. with `D.K. Basu vs State of West Bengal (1996)` and `Vishaka & Ors vs State of Rajasthan (1997)`) actually correct?**
  _`Maneka Gandhi vs Union Of India (1978)` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `FastAPI Server`, `QuestionRequest`, `AnswerResponse` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._