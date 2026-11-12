# Experiment Log

| Run | Date | Config summary | Hit@5 | Recall@8 | MRR | Faithfulness | Answer rel. | Abstention acc. | Citation acc. | p50 / p95 latency | Cost/query | Keep? | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| B0 | | S0 + MiniLM + dense top-k + prompt v1 | | | | | | | | | | baseline | |
| B1 | | + structure-aware chunking | | | | | | | | | | | |
| B1b | | + contextual prefix | | | | | | | | | | | |
| B2 | | + embedding model change | | | | | | | | | | | |
| B3 | | + hybrid (dense + sparse, RRF) | | | | | | | | | | | |
| B4 | | + filters / diversity | | | | | | | | | | | |
| B5 | | + reranker | | | | | | | | | | | |
| B6 | | + query understanding | | | | | | | | | | | |
| G1 | | + new prompt + citations | | | | | | | | | | | |
| P_final | | + abstention + context settings | | | | | | | | | | | |

## Per-Category Results Template (repeat per key run)

| Category | Questions | Hit@5 | Recall@8 | MRR | Faithfulness | Notes |
|---|---|---|---|---|---|---|
| Exact section lookup | 15 | | | | | |
| Conceptual statute | 15 | | | | | |
| Case-law principles | 15 | | | | | |
| Old-vs-new law | 10 | | | | | |
| Multi-document / multi-hop | 10 | | | | | |
| Banking procedural | 15 | | | | | |
| Definitions / thresholds | 5 | | | | | |
| Out-of-scope / unanswerable | 10 | | | | | |
| Ambiguous / adversarial | 5 | | | | | |

## Rules
- Log failures too.
- Never tune on the test split.
- Record git commit, config fingerprint, prompt version, and model names for every row.
