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

# Load environment variables from .env when running locally
load_dotenv()

DSN = os.environ["SUPABASE_DB_URL"]
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


def main() -> None:
    print("🐍  Worker online. Polling for jobs…")
    while True:
        # Open a new connection for each polling iteration so failed transactions
        # don't accumulate state. Using a context manager commits/rollbacks for us.
        with pg_conn() as conn, conn.cursor() as cur:
            job = dequeue_job(cur)
            conn.commit()  # release the row lock ASAP

            if not job:
                time.sleep(POLL_INTERVAL)
                continue

            print(f"⚙️  Working on job {job['id']} → upload {job['binder_page_upload_id']}")
            try:
                # 1) flip binder upload to 'processing'
                mark_upload(cur, job["binder_page_upload_id"], "processing")
                conn.commit()

                # 2) do the \"heavy\" work (placeholder)
                time.sleep(SIMULATED_WORK_SECS)

                # 3) randomly succeed/fail (placeholder for real logic)
                outcome = "completed" if random.random() > 0.05 else "failed"

                # 4) persist results
                mark_upload(cur, job["binder_page_upload_id"], outcome)
                mark_job(cur, job["id"], outcome)
                conn.commit()

                print(f"✅ Job {job['id']} {outcome}")

            except Exception as exc:
                conn.rollback()
                print(f"🔥 Job {job['id']} crashed → {exc}")

                # best-effort fail-state to keep the system honest
                with pg_conn() as c2, c2.cursor() as c2cur:
                    mark_upload(c2cur, job["binder_page_upload_id"], "failed")
                    mark_job(c2cur, job["id"], "failed")
                    c2.commit()


if __name__ == "__main__":
    main() 