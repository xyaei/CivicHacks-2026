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
