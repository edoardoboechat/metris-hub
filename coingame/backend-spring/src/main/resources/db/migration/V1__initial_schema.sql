create table if not exists app_settings (
    id bigint primary key,
    inactivity_timeout_seconds bigint not null,
    available_coins bigint not null,
    distribution_days bigint not null
);

create table if not exists coin_find_record (
    id bigserial primary key,
    user_id varchar(255) not null,
    username varchar(255) not null,
    reward_amount numeric(19, 2) not null,
    found_at timestamp with time zone not null
);

create index if not exists idx_coin_find_record_user_id on coin_find_record (user_id);
create index if not exists idx_coin_find_record_username on coin_find_record (username);
create index if not exists idx_coin_find_record_found_at on coin_find_record (found_at);

create table if not exists player_game_state (
    user_id varchar(255) primary key,
    granted_play_time_seconds bigint not null,
    consumed_play_time_seconds bigint not null,
    active_play_started_at timestamp with time zone,
    active_session_last_seen_at timestamp with time zone,
    active_session_username varchar(255),
    active_session_coins_found_baseline bigint not null,
    active_session_coin_balance_baseline numeric(19, 2) not null,
    total_coins_found bigint not null,
    coin_balance numeric(19, 2) not null
);

create table if not exists play_session_record (
    id bigserial primary key,
    user_id varchar(255) not null,
    username varchar(255) not null,
    started_at timestamp with time zone not null,
    ended_at timestamp with time zone not null,
    played_seconds bigint not null,
    coins_found bigint not null,
    coin_amount numeric(19, 2) not null
);

create index if not exists idx_play_session_record_user_id on play_session_record (user_id);
create index if not exists idx_play_session_record_username on play_session_record (username);
create index if not exists idx_play_session_record_started_at on play_session_record (started_at);
create index if not exists idx_play_session_record_ended_at on play_session_record (ended_at);

create table if not exists play_time_transaction_record (
    id bigserial primary key,
    user_id varchar(255) not null,
    username varchar(255) not null,
    transaction_type varchar(255) not null,
    seconds_amount bigint not null,
    balance_after_seconds bigint not null,
    occurred_at timestamp with time zone not null
);

create index if not exists idx_play_time_transaction_record_user_id on play_time_transaction_record (user_id);
create index if not exists idx_play_time_transaction_record_username on play_time_transaction_record (username);
create index if not exists idx_play_time_transaction_record_occurred_at on play_time_transaction_record (occurred_at);
