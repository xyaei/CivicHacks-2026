const express = require("express");
const anchor = require("@coral-xyz/anchor");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

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

    // Send transaction to Solana
    const tx = await program.methods
      .logRecord(record_id, recordHash)
      .accounts({
        auditEntry: auditEntryPda,
        authority: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    res.json({
      success: true,
      record_id,
      hash: recordHash,
      transaction: tx,
      explorer: `https://explorer.solana.com/tx/${tx}?cluster=devnet`,
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

app.listen(3000, () => {
  console.log("BailLens audit server running on port 3000");
});
