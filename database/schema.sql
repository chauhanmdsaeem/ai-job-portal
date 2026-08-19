-- =========================================================
-- schema.sql
-- PostgreSQL Version
-- =========================================================

CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('candidate', 'recruiter', 'admin')),
    resume        TEXT,
    company_name  TEXT,
    company_website TEXT,
    company_desc  TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS jobs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    company     TEXT NOT NULL,
    location    TEXT NOT NULL,
    description TEXT,
    skills      TEXT,
    salary      TEXT,
    job_type    TEXT NOT NULL DEFAULT 'Full-time',
    status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS applications (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id       INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume       TEXT,
    experience   TEXT,
    expected_salary TEXT,
    notice_period TEXT,
    portfolio_url TEXT,
    ai_analysis  TEXT,
    interview_time TEXT,
    interview_link TEXT,
    status       TEXT NOT NULL DEFAULT 'Applied'
                 CHECK (status IN ('Applied','Under Review','Shortlisted','Interview','Rejected','Selected')),
    applied_at   TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (job_id, candidate_id)
);

CREATE TABLE IF NOT EXISTS saved_jobs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id     INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    saved_at   TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (user_id, job_id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message    TEXT NOT NULL,
    is_read    INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate ON applications(candidate_id);

CREATE TABLE IF NOT EXISTS feedback (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    subject    TEXT NOT NULL,
    message    TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);