#!/usr/bin/env python3
"""
Tiny polling worker for Project Arceus – Stage 3
*   grabs the next pending job from job_queue (SKIP LOCKED ⇒ 1 job / worker)
*   flips job + binder_page_upload statuses
*   simulates work (time.sleep)
*   marks success/failure
"""

import os
import time
import random
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
import argparse

# Load environment variables from .env when running locally
load_dotenv()

DSN = os.environ.get("SUPABASE_DB_URL") or os.environ.get("DATABASE_URL")
if DSN is None:
    raise RuntimeError("Environment variable SUPABASE_DB_URL or DATABASE_URL must be set.")
POLL_INTERVAL = 5  # seconds between empty-queue checks
SIMULATED_WORK_SECS = 2  # placeholder for real processing time


def pg_conn():
    """Return a new PostgreSQL connection using a RealDictCursor."""
    return psycopg2.connect(DSN, cursor_factory=psycopg2.extras.RealDictCursor)


def dequeue_job(cur):
    """Atomically claim the next pending job and set it to processing.

    Returns the full job row or ``None`` if the queue is empty.
    """
    cur.execute(
        """
        UPDATE job_queue
           SET status      = 'processing',
               started_at  = NOW()
         WHERE id = (
               SELECT id
                 FROM job_queue
                WHERE status = 'pending'
             ORDER BY created_at
                LIMIT 1
                FOR UPDATE SKIP LOCKED
              )
     RETURNING *;
        """
    )
    return cur.fetchone()


def mark_upload(cur, upload_id: str, processing_status: str):
    """Update ``binder_page_uploads.processing_status`` for a given upload."""
    cur.execute(
        """
        UPDATE binder_page_uploads
           SET processing_status = %s,
               updated_at        = NOW()
         WHERE id = %s;
        """,
        (processing_status, upload_id),
    )


def mark_job(cur, job_id: str, status: str):
    """Update ``job_queue.status`` for a given job."""
    cur.execute(
        """
        UPDATE job_queue
           SET status      = %s,
               finished_at = NOW()
         WHERE id = %s;
        """,
        (status, job_id),
    )


def run_once(max_jobs: int | None = None):
    """Process up to ``max_jobs`` pending jobs and then return.
    If ``max_jobs`` is ``None``, drain the entire queue once.
    """
    processed = 0
    with pg_conn() as conn, conn.cursor() as cur:
        while True:
            job = dequeue_job(cur)
            conn.commit()
            if not job:
                break
            _handle_job(conn, cur, job)
            processed += 1
            if max_jobs is not None and processed >= max_jobs:
                break


def _handle_job(conn, cur, job):
    print(f"⚙️  Working on job {job['id']} → upload {job['binder_page_upload_id']}")
    try:
        mark_upload(cur, job["binder_page_upload_id"], "processing")
        conn.commit()
        time.sleep(SIMULATED_WORK_SECS)
        outcome = "completed" if random.random() > 0.05 else "failed"
        mark_upload(cur, job["binder_page_upload_id"], outcome)
        mark_job(cur, job["id"], outcome)
        conn.commit()
        print(f"✅ Job {job['id']} {outcome}")
    except Exception as exc:
        conn.rollback()
        print(f"🔥 Job {job['id']} crashed → {exc}")
        with pg_conn() as c2, c2.cursor() as c2cur:
            mark_upload(c2cur, job["binder_page_upload_id"], "failed")
            mark_job(c2cur, job["id"], "failed")
            c2.commit()


def main() -> None:
    parser = argparse.ArgumentParser(description="Project Arceus job processor")
    parser.add_argument("--once", action="store_true", help="Process the queue once and exit")
    parser.add_argument("--max", type=int, default=None, help="Max jobs to process in once mode")
    args = parser.parse_args()

    if args.once:
        run_once(args.max)
        return

    print("🐍  Worker online. Polling for jobs…")
    while True:
        with pg_conn() as conn, conn.cursor() as cur:
            job = dequeue_job(cur)
            conn.commit()
            if not job:
                time.sleep(POLL_INTERVAL)
                continue
            _handle_job(conn, cur, job)


if __name__ == "__main__":
    main() 