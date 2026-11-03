CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY,
    player_id UUID NOT NULL,
    currency VARCHAR(3) NOT NULL,
    balance NUMERIC(18, 2) NOT NULL CHECK (balance >= 0),
    version BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_wallets_player_currency UNIQUE (player_id, currency)
);

CREATE TABLE IF NOT EXISTS wallet_ledger_entries (
    id UUID PRIMARY KEY,
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    transaction_id VARCHAR(128) NOT NULL,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('DEBIT', 'CREDIT')),
    amount NUMERIC(18, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    balance_before NUMERIC(18, 2) NOT NULL CHECK (balance_before >= 0),
    balance_after NUMERIC(18, 2) NOT NULL CHECK (balance_after >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ledger_wallet_created ON wallet_ledger_entries(wallet_id, created_at DESC);

CREATE TABLE IF NOT EXISTS wager_transactions (
    id UUID PRIMARY KEY,
    provider_id VARCHAR(64) NOT NULL,
    external_transaction_id VARCHAR(128) NOT NULL,
    idempotency_key VARCHAR(256) NOT NULL UNIQUE,
    payload_hash VARCHAR(64) NOT NULL,
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    player_id UUID NOT NULL,
    round_id VARCHAR(128) NOT NULL,
    game_id VARCHAR(128) NOT NULL,
    kind VARCHAR(32) NOT NULL,
    amount NUMERIC(18, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    reference_external_transaction_id VARCHAR(128),
    reference_transaction_id UUID,
    status VARCHAR(32) NOT NULL CHECK (status IN ('PENDING', 'PENDING_REFERENCE', 'PROCESSED', 'REJECTED', 'FAILED')),
    failure_code VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    CONSTRAINT uq_wager_provider_external UNIQUE (provider_id, external_transaction_id)
);

CREATE TABLE IF NOT EXISTS inbox_messages (
    message_id VARCHAR(128) NOT NULL,
    consumer_name VARCHAR(64) NOT NULL,
    payload_hash VARCHAR(64) NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    PRIMARY KEY (consumer_name, message_id)
);

CREATE TABLE IF NOT EXISTS outbox_messages (
    id UUID PRIMARY KEY,
    aggregate_id VARCHAR(128) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    payload JSONB NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    attempts INT NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON outbox_messages(published_at) WHERE published_at IS NULL;
