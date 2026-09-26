# HydroTrace

**Evidence-Driven Blockchain Intelligence for VASP Attribution**

---

## Overview

Law-enforcement and financial compliance investigators often begin with a suspicious cryptocurrency wallet address but face significant obstacles determining which centralized exchange, custodian, or Virtual Asset Service Provider (VASP) the illicit funds eventually reach.

Tracing blockchain transactions manually across multiple intermediate hops is time-consuming, labor-intensive, and prone to analytical oversight. Furthermore, existing commercial address labels are frequently incomplete, proprietary, stale, or mutually conflicting.

**HydroTrace** is an investigative decision-support prototype designed to help investigators trace suspicious cryptocurrency wallets through a bounded transaction graph and identify nearby VASP candidates using verifiable, multi-source evidence.

> **Important Boundary:** HydroTrace does not claim to identify the real-world owner or personal identity of a cryptocurrency wallet. On-chain attribution establishes transaction infrastructure relationships, not human identity.

---

## The Core Idea

HydroTrace rejects simplistic, black-box attribution assertions that return an unexplained conclusion:

```text
Wallet → Exchange X
```

Instead, HydroTrace provides a fully transparent, auditable evidence trail:

```text
Wallet
  ↓
Transaction Path
  ↓
VASP Candidates
  ↓
Evidence Sources
  ↓
Evidence Score (X/100)
  ↓
Attribution Boundary
  ↓
Conflict / Review Status
```

The system provides an **evidence-oriented attribution** rather than a single unexplained answer, allowing investigators to understand *why* an entity was suggested, inspect underlying transfers, compare divergent intelligence sources, and assess evidentiary sensitivity.

---

## Why Attribution Is Difficult

Attributing blockchain activity to regulated Virtual Asset Service Providers presents unique technical and evidentiary challenges:

* **Pseudonymity:** Blockchain addresses are cryptographic public keys that do not directly reveal an individual's personal identity or geographic jurisdiction.
* **Complex Exchange Architectures:** VASPs manage thousands of deposit addresses, dynamic aggregation accounts, and operational hot/cold wallet sweepers.
* **Stale or Outdated Labels:** Wallet roles change as exchanges migrate infrastructure, deprecate addresses, or change custody vendors.
* **Source Disagreements:** Different blockchain intelligence providers, public registers, and explorer tags frequently attribute the same address to conflicting entities.
* **Peeling Chains and Intermediaries:** Funds frequently pass through multiple intermediate wallets, unhosted mixers, or split transactions before arriving at an exchange.
* **Absence of Proof of Ownership:** A transaction path demonstrates historical on-chain transfer relationships, not continuous custody or common wallet ownership.

---

## How HydroTrace Works

HydroTrace executes an end-to-end, automated 11-step investigative workflow:

```text
Wallet Input
    ↓
Validation
    ↓
Blockchain Retrieval
    ↓
Bounded Graph Tracing
    ↓
VASP Candidate Detection
    ↓
Evidence Scoring
    ↓
Evidence Comparison
    ↓
Conflict Detection
    ↓
Attribution Boundary
    ↓
Attribution Stress Test
    ↓
Evidence Export
```

### 1. Wallet Input
The investigator submits a target cryptocurrency address, selects the asset (e.g. USDT TRC-20), and configures bounded trace limits (maximum hops, node limits, edge limits).

### 2. Validation
HydroTrace validates the address format using cryptographic checksum verification (e.g., Base58Check algorithm for TRON mainnet addresses) and ensures network parameter compatibility.

### 3. Blockchain Retrieval
The prototype connects directly to live blockchain node providers (such as the TRON Grid API) to fetch real, confirmed transfer histories and raw event logs.

### 4. Bounded Graph Tracing
The Graph Engine constructs a bounded Breadth-First Search (BFS) directed graph following transactions up to 2–3 hops deep, tracking exact transferred amounts, asset denominations, transaction hashes, and hop levels while avoiding combinatorial explosion.

### 5. VASP Candidate Detection
Discovered on-chain addresses are cross-referenced against a curated VASP intelligence dataset containing verified deposit addresses, operational hot wallets, and institutional custody points.

### 6. Evidence Scoring
Each candidate receives an explainable, rule-based **Evidence Score: X/100** computed from factual parameters:
* Direct address match (`+50`)
* Verified official proof of reserves / exchange registry (`+20`)
* Proximity / hop distance factor (`+10` to `+30`)
* Conflict penalty deduction (`-25`)

> **Evidence Score is not a probability.** It reflects factual provenance, source corroboration, and graph proximity—never a statistical probability of guilt or ownership.

### 7. Evidence Comparison
All supporting intelligence sources for each candidate are displayed side-by-side, detailing source type (`OFFICIAL`, `EXPLORER`, `GOVERNMENT`), documentation reference, and reliability grade (`HIGH`, `MEDIUM`, `LOW`).

