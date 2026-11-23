# Ingestion report

Generated 2026-11-19T20:10:24+00:00  fingerprint `7a55b7cf2cc9542e`

- documents: 21  chunks: 26974
- last run: indexed 0, skipped 21, cache hits 0, 0.239s
- tokens/chunk: min 1, median 148, p95 198, max 200

## Chunks per document type

| doc_type | docs | chunks |
|---|---|---|
| constitution | 2 | 6616 |
| judgment | 2 | 2856 |
| report | 2 | 1033 |
| statute | 15 | 16469 |

## Per document

| doc_id | chunks | min tok | max tok |
|---|---|---|---|
| in-constitution-of-india | 4245 | 3 | 200 |
| in-companies-act-2013 | 3082 | 3 | 200 |
| in-dpdp-act-2023 | 114 | 39 | 200 |
| in-pmla-2002 | 424 | 4 | 200 |
| sc-puttaswamy-2017 | 1578 | 24 | 200 |
| sc-navtej-johar-2018 | 1278 | 26 | 200 |
| in-dicgc-act-1961 | 242 | 5 | 200 |
| in-ibc-2016 | 832 | 9 | 200 |
| dicgc-annual-report-2025-26 | 605 | 1 | 200 |
| rbi-nsfi-2025-30 | 428 | 1 | 200 |
| the-bharatiya-nagarik-suraksha-sanhita | 1455 | 27 | 200 |
| the-bharatiya-nyaya-sanhita | 734 | 19 | 200 |
| the-bharatiya-sakshya-adhiniyam | 324 | 17 | 200 |
| the-code-of-civil-procedure-1908 | 3567 | 3 | 200 |
| the-companies-act | 3082 | 3 | 200 |
| the-constitution-of-india | 2371 | 3 | 200 |
| the-digital-personal-data-protection-act-2023 | 114 | 39 | 200 |
| the-indian-contract-act | 645 | 4 | 200 |
| the-information-technology-act-2000 | 213 | 30 | 200 |
| the-motor-vehicles-act-1988 | 1217 | 3 | 200 |
| the-prevention-of-money-laundering-act-2002 | 424 | 4 | 200 |

## Needs attention

- zero or >3000 chunks: ['in-constitution-of-india', 'in-companies-act-2013', 'the-code-of-civil-procedure-1908', 'the-companies-act']
- low-text pages (OCR candidates): none
- chunk types: {'s1': 23085, 's2': 2856, 's3': 1033}
