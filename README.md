# BailLens — Blockchain Audit Layer
## CivicHacks 2026 | JusticeHack Track

BailLens is an immutable accountability system built on Solana that logs bail records, case timelines, misconduct reports, and public defender caseloads on-chain — creating a tamper-proof public ledger for the Massachusetts criminal justice system.

---

## Program Info
- **Network:** Solana Devnet
- **Program ID:** `4Z9AdLt4YWKDV9JUrgD6hz2aZxwbFjJnrH9cd6jfcYoL`
- **Explorer:** https://explorer.solana.com/address/4Z9AdLt4YWKDV9JUrgD6hz2aZxwbFjJnrH9cd6jfcYoL?cluster=devnet

---

## Setup

### Requirements
- Node.js v18+
- Solana CLI
- Anchor Framework
- A funded Solana devnet wallet at `/Users/v/.config/solana/id.json`

### Install dependencies
```
yarn install
```

### Start the server
```
node server.js
```
Server runs on `http://localhost:3000`

---

## API Endpoints

### 🔒 Audit Logger

#### POST /log-record
Hashes a bail record and logs it permanently on-chain.
```json
{
  "record_id": "CASE-2024-001",
  "data": {
    "defendant": "anonymous",
    "charge": "drug_possession",
    "bail_amount": 500,
    "judge_id": "J-042"
  }
}
```
Returns: `success, record_id, hash, transaction, explorer`

#### GET /verify/:record_id
Reads a record back from the chain and returns the hash and timestamp.
```
GET /verify/CASE-2024-001
```
Returns: `record_id, hash, timestamp, authority`

---

### 💰 Community Bail Fund

#### POST /init-fund
Initializes the community bail fund vault on-chain. Run once only.
```
POST /init-fund
```
Returns: `success, fund_address, transaction`

#### GET /fund-status
Returns live fund balance and stats.
```
GET /fund-status
```
Returns: `fund_address, balance_sol, total_contributed, total_disbursed, cases_funded`

#### POST /disburse
Sends funds from the bail fund to a defendant wallet for a specific case.
```json
{
  "case_id": "CASE-2024-001",
  "recipient_address": "WALLET_ADDRESS_HERE",
  "amount_sol": 0.5
}
```
Returns: `success, case_id, amount_sol, recipient, transaction, explorer`

---

### 🎓 Civic Credential Tokens

#### POST /mint-credential
Mints a soulbound SPL token credential for a participant.
```json
{
  "recipient_address": "WALLET_ADDRESS_HERE",
  "credential_type": "RIGHTS_TRAINING"
}
```
**Credential types:**
- `COMMUNITY_WATCH` — Court Watch Observer
- `RIGHTS_TRAINING` — Know Your Rights Grad
- `DEFENDER_CERTIFIED` — BailLens Certified Defender
- `JUDGE_TRANSPARENCY` — Judicial Transparency

Returns: `success, mint_address, credential_type, recipient, explorer`

---

### 📋 Enhanced Accountability Endpoints

#### POST /log-case-event
Logs an immutable case timeline event for a defendant.
```json
{
  "case_id": "CASE-2024-001",
  "event_type": "BAIL_HEARING",
  "description": "Bail set at $500 for drug possession charge"
}
```
Returns: `success, case_id, event_type, description, transaction, explorer`

#### POST /log-bail-outcome
Logs the final outcome of a bail case after resolution.
```json
{
  "case_id": "CASE-2024-001",
  "appeared_in_court": true,
  "bail_modified": false,
  "days_detained": 23
}
```
Returns: `success, case_id, appeared_in_court, bail_modified, days_detained, transaction, explorer`

#### POST /log-defender-caseload
Logs anonymized public defender workload data.
```json
{
  "defender_id": "DEF-anonymized-001",
  "case_count": 87,
  "district": "Roxbury"
}
```
Returns: `success, defender_id, case_count, district, transaction, explorer`

#### POST /log-misconduct-report
Logs a community misconduct report submission — creates tamper-proof proof it was filed.
```json
{
  "report_id": "RPT-2024-001",
  "data": {
    "incident_type": "excessive_force",
    "district": "Dorchester",
    "date": "2024-01-15"
  },
  "district": "Dorchester"
}
```
Returns: `success, report_id, hash, district, transaction, explorer`

---

## For Teammates

### Person 1 (Data Engineer / n8n)
Call `POST /log-record` from your n8n flow whenever a new bail record hits MongoDB:
```json
{
  "record_id": "CASE-XXXX",
  "data": { bail record fields here }
}
```

### Person 3 (Backend / Vultr)
Deploy `server.js` on Vultr so it has a public URL. The server needs:
- Node.js installed
- The wallet keypair file
- `yarn install` run in the project directory

When a judge logs into their dashboard call:
```json
POST /log-record
{
  "record_id": "JUDGE-ACCESS-J042-timestamp",
  "data": { "judge_id": "J042", "action": "dashboard_access" }
}
```

### Person 4 (Frontend)
- Use `GET /verify/:record_id` for the live audit feed panel
- Use `GET /fund-status` for the bail fund widget
- Link each transaction to `https://explorer.solana.com/tx/TX_ID?cluster=devnet`

---

## Ethics & Privacy
- All defendant data is hashed before going on-chain — no PII is stored on Solana
- Defender IDs are anonymized before logging
- Misconduct reports are hashed — only a fingerprint is stored, not the content
- Judge access logs record engagement, not identity — supporting accountability without surveillance

---

## Built With
- Solana + Anchor Framework
- Node.js + Express
- MongoDB Atlas (Person 1)
- Metaplex Token Metadata
- @solana/web3.js
