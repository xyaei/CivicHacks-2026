use anchor_lang::prelude::*;

declare_id!("4Z9AdLt4YWKDV9JUrgD6hz2aZxwbFjJnrH9cd6jfcYoL");

#[program]
pub mod baillens {
    use super::*;

    // Original audit logger
    pub fn log_record(ctx: Context<LogRecord>, record_id: String, record_hash: String) -> Result<()> {
        let entry = &mut ctx.accounts.audit_entry;
        entry.record_id = record_id;
        entry.record_hash = record_hash;
        entry.timestamp = Clock::get()?.unix_timestamp;
        entry.authority = ctx.accounts.authority.key();
        msg!("Bail record logged: {} | Hash: {}", entry.record_id, entry.record_hash);
        Ok(())
    }

    // Initialize the bail fund vault
    pub fn initialize_fund(ctx: Context<InitializeFund>) -> Result<()> {
        let fund = &mut ctx.accounts.fund;
        fund.authority = ctx.accounts.authority.key();
        fund.total_contributed = 0;
        fund.total_disbursed = 0;
        fund.case_count = 0;
        msg!("Bail fund initialized");
        Ok(())
    }

    // Contribute SOL to the bail fund
    pub fn contribute(ctx: Context<Contribute>, amount: u64) -> Result<()> {
    let fund_key = ctx.accounts.fund.key();
    let contributor = ctx.accounts.contributor.to_account_info();
    let fund_info = ctx.accounts.fund.to_account_info();

    let ix = anchor_lang::solana_program::system_instruction::transfer(
        &contributor.key(),
        &fund_key,
        amount,
    );
    anchor_lang::solana_program::program::invoke(
        &ix,
        &[contributor, fund_info],
    )?;

    ctx.accounts.fund.total_contributed += amount;
    msg!("Contribution received: {} lamports", amount);
    Ok(())
    }

    // Disburse SOL for a specific case
    pub fn disburse(ctx: Context<Disburse>, case_id: String, amount: u64) -> Result<()> {
        let fund = &mut ctx.accounts.fund;

        require!(
            fund.authority == ctx.accounts.authority.key(),
            BailError::Unauthorized
        );

        require!(
            fund.to_account_info().lamports() >= amount,
            BailError::InsufficientFunds
        );

        // Transfer SOL from fund to defendant
        **fund.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.recipient.try_borrow_mut_lamports()? += amount;

        fund.total_disbursed += amount;
        fund.case_count += 1;

        msg!("Disbursed {} lamports for case {}", amount, case_id);
        Ok(())
    }

    // 1. Log case timeline event for a defendant
    pub fn log_case_event(ctx: Context<LogCaseEvent>, case_id: String, event_type: String, description: String) -> Result<()> {
        let entry = &mut ctx.accounts.case_event;
        entry.case_id = case_id;
        entry.event_type = event_type;
        entry.description = description;
        entry.timestamp = Clock::get()?.unix_timestamp;
        entry.authority = ctx.accounts.authority.key();
        msg!("Case event logged: {} | {}", entry.case_id, entry.event_type);
        Ok(())
    }

    // 2. Log bail outcome after resolution
    pub fn log_bail_outcome(ctx: Context<LogBailOutcome>, case_id: String, appeared_in_court: bool, bail_modified: bool, days_detained: u32) -> Result<()> {
        let outcome = &mut ctx.accounts.bail_outcome;
        outcome.case_id = case_id;
        outcome.appeared_in_court = appeared_in_court;
        outcome.bail_modified = bail_modified;
        outcome.days_detained = days_detained;
        outcome.timestamp = Clock::get()?.unix_timestamp;
        outcome.authority = ctx.accounts.authority.key();
        msg!("Bail outcome logged for case: {}", outcome.case_id);
        Ok(())
    }

    // 3. Log public defender caseload entry
    pub fn log_defender_caseload(ctx: Context<LogDefenderCaseload>, defender_id: String, case_count: u32, district: String) -> Result<()> {
        let entry = &mut ctx.accounts.caseload_entry;
        entry.defender_id = defender_id;
        entry.case_count = case_count;
        entry.district = district;
        entry.timestamp = Clock::get()?.unix_timestamp;
        entry.authority = ctx.accounts.authority.key();
        msg!("Defender caseload logged: {} cases in {}", entry.case_count, entry.district);
        Ok(())
    }