### 8. Conflict Detection
If divergent intelligence sources associate the same address with different VASP entities (e.g., HTX vs. Poloniex), HydroTrace surfaces the conflict explicitly, applies a score penalty, and flags the case as **Analyst Review Required** instead of silently selecting one entity.

### 9. Attribution Boundary
Classifies available evidence into defined tiers:
* **Direct Evidence:** Known VASP-associated infrastructure supported by verified proof.
* **Inferred Association:** Relationship inferred from transaction path proximity without direct verified label.
* **Unknown / Insufficient Evidence:** Insufficient evidence to establish a reliable VASP association.

### 10. Attribution Stress Test
Provides sensitivity analysis modeling how the attribution might evolve under new intelligence:
* **Factors that could strengthen attribution:** Direct deposit sweep confirmation, official proof-of-reserves audit match.
* **Factors that could weaken attribution:** Unidentified intermediary mixer hops, conflicting custody declarations.
* **Current Review Trigger:** Explains what specific event requires human analyst validation.

### 11. Evidence Export
Investigators can export hash-sealed documentation in multiple formats for case files and lawful disclosure workflows.

---

## Key Features

* **Real Blockchain Data Retrieval:** Fetches live TRON USDT (TRC-20) transfers with exact timestamps, amounts, and transaction hashes.
* **Bounded BFS Transaction Graph:** Controls traversal breadth and depth (1–3 hops, up to 250 nodes) to maintain investigation scope.
* **Multi-Hop Path Tracing:** Preserves provenance steps from target root to terminal VASP deposit nodes.
* **Curated VASP Intelligence Registry:** Local verified dataset of exchange infrastructure.
* **Explainable Evidence Score:** Transparent rule-based scoring (0–100) with line-item factor attribution.
* **Multi-Source Evidence Comparison:** Side-by-side display of corroborating sources and reliability levels.
* **Evidence Conflict Detection:** Highlights conflicting custody assertions with prominent analyst review alerts.
* **Attribution Boundary Classification:** Strict three-tier categorization (Direct Evidence, Inferred Association, Unknown).
* **Attribution Stress Test:** Identifies strengthening and weakening evidentiary vectors.
* **Exportable Investigation Report:** Self-contained, printable HTML report with complete transaction traces.
* **Deterministic Evidence JSON Bundle:** Canonical JSON export sealed with a SHA-256 cryptographic digest.
* **SAHYOG-Compatible Prototype Disclosure Payload:** Structured JSON payload ready for lawful Section 91 CrPC / LEA customer disclosure workflows.
* **Human-in-the-Loop Safeguards:** Requires human analyst evaluation when conflicts or low-confidence associations are detected.

---

## Attribution Boundary

HydroTrace adheres to strict evidentiary boundaries:

| Boundary Class | Description |
| :--- | :--- |
| **DIRECT EVIDENCE** | Target or terminal node matches a verified VASP deposit/hot-wallet address supported by official transparency reports or verified explorer badges. |
| **INFERRED ASSOCIATION** | Target funds traverse 2–3 hops toward an identified service cluster; relationship is inferred through on-chain transfer velocity without direct label match on the root address. |
| **UNKNOWN** | Insufficient evidence to establish a VASP association within the bounded search depth. Displayed as **Insufficient Evidence**. |

> **Mandatory Disclaimer:** On-chain attribution does not establish the real-world identity or ownership of the wallet.

---

## Technology Stack

The application is built on modern, lightweight, production-grade open-source technologies:

* **Frontend Framework:** React 19 with TypeScript
* **Frontend Build Tool:** Vite 6
* **Frontend Routing:** React Router v7
* **Styling:** Vanilla Tailwind CSS with custom dark forensic UI theme
* **UI Icons:** Lucide React
* **Backend Framework:** Node.js with Express 4
* **Backend Language:** TypeScript (compiled via `tsc` to ES modules)
* **Runtime Execution:** `tsx` for high-performance development and native TypeScript execution
* **Database:** MongoDB via Mongoose (configured for investigation persistence)
* **Blockchain Integration:** TRON Grid API adapter (`TronProvider`) supporting USDT TRC-20 contract (`TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`)
* **Testing Framework:** Node.js native test runner via `tsx --test`
* **Process Management:** `concurrently` for unified local dev execution

---

## Architecture

```text
User / Investigator
        ↓
HydroTrace Frontend (React + Vite + Tailwind)
        ↓  REST API (JSON over HTTP)
Investigation API (Express + TypeScript)
        ↓
   ├── Blockchain Provider Adapter (TronProvider / TRON Grid)
   ├── Transaction Graph Engine (Bounded BFS Traversal)
   ├── VASP Candidate Engine (Curated Intelligence Matcher)
   ├── Evidence & Conflict Engine (Multi-Source Scrutiny & Stress Test)
   └── Report & Evidence Bundle Service (Canonical JSON & SHA-256 Sealer)
```

