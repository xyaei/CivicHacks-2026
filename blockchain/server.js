const express = require("express");
const anchor = require("@coral-xyz/anchor");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { mintCredentialToken } = require("./mintToken");
const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect("mongodb+srv://jj1057:Aeu96wEOfq3sg7vP@bailinfo.vu0nho7.mongodb.net/?appName=BailInfo")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB error:", err));

// Bail record schema
const bailRecordSchema = new mongoose.Schema({
  record_id: String,
  defendant: String,
  charge: String,
  bail_amount: Number,
  judge_id: String,
  court_division: String,
  zip_code: String,
  date: Date,
  outcome: String,
  solana_hash: String,
  solana_tx: String,
}, { timestamps: true });

const BailRecord = mongoose.model("BailRecord", bailRecordSchema);

const app = express();
app.use(express.json());

// Load wallet and program
const keypair = anchor.web3.Keypair.fromSecretKey(
  Buffer.from(JSON.parse(fs.readFileSync("/Users/v/.config/solana/id.json")))
);
const connection = new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed");
const wallet = new anchor.Wallet(keypair);
const provider = new anchor.AnchorProvider(connection, wallet, {});
anchor.setProvider(provider);

const idl = JSON.parse(fs.readFileSync("./target/idl/baillens.json"));
const programId = new anchor.web3.PublicKey("4Z9AdLt4YWKDV9JUrgD6hz2aZxwbFjJnrH9cd6jfcYoL");
const program = new anchor.Program(idl, provider);