    // 4. Log community misconduct report submission
    pub fn log_misconduct_report(ctx: Context<LogMisconductReport>, report_id: String, report_hash: String, district: String) -> Result<()> {
        let report = &mut ctx.accounts.misconduct_report;
        report.report_id = report_id;
        report.report_hash = report_hash;
        report.district = district;
        report.timestamp = Clock::get()?.unix_timestamp;
        report.authority = ctx.accounts.authority.key();
        msg!("Misconduct report logged: {}", report.report_id);
        Ok(())
    }

}

// ── Audit Logger Accounts ──
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

// ── Bail Fund Accounts ──
#[derive(Accounts)]
pub struct InitializeFund<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8 + 8 + 8,
        seeds = [b"bail_fund"],
        bump
    )]
    pub fund: Account<'info, BailFund>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Contribute<'info> {
    #[account(mut, seeds = [b"bail_fund"], bump)]
    pub fund: Account<'info, BailFund>,
    #[account(mut)]
    pub contributor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Disburse<'info> {
    #[account(mut, seeds = [b"bail_fund"], bump)]
    pub fund: Account<'info, BailFund>,
    #[account(mut)]
    pub authority: Signer<'info>,
    /// CHECK: recipient wallet
    #[account(mut)]
    pub recipient: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct BailFund {
    pub authority: Pubkey,
    pub total_contributed: u64,
    pub total_disbursed: u64,
    pub case_count: u64,
}

#[error_code]
pub enum BailError {
    #[msg("Unauthorized signer")]
    Unauthorized,
    #[msg("Insufficient funds in bail pool")]
    InsufficientFunds,
}

// ── Case Timeline Accounts ──
#[derive(Accounts)]
#[instruction(case_id: String, event_type: String, description: String)]
pub struct LogCaseEvent<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 64 + 64 + 128 + 8 + 32,
        seeds = [b"case_event", case_id.as_bytes(), event_type.as_bytes()],
        bump
    )]
    pub case_event: Account<'info, CaseEvent>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct CaseEvent {
    pub case_id: String,
    pub event_type: String,
    pub description: String,
    pub timestamp: i64,
    pub authority: Pubkey,
}

// ── Bail Outcome Accounts ──
#[derive(Accounts)]
#[instruction(case_id: String)]
pub struct LogBailOutcome<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 64 + 1 + 1 + 4 + 8 + 32,
        seeds = [b"bail_outcome", case_id.as_bytes()],
        bump
    )]
    pub bail_outcome: Account<'info, BailOutcome>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct BailOutcome {
    pub case_id: String,
    pub appeared_in_court: bool,
    pub bail_modified: bool,
    pub days_detained: u32,
    pub timestamp: i64,
    pub authority: Pubkey,
}

// ── Defender Caseload Accounts ──
#[derive(Accounts)]
#[instruction(defender_id: String, case_count: u32, district: String)]
pub struct LogDefenderCaseload<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 64 + 4 + 64 + 8 + 32,
        seeds = [b"caseload", defender_id.as_bytes()],
        bump
    )]
    pub caseload_entry: Account<'info, CaseloadEntry>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct CaseloadEntry {
    pub defender_id: String,
    pub case_count: u32,
    pub district: String,
    pub timestamp: i64,
    pub authority: Pubkey,
}

// ── Misconduct Report Accounts ──
#[derive(Accounts)]
#[instruction(report_id: String, report_hash: String, district: String)]
pub struct LogMisconductReport<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 64 + 64 + 64 + 8 + 32,
        seeds = [b"misconduct", report_id.as_bytes()],
        bump
    )]
    pub misconduct_report: Account<'info, MisconductReport>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct MisconductReport {
    pub report_id: String,
    pub report_hash: String,
    pub district: String,
    pub timestamp: i64,
    pub authority: Pubkey,
}
