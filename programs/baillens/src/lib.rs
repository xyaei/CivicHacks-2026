use anchor_lang::prelude::*;

declare_id!("4Z9AdLt4YWKDV9JUrgD6hz2aZxwbFjJnrH9cd6jfcYoL");

#[program]
pub mod baillens {
    use super::*;

    pub fn log_record(ctx: Context<LogRecord>, record_id: String, record_hash: String) -> Result<()> {
        let entry = &mut ctx.accounts.audit_entry;
        entry.record_id = record_id;
        entry.record_hash = record_hash;
        entry.timestamp = Clock::get()?.unix_timestamp;
        entry.authority = ctx.accounts.authority.key();

        msg!("Bail record logged: {} | Hash: {}", entry.record_id, entry.record_hash);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(record_id: String, record_hash: String)]
pub struct LogRecord<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 64 + 64 + 8 + 32,
        seeds = [b"audit", record_id.as_bytes()],
        bump
    )]
    pub audit_entry: Account<'info, AuditEntry>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct AuditEntry {
    pub record_id: String,
    pub record_hash: String,
    pub timestamp: i64,
    pub authority: Pubkey,
}
