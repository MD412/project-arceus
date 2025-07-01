import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';

export default function ScanToCollectionWorkflowPage() {
  return (
    <PageLayout
      title="Scan-to-Collection Workflow"
      description="This document outlines the engineering plan for connecting the scan processing pipeline to the user's card collection, focusing on data quality and creating a feedback loop for system improvement."
    >
      <ContentSection title="Overview & Strategy" headingLevel={2}>
        <p>
          The primary goal is to create a seamless and trustworthy workflow for users to convert their physical card scans into digital items in their collection. The strategy is to build this in two phases, prioritizing data accuracy and user trust before implementing the final bulk-add functionality.
        </p>
      </ContentSection>

      <ContentSection title="Phase 1: The 'Fix-it' Connector (Card Correction)" headingLevel={2}>
        <p>
          This phase focuses on empowering the user to correct any misidentified cards on the scan review page. This is the critical first step.
        </p>
        <h3 className="text-lg font-bold mt-4 mb-2">Architectural Justification</h3>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>Ensures Data Quality & User Trust:</strong> Allows users to fix errors before adding cards to their collection, preventing data corruption and building confidence in the system.
          </li>
          <li>
            <strong>Creates a Priceless Feedback Loop:</strong> Every user correction is a piece of high-quality training data. We can log these corrections to systematically improve the accuracy of the backend card enrichment AI over time.
          </li>
          <li>
            <strong>Logical Prerequisite:</strong> A Quality Control (QC) station on an assembly line must have the ability to fix defects. This phase makes the Scan Review page a fully functional QC station.
          </li>
        </ul>
        <h3 className="text-lg font-bold mt-4 mb-2">Implementation Plan</h3>
        <ol className="list-decimal list-inside space-y-2">
          <li>
            <strong>Backend API Endpoint:</strong> Create a new API route, likely at <code>app/api/scans/[id]/cards/[cardIndex]/route.ts</code>. This endpoint will handle a <code>PATCH</code> request containing the corrected card data.
          </li>
          <li>
            <strong>Database Update Logic:</strong> The API will call a new database function. This function will use PostgreSQL's <code>jsonb_set</code> to surgically update the specific card object within the <code>enriched_cards</code> array in the job's <code>results</code> column.
          </li>
          <li>
            <strong>Frontend Integration:</strong> Wire up the <code>handleSaveCorrection</code> function on the scan detail page (<code>/scans/[id]</code>) to call the new API endpoint. On success, the page will re-fetch the scan data to show the correction instantly.
          </li>
        </ol>
      </ContentSection>

      <ContentSection title="Phase 2: The 'Final Assembly' (Add to Collection)" headingLevel={2}>
        <p>
          With the correction mechanism in place, this phase involves building the functionality for the user to commit the verified cards to their personal collection.
        </p>
        <h3 className="text-lg font-bold mt-4 mb-2">Implementation Plan</h3>
        <ol className="list-decimal list-inside space-y-2">
          <li>
            <strong>'Add to Collection' Button:</strong> Add a button to the scan review page that becomes active once the user has reviewed the items.
          </li>
          <li>
            <strong>Backend Logic:</strong> Create a new API endpoint that, when called, will iterate through the <code>enriched_cards</code> from a scan and create new entries in the <code>user_cards</code> table for that user.
          </li>
          <li>
            <strong>UI Feedback:</strong> After successfully adding the cards, the UI should provide clear feedback, perhaps redirecting the user to their collection or showing a success confirmation. The scan itself should be marked as 'completed' or 'archived' to prevent duplicate additions.
          </li>
        </ol>
      </ContentSection>
    </PageLayout>
  );
} 