---

## Project Structure

```text
PS2/
├── .env.example                     # Environment template for local configuration
├── .gitignore                       # Standardized git exclusions
├── package.json                     # Root orchestrator script configuration
├── README.md                        # Project documentation
│
├── shared/                          # Shared cross-tier TypeScript contracts
│   └── types/
│       └── index.ts                 # Graph, Path, VaspCandidate, Bundle, SAHYOG types
│
├── server/                          # Backend Engine
│   ├── .env.example                 # Backend environment variable template
│   ├── package.json                 # Backend package specifications
│   ├── tsconfig.json                # Server TypeScript configuration
│   └── src/
│       ├── app.ts                   # Express application setup & middleware
│       ├── server.ts                # HTTP server bootstrap & graceful shutdown
│       ├── config/                  # Environment variables & MongoDB connection
│       ├── controllers/             # Health, Blockchain, & Investigation controllers
│       ├── data/
│       │   └── vaspLabels.ts        # Curated VASP intelligence dataset & conflict cases
│       ├── routes/                  # Express REST routes (/api/investigations, etc.)
│       ├── services/
│       │   ├── blockchain/          # TronProvider & BlockchainProvider interface
│       │   ├── graph/               # Bounded BFS graph engine & path traversal
│       │   ├── attribution/         # Rule-based VASP Candidate scoring engine
│       │   └── report/              # Canonical JSON, SHA-256 seal & HTML report generator
│       ├── tests/                   # Automated unit & integration test suites
│       └── utils/                   # Base58Check validator, logger, asyncHandler
│
└── client/                          # Frontend Dashboard
    ├── index.html                   # HTML5 shell with HydroTrace branding
    ├── package.json                 # Client dependencies & scripts
    ├── tsconfig.json                # Client TypeScript configuration
    ├── vite.config.ts               # Vite bundler configuration & API proxy
    └── src/
        ├── App.tsx                  # Main layout, router & navigation wrapper
        ├── main.tsx                 # React DOM mount point
        ├── index.css                # Tailwind CSS core directives
        ├── components/              # Reusable forensic UI widgets:
        │   ├── ForensicGraphView.tsx    # Interactive transaction graph canvas
        │   ├── PathInspector.tsx        # Multi-hop step-by-step path breakdown
        │   ├── VaspCandidateScorecard.tsx # Candidates, scorecards, conflicts & stress test
        │   └── TransactionTable.tsx     # Normalized on-chain transfer inspector
        ├── pages/                   # Application views:
        │   ├── DashboardPage.tsx            # Engine status & health confirmation
        │   ├── NewInvestigationPage.tsx     # Direct blockchain address fetch & filter
        │   ├── InvestigationDetailsPage.tsx # Core investigation, graph, candidates & export
        │   └── EvidenceAttributionPage.tsx  # Curated registry, conflicts & boundary framework
        ├── services/                # API client connector
        ├── types/                   # Re-exported frontend type interfaces
        └── utils/                   # Currency & address formatters
```

---

## Getting Started

### Prerequisites

* **Node.js**: v18.0.0 or higher (v20+ recommended)
* **npm**: v9.0.0 or higher
* **MongoDB**: Local or cloud MongoDB instance (optional for prototype runtime)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd HydroTrace
```

### 2. Install Dependencies

Install all root, backend, and frontend dependencies with a single command:

```bash
npm run install:all
```

*(Alternatively, install each workspace individually: `npm install`, `npm install --prefix server`, and `npm install --prefix client`)*

### 3. Environment Configuration

Copy the example environment configuration files:

```bash
cp .env.example .env
cp server/.env.example server/.env
```

Review `server/.env` to configure ports and optional database connections:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/hydrotrace_db
CLIENT_ORIGIN=http://localhost:5173
TRON_API_BASE_URL=https://api.trongrid.io
TRON_API_KEY=
```

---

## Running Locally

### Start Both Backend and Frontend Concurrently

```bash
npm run dev
```

* **Frontend:** Accessible at `http://localhost:5173`
* **Backend API:** Accessible at `http://localhost:5000`
* **Health Check:** `http://localhost:5000/api/health`

### Individual Workspace Commands

* **Run Backend Only:**
  ```bash
  npm run dev:server
  ```
* **Run Frontend Only:**
  ```bash
  npm run dev:client
  ```
* **Run Backend Automated Test Suite:**
  ```bash
  npm test --prefix server
  ```
* **Build Both Projects for Production:**
  ```bash
  npm run build
  ```

---

## Example Investigation

HydroTrace includes three pre-configured demonstration scenarios directly in the user interface:

