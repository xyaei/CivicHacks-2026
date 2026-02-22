import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Baillens } from "../target/types/baillens";
import * as crypto from "crypto";

describe("baillens", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Baillens as Program<Baillens>;

  it("Logs a bail record hash on-chain", async () => {
    const recordId = "CASE-2024-001";
    const recordHash = crypto
      .createHash("sha256")
      .update(JSON.stringify({ recordId, amount: 500, defendant: "anonymous" }))
      .digest("hex");

    const [auditEntryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("audit"), Buffer.from(recordId)],
      program.programId
    );

    const tx = await program.methods
      .logRecord(recordId, recordHash)
      .accounts({
        auditEntry: auditEntryPda,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Transaction signature:", tx);
    console.log("Record ID:", recordId);
    console.log("Hash logged:", recordHash);
    console.log("View on Solana Explorer:");
    console.log(`https://explorer.solana.com/tx/${tx}?cluster=devnet`);

    const account = await program.account.auditEntry.fetch(auditEntryPda);
    console.log("On-chain record ID:", account.recordId);
    console.log("On-chain hash:", account.recordHash);
    console.log("Timestamp:", account.timestamp.toString());
  });
});