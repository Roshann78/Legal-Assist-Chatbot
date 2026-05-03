# Graph Report - src  (2026-05-03)

## Corpus Check
- 3 files · ~528 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 14 nodes · 14 edges · 2 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]

## God Nodes (most connected - your core abstractions)
1. `AnswerResponse` - 3 edges
2. `CompareResponse` - 3 edges
3. `QuestionRequest` - 2 edges
4. `ask_question()` - 2 edges
5. `compare_answers()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `AnswerResponse` --inherits--> `BaseModel`  [EXTRACTED]
  app.py →   _Bridges community 1 → community 0_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.5
Nodes (2): AnswerResponse, ask_question()

### Community 1 - "Community 1"
Cohesion: 0.5
Nodes (4): BaseModel, compare_answers(), CompareResponse, QuestionRequest

## Knowledge Gaps
- **Thin community `Community 0`** (5 nodes): `app.py`, `AnswerResponse`, `ask_question()`, `health()`, `root()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AnswerResponse` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `CompareResponse` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `QuestionRequest` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._