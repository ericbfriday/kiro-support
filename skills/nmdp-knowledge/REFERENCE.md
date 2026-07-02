# NMDP Knowledge Reference

## Prerequisites

This skill requires MCP servers that provide access to Confluence, Jira, and GitLab. The specific server implementations are flexible — any tool that provides equivalent search and read capabilities will work.

### Required capabilities

| Capability | Example tools | What it needs to do |
|---|---|---|
| Confluence search & read | `lore`, `atlassian-confluence-dc`, Atlassian Rovo | Search pages by CQL, read page content, navigate page trees |
| Jira search & issue read | `@matchsync/jimi`, any Jira MCP server | Search issues by JQL, read issue details and comments |
| GitLab code search | `gitlab-bethematch`, any GitLab MCP server | Search blobs/code, semantic code search, read repos |

### Tool mapping

If your MCP servers differ from the defaults, map operations accordingly:

| Operation | Default tool | Alternatives |
|---|---|---|
| Search Confluence pages | `search_confluence` (lore) | `confluence_searchContent` (atlassian-confluence-dc), Rovo search |
| Read Confluence page | `get_page_content` (lore) | `confluence_getContent` (atlassian-confluence-dc) |
| Navigate page hierarchy | `get_page_tree` (lore) | `confluence_getContent` with expand=children |
| Search Jira issues | JQL via `@matchsync/jimi` | Any Jira MCP with JQL support |
| Search GitLab code | `search` (gitlab-bethematch) | Any GitLab MCP with blob/code search |
| Semantic code search | `semantic_code_search` (gitlab-bethematch) | Equivalent natural-language code search |

### Minimum MCP configuration (example)

These are the MCP servers used in the reference environment. Replace with equivalents as needed:

```json
{
  "mcpServers": {
    "lore": {
      "comment": "Confluence search and page reading"
    },
    "matchsync-jimi": {
      "comment": "Jira issue search, sprint/board navigation, issue management"
    },
    "gitlab-bethematch": {
      "comment": "GitLab code search, merge requests, pipelines"
    },
    "atlassian-confluence-dc": {
      "comment": "Alternative/additional Confluence access (Data Center edition)"
    }
  }
}
```

The skill will work with any combination that covers the three capabilities above. If only some are available, the search strategy degrades gracefully — skip unavailable sources and rely on what's configured.

---

## Confluence Space Directory

### Engineering & Development Teams

| Key | Name | Focus | Home Page ID |
|-----|------|-------|-------------|
| MAT | MatchSync | Core platform team — Patient Import, SearchLite, CARL, PMT, IFC, SEL, CRA, JiXI, ACIS, Burden Study | 240124022 |
| SMC | Search Match Connect | WMDA integration, search/match orchestration, order flows | 336268267 |
| GSD | Genomic Services | HLA typing tools, CORE app, Typing Curator, genotyping | 149029958 |
| SMP | HapLogic | Match algorithm, haplotype frequency, imputation | 16220362 |
| NSM | Non-Member Source Management | NMSM app, international donor/cord management | 23102368 |
| EMDIS | EMDIS | European Marrow Donor Information System messaging | 266931373 |
| DRE | Donor Recommendation Engine | Donor ranking and scoring | 446071997 |
| MPI | MatchSync Patient Import | Dedicated Patient Import space | 229974290 |
| MS | MatchSource | Donor matching application | 50072359 |
| ITNBD | MatchSource BioTherapies | BioTherapies (formerly NBD) | 50069766 |
| NMSMC | NMSM Cloud | NMSM Cloud Team | 252805387 |
| DTS | Platform Services | Shared platform/DevOps | 18940898 |
| CS | CordSource | Cord blood management | 145687481 |

### Architecture & Governance

| Key | Name | Focus | Home Page ID |
|-----|------|-------|-------------|
| EA | Enterprise Architecture | Solution outlines, architecture standards, ARB | 559480 |
| EF | Enterprise FHIR | FHIR governance and adoption | 296431698 |
| PE | Systems Architecture CoP | Architecture community of practice | 227741489 |
| ASCCP | API Service Catalog CoP | API governance | 319258705 |
| EINT | Enterprise Integrations | Integration patterns | 281615164 |
| SDLCP | SDLC | Software Development Life Cycle process docs | 190482233 |

### Data & Analytics

| Key | Name | Focus | Home Page ID |
|-----|------|-------|-------------|
| DGOV | Data Governance | Canonical glossary, data stewardship | 401050692 |
| EBDS | Data & Business Analytics (DnA) | BI, reporting, data warehouse | 44564838 |
| BIO | Bioinformatics | Research, ML models, HLA-ProtBERT, TransPhaser | 559482 |
| BIA | BI & Analytics | Business intelligence | 62788962 |

### Infrastructure & Operations

