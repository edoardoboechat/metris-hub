SELECT 'CREATE DATABASE aether_game'
WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'aether_game'
)\gexec
