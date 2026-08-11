-- =========================================================
-- schema.sql
-- Phase 3 — Database
-- ---------------------------------------------------------
-- Three tables, matching the design in the project README:
--   users        candidates, recruiters and admins
--   jobs         job postings, owned by a recruiter
--   applications candidate applications to a job (Phase 5 uses
--                this table; it's created now so the design is
--                in place, even though no routes touch it yet)
--
-- Safe to re-run: CREATE TABLE IF NOT EXISTS won't wipe data.
-- =========================================================

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('candidate', 'recruiter', 'admin')),
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS jobs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    company     TEXT NOT NULL,
    location    TEXT NOT NULL,
    description TEXT,
    skills      TEXT,                  -- comma-separated, e.g. "Python,SQL,Git"
    salary      TEXT,
    job_type    TEXT NOT NULL DEFAULT 'Full-time',
    created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS applications (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id       INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume       TEXT,
    status       TEXT NOT NULL DEFAULT 'Applied'
                 CHECK (status IN ('Applied','Under Review','Shortlisted','Interview','Rejected','Selected')),
    applied_at   TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (job_id, candidate_id)       -- one application per candidate per job
);

CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate ON applications(candidate_id);