### Scenario A — Successful Attribution Match
* **Target Address:** `TMQUXn3nBsHspLohDi6FFVVSgHbMp3A8GE`
* **Network / Asset:** TRON Mainnet / USDT TRC-20
* **Discovered Flow:** Target Root &rarr; Hop 1 &rarr; Hop 2 Sweep
* **Matched Candidates:**
  * **Bybit** (Hop 1, Direct Hot Wallet, `Evidence Score: 95/100`)
  * **Binance** (Hop 2, Liquidity Sweeper, `Evidence Score: 85/100`)
* **Attribution Boundary:** `DIRECT_EVIDENCE`
* **Conflict Status:** `NO CONFLICT DETECTED`

### Scenario B — Insufficient Evidence
* **Target Address:** `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t` (or any unindexed address)
* **Outcome:** Traverses real on-chain transaction hops but surfaces **INSUFFICIENT EVIDENCE** because no terminal node matches a verified VASP registry record. No synthetic or speculative attribution is invented.

### Scenario C — Multi-Source Evidence Conflict
* **Target Address:** `TT7hPkdWMPbkDzzsEDBNzuMn9gceTdgKtJ`
* **Outcome:** Surfaces **Evidence Conflict Detected — Analyst Review Required**. Displays divergent intelligence between **HTX (Huobi)** (supported by Official Transparency Index) and **Poloniex** (supported by Explorer Label) with a conflict penalty applied to the evidence score.

---

## Export & Evidence Verification

HydroTrace provides one-click forensic exports from the **Investigation Evidence** panel:

1. **EXPORT INVESTIGATION REPORT:** Downloads a comprehensive, standalone HTML document detailing the complete investigation docket, graph metrics, hop table, candidate cards, stress test, and disclaimers. Printable directly to PDF.
2. **DOWNLOAD EVIDENCE JSON:** Generates a deterministic, canonical JSON bundle representing the complete evidence structure.
3. **Evidence Bundle Hash:** Displays the SHA-256 seal computed from the canonical evidence string:
   ```text
   Evidence Bundle Hash
   SHA-256: 78c4b13b73e29da7a386e658adeba04a059464a240058463538b910cb4ebaf87
   Hash-sealed prototype evidence bundle
   ```
4. **EXPORT DISCLOSURE PAYLOAD:** Exports a structured JSON file formatted for lawful VASP disclosure inquiries (**SAHYOG-compatible prototype payload**).

---

## Limitations

As an investigative prototype, HydroTrace possesses several known operational boundaries:

* **Curated Intelligence Scope:** The prototype relies on a local curated dataset of verified TRON mainnet VASP addresses rather than a commercial enterprise subscription feed.
* **Bounded Traversal Limits:** Trace breadth is intentionally capped at 1–3 hops and 50–250 nodes/edges to ensure responsiveness and avoid public RPC rate limits.
* **Absence of Customer Identity:** Public blockchain data reveals transaction relationships and custody infrastructure, not the real-world customer identity or ultimate beneficial owner of a wallet.
* **Attribution Volatility:** New transaction sweeps or infrastructure migrations can alter evidentiary paths over time.
* **Cryptographic Tamper-Evidence Only:** The SHA-256 hash seal provides tamper-evidence for the exported bundle; it does not constitute court-admissible testimony without an accompanying forensic chain-of-custody affidavit.
* **Disclosure Integration Status:** The SAHYOG-compatible payload is a prototype schema for lawful LEA inquiries; it does not connect to or exchange data with any live government API.

---

## Responsible Use

HydroTrace is designed exclusively as an **investigative decision-support tool** for certified forensic analysts, compliance officers, and law enforcement personnel.

It must **NOT** be used to:
* Make definitive claims regarding personal wallet ownership.
* Declare an individual's criminality or legal guilt solely from blockchain transaction paths.
* Automatically issue binding legal orders or asset freezing requests without prior human verification.
* Override manual intelligence review in cases where conflicting evidence exists.

Whenever an attribution is marked **Analyst Review Required** or **Insufficient Evidence**, independent corroborating subpoenas, forensic banking records, or direct exchange verification must be obtained.

---

## Future Scope

Planned evolutionary enhancements for future versions:

* **Additional Blockchain Adapters:** Extending the modular provider interface to Ethereum (ERC-20), Bitcoin (UTXO models), and Solana.
* **Commercial Intelligence Feeds:** Integration with verified, subscription-based VASP cluster intelligence providers.
* **Historical Label Versioning:** Tracking changes in exchange infrastructure custody over time.
* **Advanced Heuristic Clustering:** Peeling chain detection, co-spending heuristics, and change address identification.
* **Secure Enterprise Integrations:** Authenticated role-based access control (RBAC), multi-tenant case docket management, and official government portal connectors.

---

## License

This project is licensed under the MIT License — see the LICENSE file for details.
