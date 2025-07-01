'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import CodeBlock from '@/app/(circuitds)/circuitds/components/CodeBlock';

export default function FixDequeueJobFunctionPage() {

  const sqlScript = `
-- Step 1: Drop the old function to avoid conflicts
DROP FUNCTION IF EXISTS public.dequeue_and_start_job();

-- Step 2: Create the new, corrected function
CREATE OR REPLACE FUNCTION public.dequeue_and_start_job()
RETURNS TABLE (
    id uuid,
    scan_upload_id uuid,
    job_type text,
    payload jsonb
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_job_id uuid;
BEGIN
    -- Find the oldest pending job and lock it
    SELECT q.id INTO v_job_id
    FROM public.job_queue q
    WHERE q.status = 'pending'
    ORDER BY q.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_job_id IS NULL THEN
        RETURN;
    END IF;

    -- Update the job's status to 'running' and return its details
    RETURN QUERY
    UPDATE public.job_queue
    SET status = 'running', picked_at = now(), updated_at = now()
    WHERE public.job_queue.id = v_job_id
    RETURNING public.job_queue.id, public.job_queue.scan_upload_id, public.job_queue.job_type, public.job_queue.payload;
END;
$$;

-- Step 3: Grant permission to the worker roles
GRANT EXECUTE ON FUNCTION public.dequeue_and_start_job() TO anon, authenticated, service_role;
  `;

  return (
    <PageLayout
      title="Ticket: Fix dequeue_and_start_job Data Mismatch"
      description="This document outlines the issue and remediation plan for the dequeue_and_start_job database function, which is causing the processing worker to hang."
    >
      <ContentSection title="1. Problem Statement" headingLevel={2}>
        <p>
          The <code>local_worker.py</code> script successfully fetches jobs, but they get stuck in a "pending" state. Investigation has revealed that the database function <code>dequeue_and_start_job</code> is returning the wrong data structure.
        </p>
        <p className="mt-2">
          It currently returns a <code>job_type</code> field, but the worker is expecting a <code>payload</code> field which contains the critical <code>storage_path</code> for the image. This data mismatch causes the worker to hang silently.
        </p>
      </ContentSection>

      <ContentSection title="2. Root Cause" headingLevel={2}>
        <p>
          The <code>dequeue_and_start_job</code> function is a legacy component from before the <code>payload</code> field was introduced. It was not updated during the "binder" to "scan" refactoring and is now out of sync with the data structure created by <code>create_scan_and_enqueue_job</code>.
        </p>
      </ContentSection>

      <ContentSection title="3. Implementation Plan" headingLevel={2}>
        <p>The function signature and return value must be updated to match what the worker expects. This will be done by running a single script in the Supabase SQL Editor.</p>
        <ul className="list-disc list-inside space-y-2 mt-4">
          <li><strong>Step 1: Correct the Function Definition:</strong> The script will use <code>DROP FUNCTION</code> to delete the old, incorrect version and <code>CREATE OR REPLACE FUNCTION</code> to create the new, correct version.</li>
          <li><strong>Step 2: The Core Change:</strong> The new function's <code>RETURNS TABLE</code> clause and its final <code>RETURNING</code> clause will be modified to return <code>payload jsonb</code> instead of the incorrect <code>job_type text</code>.</li>
          <li><strong>Step 3: Verification:</strong> Once the function is updated, running the <code>local_worker.py</code> script should result in it successfully picking up and processing pending jobs.</li>
        </ul>
      </ContentSection>
      
      <ContentSection title="4. SQL Script for Execution" headingLevel={2}>
        <p>The following script should be run in the Supabase SQL Editor to apply the fix.</p>
        <CodeBlock code={sqlScript} language="sql" />
      </ContentSection>

    </PageLayout>
  );
} 