// POST /log-record
// Body: { record_id, data }
app.post("/log-record", async (req, res) => {
  try {
    const { record_id, data } = req.body;

    if (!record_id || !data) {
      return res.status(400).json({ error: "record_id and data are required" });
    }

    // Hash the data
    const recordHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(data))
      .digest("hex");

    // Find PDA
    const [auditEntryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("audit"), Buffer.from(record_id)],
      programId
    );

    // Send to Solana
    const tx = await program.methods
      .logRecord(record_id, recordHash)
      .accounts({
        auditEntry: auditEntryPda,
        authority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Save to MongoDB with Solana proof
    const record = new BailRecord({
      record_id,
      ...data,
      solana_hash: recordHash,
      solana_tx: tx,
    });
    await record.save();

    res.json({
      success: true,
      record_id,
      hash: recordHash,
      transaction: tx,
      explorer: `https://explorer.solana.com/tx/${tx}?cluster=devnet`,
      mongodb: "saved"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /verify/:record_id
app.get("/verify/:record_id", async (req, res) => {
  try {
    const { record_id } = req.params;

    const [auditEntryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("audit"), Buffer.from(record_id)],
      programId
    );

    const account = await program.account.auditEntry.fetch(auditEntryPda);

    res.json({
      record_id: account.recordId,
      hash: account.recordHash,
      timestamp: account.timestamp.toString(),
      authority: account.authority.toString(),
    });

  } catch (err) {
    res.status(404).json({ error: "Record not found on chain" });
  }
});

// POST /init-fund — run this once to create the fund
app.post("/init-fund", async (req, res) => {
  try {
    const [fundPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("bail_fund")],
      programId
    );

    const tx = await program.methods
      .initializeFund()
      .accounts({
        fund: fundPda,
        authority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    res.json({ success: true, fund_address: fundPda.toString(), transaction: tx });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /fund-status — check fund balance and stats
app.get("/fund-status", async (req, res) => {
  try {
    const [fundPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("bail_fund")],
      programId
    );

    const account = await program.account.bailFund.fetch(fundPda);
    const balance = await connection.getBalance(fundPda);

    res.json({
      fund_address: fundPda.toString(),
      balance_sol: balance / anchor.web3.LAMPORTS_PER_SOL,
      total_contributed: account.totalContributed.toString(),
      total_disbursed: account.totalDisbursed.toString(),
      cases_funded: account.caseCount.toString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /disburse — send funds for a specific case
app.post("/disburse", async (req, res) => {
  try {
    const { case_id, recipient_address, amount_sol } = req.body;

    const [fundPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("bail_fund")],
      programId
    );

    const recipient = new anchor.web3.PublicKey(recipient_address);
    const amount = amount_sol * anchor.web3.LAMPORTS_PER_SOL;

    const tx = await program.methods
      .disburse(case_id, new anchor.BN(amount))
      .accounts({
        fund: fundPda,
        authority: wallet.publicKey,
        recipient: recipient,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    res.json({
      success: true,
      case_id,
      amount_sol,
      recipient: recipient_address,
      transaction: tx,
      explorer: `https://explorer.solana.com/tx/${tx}?cluster=devnet`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /mint-credential
// Body: { recipient_address, credential_type }
// credential_type options: COMMUNITY_WATCH, RIGHTS_TRAINING, DEFENDER_CERTIFIED, JUDGE_TRANSPARENCY
app.post("/mint-credential", async (req, res) => {
  try {
    const { recipient_address, credential_type } = req.body;

    if (!recipient_address || !credential_type) {
      return res.status(400).json({ error: "recipient_address and credential_type are required" });
    }

    const result = await mintCredentialToken(recipient_address, credential_type);
    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /log-case-event — log a defendant case timeline event
app.post("/log-case-event", async (req, res) => {
  try {
    const { case_id, event_type, description } = req.body;

    if (!case_id || !event_type || !description) {
      return res.status(400).json({ error: "case_id, event_type, and description are required" });
    }

    const [caseEventPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("case_event"), Buffer.from(case_id), Buffer.from(event_type)],
      programId
    );

    const tx = await program.methods
      .logCaseEvent(case_id, event_type, description)
      .accounts({
        caseEvent: caseEventPda,
        authority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    res.json({
      success: true,
      case_id,
      event_type,
      description,
      transaction: tx,
      explorer: `https://explorer.solana.com/tx/${tx}?cluster=devnet`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /log-bail-outcome — log what happened after bail was set
app.post("/log-bail-outcome", async (req, res) => {
  try {
    const { case_id, appeared_in_court, bail_modified, days_detained } = req.body;

    if (!case_id) {
      return res.status(400).json({ error: "case_id is required" });
    }

    const [bailOutcomePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("bail_outcome"), Buffer.from(case_id)],
      programId
    );

    const tx = await program.methods
      .logBailOutcome(case_id, appeared_in_court, bail_modified, days_detained)
      .accounts({
        bailOutcome: bailOutcomePda,
        authority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    res.json({
      success: true,
      case_id,
      appeared_in_court,
      bail_modified,
      days_detained,
      transaction: tx,
      explorer: `https://explorer.solana.com/tx/${tx}?cluster=devnet`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /log-defender-caseload — log public defender workload anonymously
app.post("/log-defender-caseload", async (req, res) => {
  try {
    const { defender_id, case_count, district } = req.body;

    if (!defender_id || !case_count || !district) {
      return res.status(400).json({ error: "defender_id, case_count, and district are required" });
    }

    const [caseloadPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("caseload"), Buffer.from(defender_id)],
      programId
    );

    const tx = await program.methods
      .logDefenderCaseload(defender_id, case_count, district)
      .accounts({
        caseloadEntry: caseloadPda,
        authority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    res.json({
      success: true,
      defender_id,
      case_count,
      district,
      transaction: tx,
      explorer: `https://explorer.solana.com/tx/${tx}?cluster=devnet`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /log-misconduct-report — log a community misconduct report submission
app.post("/log-misconduct-report", async (req, res) => {
  try {
    const { report_id, data, district } = req.body;

    if (!report_id || !data || !district) {
      return res.status(400).json({ error: "report_id, data, and district are required" });
    }

    const reportHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(data))
      .digest("hex");

    const [misconductPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("misconduct"), Buffer.from(report_id)],
      programId
    );

    const tx = await program.methods
      .logMisconductReport(report_id, reportHash, district)
      .accounts({
        misconductReport: misconductPda,
        authority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    res.json({
      success: true,
      report_id,
      hash: reportHash,
      district,
      transaction: tx,
      explorer: `https://explorer.solana.com/tx/${tx}?cluster=devnet`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /load-csv — load real bail records and save to MongoDB + Solana
app.post("/load-csv", async (req, res) => {
  try {
    const { records } = req.body;
    const results = [];

    for (const record of records) {
      const record_id = `MA-${record.id}`;

      // Clean bail amount
      const bailRaw = record.bail_amount || "";
      const bailMatch = bailRaw.match(/\$([\d,]+\.?\d*)/);
      const bail_amount = bailMatch ? parseFloat(bailMatch[1].replace(/,/g, "")) : 0;

      const data = {
        defendant: "anonymous",
        case_number: record.case_number,
        charge: record.crime_committed,
        bail_amount,
        judge_id: record.judge,
        court: record.court_division,
        case_status: record.case_status,
        date: record.date,
        defense_lawyer: record.defense_lawyer,
      };

      const recordHash = crypto
        .createHash("sha256")
        .update(JSON.stringify(data))
        .digest("hex");

      try {
        // Log to Solana
        const [auditEntryPda] = anchor.web3.PublicKey.findProgramAddressSync(
          [Buffer.from("audit"), Buffer.from(record_id)],
          programId
        );

        const tx = await program.methods
          .logRecord(record_id, recordHash)
          .accounts({
            auditEntry: auditEntryPda,
            authority: wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();

        // Save to MongoDB with Solana proof
        const bailRecord = new BailRecord({
          record_id,
          ...data,
          solana_hash: recordHash,
          solana_tx: tx,
        });
        await bailRecord.save();

        results.push({
          record_id,
          hash: recordHash,
          bail_amount,
          solana_tx: tx,
          explorer: `https://explorer.solana.com/tx/${tx}?cluster=devnet`,
          status: "saved to MongoDB + Solana"
        });

      } catch (err) {
        results.push({
          record_id,
          hash: recordHash,
          bail_amount,
          status: "failed: " + err.message
        });
      }
    }

    res.json({
      success: true,
      total_loaded: results.length,
      records: results
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auto-sync new MongoDB records to Solana
async function watchAndSync() {
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const db = mongoose.connection.db;
  const changeStream = db.collection("cases").watch();

  console.log("Watching MongoDB for new records...");

  changeStream.on("change", async (change) => {
    if (change.operationType === "insert") {
      const record = change.fullDocument;
      const record_id = `MA-${record.id}`;

      try {
        const data = {
          case_number: record.case_number,
          charge: record.crime_committed,
          bond: record.bond,
          cash: record.cash,
          judge: record.judge,
          court: record.court_division,
          date: record.date,
          status: record.case_status,
        };

        const recordHash = crypto
          .createHash("sha256")
          .update(JSON.stringify(data))
          .digest("hex");

        const [auditEntryPda] = anchor.web3.PublicKey.findProgramAddressSync(
          [Buffer.from("audit"), Buffer.from(record_id)],
          programId
        );

        const tx = await program.methods
          .logRecord(record_id, recordHash)
          .accounts({
            auditEntry: auditEntryPda,
            authority: wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();

        await db.collection("cases").updateOne(
          { id: record.id },
          { $set: { solana_hash: recordHash, solana_tx: tx } }
        );

        console.log(`Auto-synced ${record_id} to Solana → ${tx}`);

      } catch (err) {
        console.log(`Auto-sync failed for ${record_id}: ${err.message}`);
      }
    }
  });
}

// Start watcher after mongoose connects
mongoose.connection.once("open", () => {
  watchAndSync();
});

app.listen(3000, () => {
  console.log("BailLens audit server running on port 3000");
});
