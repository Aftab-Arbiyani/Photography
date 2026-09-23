-- Runs automatically on first container init (mounted into /docker-entrypoint-initdb.d).
-- Ensures the schema's required extensions exist even before migrations run.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
