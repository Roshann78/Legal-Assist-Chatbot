# Graph Report - Legal Assist Chatbot  (2026-05-03)

## Corpus Check
- 14 files · ~1,434,031 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 66 nodes · 59 edges · 8 communities detected
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]

## God Nodes (most connected - your core abstractions)
1. `load_rag_chain` - 6 edges
2. `Legal Buddy Project` - 5 edges
3. `Maneka Gandhi vs Union Of India (1978)` - 5 edges
4. `ask_question Endpoint` - 4 edges
5. `Preset Legal Questions` - 4 edges
6. `D.K. Basu vs State of West Bengal (1996)` - 4 edges
7. `Vishaka & Ors vs State of Rajasthan (1997)` - 4 edges
8. `AnswerResponse` - 3 edges
9. `CompareResponse` - 3 edges
10. `ingest_documents Pipeline` - 3 edges

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

### Community 0 - "Community 0"
Cohesion: 0.25
Nodes (11): D.K. Basu vs State of West Bengal (1996), Maneka Gandhi vs Union Of India (1978), LegalBuddy Chat Component, Preset Legal Questions, Article 21 - Right to Life and Personal Liberty, Arrest & Detention Guidelines, Legal Buddy Project, Section 66A IT Act (+3 more)

### Community 1 - "Community 1"
Cohesion: 0.22
Nodes (2): handleNavClick(), scrollToTop()

### Community 2 - "Community 2"
Cohesion: 0.22
Nodes (10): Document Chunking Strategy, HuggingFace Embeddings (all-MiniLM-L6-v2), ingest_documents Pipeline, ChromaDB Vectorstore, format_docs Helper, Groq LLM (Llama-3.3-70b), Legal Expert Prompt Template, load_rag_chain (+2 more)

### Community 3 - "Community 3"
Cohesion: 0.33
Nodes (6): BaseModel, AnswerResponse, ask_question(), compare_answers(), CompareResponse, QuestionRequest

### Community 4 - "Community 4"
Cohesion: 0.5
Nodes (4): AnswerResponse, ask_question Endpoint, QuestionRequest, handleSend Chat Handler

### Community 10 - "Community 10"
Cohesion: 1.0
Nodes (2): CORS Middleware, Next.js Dev Origins Config

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (1): FastAPI Server

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (1): Root Layout

## Knowledge Gaps
- **14 isolated node(s):** `FastAPI Server`, `QuestionRequest`, `AnswerResponse`, `Document Chunking Strategy`, `format_docs Helper` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 1`** (10 nodes): `getFeatureConfig()`, `handleCompare()`, `handleFileUpload()`, `handleNavClick()`, `handleNewChat()`, `handleSend()`, `handleSendMessage()`, `ScaleIcon()`, `scrollToTop()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (2 nodes): `CORS Middleware`, `Next.js Dev Origins Config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (1 nodes): `FastAPI Server`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (1 nodes): `Root Layout`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `load_rag_chain` connect `Community 2` to `Community 4`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `Legal Buddy Project` connect `Community 0` to `Community 2`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Maneka Gandhi vs Union Of India (1978)` (e.g. with `D.K. Basu vs State of West Bengal (1996)` and `Vishaka & Ors vs State of Rajasthan (1997)`) actually correct?**
  _`Maneka Gandhi vs Union Of India (1978)` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `FastAPI Server`, `QuestionRequest`, `AnswerResponse` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._