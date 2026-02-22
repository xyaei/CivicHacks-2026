# BailLens

> **Immutable bail record accountability on Solana — built for Massachusetts, designed for everywhere.**

Court records get altered. Judges set wildly different bail for identical charges with no standardized data on their own patterns and no structured way to self-correct. BailLens fixes the accountability layer that was never built — certifying every bail decision permanently on Solana so tampering is instantly provable, giving judges a mirror to their own patterns, and giving defendants the tools to actually understand their rights.

---

## Table of Contents

- [The Problem](#the-problem)
- [What BailLens Does](#what-baillens-does)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Data](#data)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Solana Integration](#solana-integration)
- [AI & Voice](#ai--voice)
- [Ethics & Limitations](#ethics--limitations)
- [Future Work](#future-work)
- [Team](#team)

---

## The Problem

Pretrial detention in Massachusetts falls hardest on low-income defendants who cannot afford bail — people who lose jobs, housing, and child custody before a single charge is proven.

Three structural failures make this worse:

**No feedback loop for judges.** There is no standardized system that shows judges how their bail decisions compare to peers for similar charges in the same jurisdiction. Without that data, patterns of disparity are invisible even to the judges creating them.

**No tamper detection for court records.** Records exist in systems with no public integrity mechanism. Alterations can go unnoticed and unprovable.

**No accessible rights information.** Defendants and families have no fast, plain-language way to understand pretrial bail rights when they need them most.

BailLens addresses all three.

---

## What BailLens Does

BailLens ingests real Massachusetts court records and creates a permanent, tamper-proof audit trail on the Solana blockchain. Every bail decision gets cryptographically hashed and logged on-chain automatically. If anyone alters a court record after certification, the hash mismatch is instant, public, and permanent proof.

On top of that foundation, BailLens builds five layers of accountability:

1. A **public dashboard** so anyone can see bail patterns across districts, judges, and charge types
2. A **private judge dashboard** so judges can benchmark their own decisions against peers
3. A **Solana audit feed** with live blockchain certification and clickable Solana Explorer links
4. An **AI assistant with voice** so anyone can ask questions about bail data and get spoken answers
5. An **AI defender brief generator** so public defenders can build disparity arguments in seconds

---

## Features

### Public Dashboard
- Boston neighborhood bail heatmap — median bail by district, geographically rendered
- Statewide MA district view — compare bail patterns across the entire state
- Median bail by county and charge type — grid view exposing cross-county inconsistency
- Bail distribution graph and time-release trend charts
- Key stats: median bail, mean bail, highest-frequency offense types
- Judge lookup — select any judge, review their full case history and bail amounts

### Solana Audit Feed
- Real-time blockchain certification of all bail decisions and court records
- Every transaction hash is a clickable link to Solana Explorer — independently verifiable by anyone, no trust in BailLens required
- Automated sync pipeline — new records are certified on-chain without manual intervention
- Civic credential tokens minted on Solana for community members, defenders, and judges who engage with the system

### Judge Dashboard (Private)
- Secure judge login
- Peer benchmarking — see your bail decisions compared to the court average for equivalent charges
- Framed as professional development, not surveillance — comparative data is only visible to the judge themselves
- Judge access to this data is itself recorded immutably on-chain

### Community Bail Fund
- Smart contract deployed on Solana
- Every contribution and disbursement is publicly traceable on-chain
- No black box — donors, advocates, and defendants can verify fund flows independently

### AI Assistant with Voice
- Powered by Gemini (Q&A) and ElevenLabs (voice output)
- Answers questions about bail data, court patterns, and specific judges
- Reads responses aloud via ElevenLabs for a more accessible experience
- Does not give legal advice — scoped to data and system questions

### AI Defender Brief Generator
- Select a case, get a disparity argument in seconds
- Gemini compares the assigned bail to similar charges in the same jurisdiction
- Gives public defenders a data-driven starting point without hours of manual research

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, Mapbox, Chart.js |
| **Backend** | Python (data pipeline), Node.js |
| **Blockchain** | Solana, Anchor framework |
| **AI** | Google Gemini |
| **Voice** | ElevenLabs |
| **Cloud** | Vultr |
| **Data Source** | Civera (MA court records) |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Data Pipeline                      │
│  Civera Court Records → Python Normalization         │
│  → SHA-256 Hash → Solana On-Chain Certification      │
│  → Hash Registry (idempotency / dedup check)         │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
┌─────────▼──────────┐   ┌─────────▼──────────┐
│   Public Dashboard  │   │   Judge Dashboard   │
│   React + Mapbox    │   │   Private Login     │
│   Chart.js          │   │   Peer Benchmarking │
│   Solana Audit Feed │   │   On-chain Access   │
└─────────┬──────────┘   │   Log               │
          │               └────────────────────┘
          │
┌─────────▼──────────────────────────────────────┐
│              AI & Voice Layer                   │
│  Gemini → AI Assistant + Defender Brief Gen     │
│  ElevenLabs → Voice output in AI chat           │
└─────────────────────────────────────────────────┘
          │
┌─────────▼──────────┐
│   Solana Blockchain │
│   Record Hashes     │
│   Bail Fund SC      │
│   Civic Tokens      │
└─────────────────────┘
```

All services deployed on **Vultr** with continuous automated sync.

---

## Data

**Source:** 5,871 real Massachusetts court records from [Civera](https://www.civera.com)

**Fields available:**
- Defendant name
- Judge name
- Bail amount
- Charge type
- Court location / district
- Date

**What the data does not include:** Race and ethnicity data was not present in the available records. This is a named limitation — see [Ethics & Limitations](#ethics--limitations). Geographic and judge-level analysis surfaces meaningful disparity patterns, but cannot be used to make direct claims about racial bias in individual decisions.

**Derived metrics computed from raw data:**
- Median and mean bail by district, judge, county, and charge type
- Bail distribution across Boston neighborhoods and statewide
- Time-release trends
- Highest-frequency offense types by jurisdiction

---

## Getting Started

### Prerequisites

- Node.js v18+
- Python 3.10+
- Solana CLI
- Anchor CLI
- A Vultr account (for deployment)
- Gemini API key
- ElevenLabs API key

### Installation

```bash
# Clone the repo
git clone https://github.com/your-org/baillens.git
cd baillens

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
pip install -r requirements.txt

# Install Solana program dependencies
cd ../solana
npm install
```

### Running Locally

```bash
# Start the frontend
cd frontend
npm run dev

# Start the backend API
cd backend
python main.py

# Run the blockchain sync pipeline
python pipeline/sync.py

# Deploy Solana program (localnet)
cd solana
anchor build
anchor deploy
```

---

## Environment Variables

Create a `.env` file in both `frontend/` and `backend/` directories.

**Backend `.env`:**
```
GEMINI_API_KEY=your_gemini_key
ELEVENLABS_API_KEY=your_elevenlabs_key
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_KEYPAIR_PATH=./keypair.json
DATABASE_URL=your_db_url
```

**Frontend `.env`:**
```
VITE_MAPBOX_TOKEN=your_mapbox_token
VITE_API_BASE_URL=http://localhost:8000
VITE_SOLANA_NETWORK=mainnet-beta
```

---

## Project Structure

```
baillens/
├── frontend/               # React app
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard/      # Public heatmaps, charts, stats
│   │   │   ├── JudgeLookup/    # Judge case history view
│   │   │   ├── AuditFeed/      # Live Solana audit feed
│   │   │   ├── Assistant/      # AI chat with voice output
│   │   │   └── JudgePortal/    # Private judge dashboard
│   │   └── pages/
├── backend/                # Python API + data pipeline
│   ├── api/                # FastAPI routes
│   ├── pipeline/
│   │   ├── ingest.py       # Civera record normalization
│   │   ├── hash.py         # SHA-256 hashing logic
│   │   └── sync.py         # Automated Solana sync
│   ├── ai/
│   │   ├── assistant.py    # Gemini AI chat
│   │   └── brief.py        # Defender brief generator
│   └── voice/
│       └── elevenlabs.py   # Voice output for AI assistant
├── solana/                 # Anchor smart contracts
│   ├── programs/
│   │   ├── bail_audit/     # Record hash certification
│   │   ├── bail_fund/      # Community bail fund SC
│   │   └── civic_token/    # Credential token minting
│   └── tests/
└── data/                   # Processed court records (anonymized)
```

---

## Solana Integration

### Why Solana — not just hype

The blockchain layer exists for one specific reason: **to make retroactive tampering of bail records mathematically impossible.**

Every bail decision in the dataset is hashed (SHA-256) and written permanently on-chain. If a court record is modified after certification — even a single character — the hash mismatch is instant, public, and permanent proof. No one needs to trust BailLens. Anyone can verify a record's integrity by recomputing the hash and checking it against the on-chain value via Solana Explorer.

Solana was chosen for speed, low transaction cost, and a mature developer ecosystem via Anchor.

### On-chain components

| Program | Purpose |
|---|---|
| `bail_audit` | Stores SHA-256 hashes of certified bail records |
| `bail_fund` | Community bail fund — all contributions and disbursements publicly traceable |
| `civic_token` | Mints participation credentials for judges, defenders, and community members |

### Hash registry

A local hash registry prevents duplicate on-chain submissions. Before any record is submitted, the pipeline checks whether that hash has already been certified. This ensures idempotency across sync runs and keeps the on-chain record clean.

### Audit feed

The frontend audit feed polls for new on-chain certifications in real time. Every entry displays the record hash, timestamp, and a direct link to the transaction on **Solana Explorer** — so the verification step is one click, not a technical exercise.

---

## AI & Voice

### Gemini
Used for two distinct tasks:

**AI assistant** — answers questions about Massachusetts bail data, court patterns, and specific judges. Explicitly does not give legal advice — scoped to data and system questions.

**Defender brief generator** — given a case, generates a disparity argument by comparing the assigned bail to similar charges in the same jurisdiction. Produces a structured argument in seconds, which the defender reviews, edits, and decides whether to use.

### ElevenLabs
Reads the AI assistant's responses aloud using natural voice synthesis. When the assistant answers a question in the chat, ElevenLabs voices the response — making the tool more accessible to users who find dense text difficult to parse, and creating a more natural interaction experience.

---

## Ethics & Limitations

### What the data can and cannot say

BailLens does not make decisions — it surfaces data. Geographic or judge-level disparity in the data does not constitute proof of individual bias. Without race and ethnicity data, direct claims about racial disparity cannot be supported by this dataset. Every visualization is labeled with its source and scope.

### Judge dashboard design

Comparative data in the judge dashboard is private to each individual judge. No judge's benchmarking data is publicly visible. The design intent is professional self-reflection — not public ranking, naming, or shaming.

### AI transparency

The assistant and brief generator are explicitly scoped tools. Both tell users what they are and are not. The brief generator produces statistical comparisons as a starting point for human argument, never as an automated recommendation or risk score.

### Data privacy

All court record data is from the public legal record. No personal data is collected from platform users. The Solana layer stores cryptographic hashes only — not personally identifiable content. There is no user account system for the public dashboard or AI assistant.

---

## Future Work

- **Race and ethnicity data** — pursue public records requests to enable the full disparity analysis the system was designed for
- **Additional states** — the architecture is state-agnostic; expansion is straightforward given data access
- **Defender office integration** — embed the brief generator into existing public defender case management workflows
- **SMS / phone interface** — extend accessibility to users without smartphone or internet access
- **Legal review** — assess how blockchain-certified records interact with discovery and evidence rules in MA courts
- **Court administration partnerships** — pilot the judge benchmarking dashboard with willing participants

---

## Team

Built at JusticeHack.

---

## License

MIT License — see `LICENSE` for details.

---

> *BailLens doesn't change the law. It changes the information environment in which the law is applied.*