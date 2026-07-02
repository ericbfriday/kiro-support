---
name: nmdp-knowledge
description: Search NMDP internal knowledge across Confluence, Jira, and GitLab for domain answers. Provides NMDP/Be The Match domain terminology, Confluence space navigation, and search strategy. Use when encountering NMDP domain terms (HLA, allele, haplotype, GRID, EMDIS, FHIR, GL String, HML, MAC, donor, recipient, transplant), when another skill needs organizational context, when answering questions about NMDP systems or processes, or before asking the user a question that internal docs might answer.
---

# NMDP Knowledge

Search NMDP internal sources to answer domain questions before asking the user. Use this as a pre-step in any skill that encounters NMDP-specific terminology or needs organizational context.

## Search strategy

Pick the source based on question type:

| Question type | Search first | Tool |
|---|---|---|
| Architecture, design, domain concepts, glossary | Confluence | `search_confluence` / `get_page_content` via lore |
| Who's working on X, status, sprint work | Jira | `search_jql` via matchsync-jimi |
| Code patterns, implementations, repo structure | GitLab | `search` / `semantic_code_search` via gitlab-bethematch |
| How-to, onboarding, runbooks | Confluence | `search_confluence` |
| Cross-team dependencies, integrations | Confluence → then GitLab | Both |

## Confluence navigation

NMDP Confluence uses a team-owns-space pattern. Each team space has subtrees:

```
{Team Space}/
├── Team/          ← People, working agreements
├── Applications/  ← App-specific docs (Design, HowTo, Support, DevOps)
├── Engineering/   ← Cross-app tech docs (FHIR, security, Kubernetes)
├── Business/      ← Solution designs, requirements
└── Documentation/ ← General reference
```

### Key spaces by domain

- **MAT** (MatchSync) — Patient Import, SearchLite, CARL, PMT, IFC, SEL, CRA, JiXI, ACIS
- **SMC** (Search Match Connect) — WMDA integration, search/match orchestration
- **GSD** (Genomic Services) — HLA typing, CORE, genotyping tools
- **SMP** (HapLogic) — Match algorithm, haplotype frequency
- **NSM** (Non-Member Source Mgmt) — NMSM, international donor management
- **EMDIS** — European registry messaging
- **EA** (Enterprise Architecture) — Solution outlines, architecture standards
- **EF** (Enterprise FHIR) — FHIR governance
- **DGOV** (Data Governance) — Canonical glossary, data stewardship
- **IS** (IT Solutions) — IT glossary, general IT docs
- **DRE** (Donor Recommendation Engine) — Donor ranking/scoring

### Glossary sources (authority order)

1. **Business Term and Acronym Glossary** — page 400560423 in DGOV (canonical)
2. **IT Solutions Glossary/Acronyms** — page 7210678 in IS (500+ terms)
3. **Genomic Services Glossary** — page 149030595 in GSD (scientific)

## Quick domain reference

See [REFERENCE.md](REFERENCE.md) for the full glossary. Key terms:

- **HLA** — Human Leukocyte Antigen; tissue typing used to match patients and donors
- **Allele** — One form of a gene at a specific locus; core matching unit
- **Haplotype** — Set of alleles inherited together from one parent
- **GL String** — Genotype List String; grammar for HLA/KIR typing results
- **MAC** — Multiple Allele Code; compressed ambiguous typing representation
- **HML** — Histoimmunogenetics Markup Language; XML for sharing HLA/KIR data
- **GRID** — Global Registration Identifier for Donors
- **EMDIS** — European Marrow Donor Information System
- **WMDA** — World Marrow Donor Association
- **FHIR** — HL7 Fast Healthcare Interoperability Resources
- **CBU** — Cord Blood Unit
- **PBSC** — Peripheral Blood Stem Cells
- **CIBMTR** — Center for International Blood and Marrow Transplant Research
- **DOTS** — Donor Optimization for Transplant Success

## Search patterns

```
# Confluence: find architecture docs for an app
search_confluence cql: 'title ~ "architecture" AND space = "MAT"'

# Confluence: find glossary definitions
search_confluence cql: 'text ~ "GL String" AND (space = "IS" OR space = "DGOV")'

# GitLab: find code implementing a concept
search scope: "blobs" search: "HapLogic" project_id: "bethematch/appdev/matchsync"

# Jira: find current work on a topic
search_jql: 'project = MAT AND text ~ "FHIR" AND status != Done'
```

## When used by other skills

Other skills invoke this knowledge implicitly. When grilling, diagnosing, or implementing and you encounter an unfamiliar NMDP term or need to understand how a system works:

1. Check the glossary terms above first
2. Search Confluence for architecture/design docs
3. Search GitLab for existing implementations
4. Only ask the user if internal sources don't answer the question