| Key | Name | Focus | Home Page ID |
|-----|------|-------|-------------|
| IN | Infrastructure | Networks, servers, IT glossary | 559478 |
| CLOUD | Cloud | AWS/Azure cloud | 227737699 |
| IS | IT Solutions | General IT, large glossary | 559476 |
| SAD | Secure Application Development | Security standards | 40010553 |
| SEC | Salesforce Experience Cloud | Customer-facing portals | 382763114 |

### Business & Product

| Key | Name | Focus | Home Page ID |
|-----|------|-------|-------------|
| PROD | Product Group | Product management, backlog overviews | 62790353 |
| INTL | Global Solutions | B2B Gateway, international registries | 15630401 |
| EO2F | Enterprise Order to Fulfillment | Order lifecycle, business party | 218138612 |
| RS | Registry Services | Donor registry operations | 75401385 |
| CDE | Customer Digital Experience | Customer-facing digital products | 260281162 |
| SMO | Provider Services IT | Provider services multi-team group | 260283263 |

### Support & Process

| Key | Name | Focus | Home Page ID |
|-----|------|-------|-------------|
| QA | Quality Assurance | QA standards and processes | 57481041 |
| RELEASE | Release Management | Release coordination | 50073985 |
| AGILE | Agile | Agile practices | 57491083 |
| ACOE | Agile CoE | Agile Center of Excellence | 487919416 |
| AECE | AI Engineering CoE | AI/ML best practices | 446320413 |

---

## MatchSync Applications (under MAT space, page 240124046)

| Application | Page ID | Description |
|-------------|---------|-------------|
| Patient Import (PI) | 240124047 | Patient registration and HLA import |
| SearchLite | 240124941 | Lightweight donor search UI |
| CARL | 260281038 | Clinical Assessment and Results Library |
| Property Management Tool (PMT) | 446078741 | Property/configuration management |
| International Forms Creation (IFC/IFA) | 382894742 | WMDA forms generation |
| Secure Enterprise Login (SEL) | 350487115 | Okta/OIDC authentication |
| CRA (Smart on FHIR) | 369330987 | EHR-integrated clinical research app |
| JiXI (Jira Xray Integration) | 266930642 | Test automation integration |
| ACIS | 350389902 | Application configuration |
| Burden Study (AI/OCR) | 416711531 | Document parsing with AI |

---

## Domain Glossary

### Core Concepts

| Term | Definition |
|------|-----------|
| HLA | Human Leukocyte Antigen — proteins/markers on cells making up tissue type. Used to match patients and donors for transplant. |
| Allele | One form of a gene at a specific chromosome position. Core unit for HLA matching. Example: A*24:02:01:02L |
| Haplotype | Combination of alleles at adjacent chromosome locations inherited together from one parent. |
| Genotype | Full genetic makeup — a haplotype pair (from both parents) or single-locus allele pair. |
| GL String | Genotype List String — grammar for HLA/KIR typing results. Uses `+` (AND), `|` (OR), `/` (ambiguity), `^` (locus separator), `~` (phased). |
| MAC | Multiple Allele Code — compressed representation of ambiguous HLA typing. 2+ alpha chars (O, I, Q, L omitted). |
| MACD | MAC Designation — full nomenclature label incorporating a MAC (e.g., HLA-A*01:AB). |
| HML | Histoimmunogenetics Markup Language — NMDP-owned XML for sharing HLA/KIR data. |
| Resolution | Level of HLA typing detail: Low (antigen/F1), Medium (common alleles), High (single allele). |
| Match Grade | 1-char indicator: A=allele match, P=potential, L=allele mismatch, M=antigen mismatch. |

### Organizations & Standards

| Term | Definition |
|------|-----------|
| NMDP | National Marrow Donor Program (organization, formerly public name "Be The Match") |
| BTM | Be The Match — former/retired public name for NMDP |
| WMDA | World Marrow Donor Association — defines HLA nomenclature guidelines |
| CIBMTR | Center for International Blood and Marrow Transplant Research |
| IMGT | International ImMunoGeneTics — reference database for genomic/HLA data |
| EMDIS | European Marrow Donor Information System — inter-registry messaging network |
| GRID | Global Registration Identifier for Donors — universal donor ID |
| HRSA | Health Resources and Services Administration — US government contract authority |

### Cell Sources & Transplant

| Term | Definition |
|------|-----------|
| BMT | Blood and Marrow Transplant |
| PBSC | Peripheral Blood Stem Cells — collected via apheresis |
| CBU | Cord Blood Unit — blood from umbilical cord/placenta |
| ADCU | Adult Donor Cryopreserved Units — frozen product (e.g., from Ossium partnership) |
| CT | Confirmatory Typing — verification of donor HLA at higher resolution |
| Workup | Process after donor selection: health history, IDM testing, logistics |
| GVHD | Graft versus Host Disease — transplanted cells react against patient |
| Engraftment | Stage when transplanted cells start growing and making new blood cells |

### Systems & Applications

