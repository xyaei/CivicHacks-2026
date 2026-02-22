const anchor = require("@coral-xyz/anchor");
const crypto = require("crypto");
const fs = require("fs");
const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://jj1057:Aeu96wEOfq3sg7vP@bailinfo.vu0nho7.mongodb.net/bailinfo?appName=BailInfo")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB error:", err));

// Match exact MongoDB field names
const caseSchema = new mongoose.Schema({
  id: Number,
  case_number: String,
  case_title: String,
  court_department: String,
  court_division: String,
  court_location: String,
  case_type: String,
  case_status: String,
  file_date: String,
  defendant_name: String,
  judge: String,
  bond: Number,
  cash: Number,
  crime_committed: String,
  defense_lawyer: String,
  date: String,
  solana_hash: String,
  solana_tx: String,
}, { strict: false });

const Case = mongoose.model("Case", caseSchema, "cases");

// Load Solana
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

async function syncAllRecords() {
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log("Fetching all records from MongoDB cases collection...");
  const records = await Case.find({ solana_tx: { $exists: false } });
  console.log(`Found ${records.length} records not yet on Solana`);

  let success = 0;
  let failed = 0;

  for (const record of records) {
    try {
      const record_id = `MA-${record.id}`;

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

      await Case.updateOne(
        { id: record.id },
        { solana_hash: recordHash, solana_tx: tx }
      );

      console.log(`✓ ${record_id} → ${tx}`);
      success++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (err) {
      console.log(`✗ ${record.id} failed: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone — ${success} synced, ${failed} failed`);
  mongoose.disconnect();
}

syncAllRecords();