| Term | Definition |
|------|-----------|
| MatchSource | Primary donor matching application (Angular, Nx monorepo) |
| SearchLite | Lightweight donor search UI (MatchSync team) |
| HapLogic | Match algorithm — haplotype frequency, imputation, donor scoring |
| NMSM | Non-Member Source Management — manages international donors/cords |
| DOTS | Donor Optimization for Transplant Success — strategic initiative for donor readiness features |
| DRE | Donor Recommendation Engine — donor ranking/scoring |
| CORE | Genomic Reference Data application (Genomic Services team) |
| StarLink/SLW | Legacy search application (being retired) |
| CARL | Clinical Assessment and Results Library |
| CRA | Clinical Research App (Smart on FHIR, EHR integration) |
| SEL | Secure Enterprise Login (Okta/OIDC) |
| IFC/IFA | International Forms Creation/Application |
| PMT | Property Management Tool |

### Technical Concepts

| Term | Definition |
|------|-----------|
| FHIR | HL7 Fast Healthcare Interoperability Resources — healthcare data standard |
| SMART on FHIR | Framework for EHR-integrated apps |
| GRD | Genomic Reference Database — manages alleles, XX groups, serology, etc. |
| GRO | Genomic Reference Object — abstract concept unifying allele, serology, P&G groups, etc. |
| XX Group | Allele grouping by gene locus + allele family (e.g., HLA-A*01:XX) |
| P Group | Collection of alleles encoding same ARS protein sequence |
| G Group | Collection of alleles with identical ARS DNA sequence |
| ARS | Antigen Recognition Site — peptide binding domains |
| NGS | Next-Generation Sequencing — high-throughput DNA sequencing |
| IDM | Infectious Disease Marker — screening test results |
| EID | Enterprise Identifier — universal NMDP identifier |
| PTR | Preferred Test Result — best typing result chosen via business rules |
| Match Determinant | Replacement for legacy "Search Determinant" — defines match grade comparison |

---

## Search Examples

### Finding architecture docs for an application

```
# Search in the team's space
search_confluence cql: 'title ~ "architecture" AND space = "MAT"'

# Or search the EA repository of architecture docs
search_confluence cql: 'title ~ "Application Architecture" AND space = "EA"'

# SMC architecture
get_page_content pageId: "349740682"  # SMC Application Architecture Document
```

### Finding glossary definitions

```
# Canonical business glossary
get_page_content pageId: "400560423"  # Business Term and Acronym Glossary (DGOV)

# IT/technical terms (500+ entries, alphabetical)
get_page_content pageId: "7210678"   # IT Solutions Glossary/Acronyms

# Scientific/genomic terms
get_page_content pageId: "149030595" # Genomic Services Glossary
```

### Navigating team spaces

```
# Explore MatchSync apps
get_page_tree pageId: "240124046"  # MAT > Applications

# Explore MatchSync engineering docs
get_page_tree pageId: "257426633"  # MAT > Engineering

# Explore Search Match Connect
get_page_tree spaceKey: "SMC"
```

### Finding current Jira work

```
# What's in progress for MatchSync
search_jql: 'project = MAT AND status = "In Progress"'

# Recent FHIR work across projects
search_jql: 'text ~ "FHIR" AND updated >= -30d AND status != Done'

# Sprint work for a specific app
search_jql: 'project = MAT AND labels = "PMT" AND sprint in openSprints()'
```

### Finding code in GitLab

```
# Search for HapLogic-related code
search scope: "blobs" search: "HapLogic" group_id: "bethematch"

# Find FHIR resource implementations
semantic_code_search id: "bethematch/appdev/matchsync/matchsync" q: "FHIR patient resource"

# Find how auth is implemented
search scope: "blobs" search: "okta" project_id: "bethematch/appdev/matchsync/matchsync-libs"
```

---

## GitLab Organization Structure

```
bethematch/
├── appdev/
│   ├── matchsync/              ← Primary platform team
│   │   ├── matchsync           (40167629) React/TS monorepo
│   │   ├── matchsync-libs      (71724994) Shared libraries
│   │   ├── ifa/source          (56338364) IFC backend (tRPC, Prisma)
│   │   ├── property-management-tool/ (74742686)
│   │   ├── jimi                (80107355) Jira MCP integration
│   │   ├── matchsync-smart-pi  (66840030) Angular smart-PI
│   │   ├── atara/              (55826249) Atara frontend
│   │   └── ehr-integration-apps/
│   ├── matchsource/
│   │   └── frontend            (25601465) MatchSource Angular
│   ├── gen/
│   │   ├── core/               typing-curator-ui, mac-services-ui
│   │   └── hml/                hml-web
│   ├── cra/                    (39617210) CRA frontend
│   └── b2b-gateway/
├── library/
│   └── gitlab-templates/       Shared CI templates
└── dcs/
    └── aws/                    Infrastructure-as-code
```
