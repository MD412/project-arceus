"use client";

import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import ExampleShowcase from '@/components/layout/ExampleShowcase';
import { ApproveScanButton } from '@/components/ui/ApproveScanButton';
import { useState } from 'react';

const codeExample = `import { ApproveScanButton } from '@/components/ui/ApproveScanButton';

function MyComponent() {
  const handleSuccess = (result) => {
    console.log('Scan approved:', result);
    // Handle success - maybe refresh data or show toast
  };

  const handleError = (error) => {
    console.error('Approve failed:', error);
    // Handle error - show error message
  };

  return (
    <ApproveScanButton
      scanId="scan-uuid-here"
      onSuccess={handleSuccess}
      onError={handleError}
    />
  );
}`;

const propsExample = `interface ApproveScanButtonProps {
  scanId: string;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}`;

export default function ApproveScanButtonPage() {
  const [demoResult, setDemoResult] = useState<string>('');

  const handleDemoSuccess = (result: any) => {
    setDemoResult(`✅ Success: Added ${result.approvedCount} cards to collection`);
  };

  const handleDemoError = (error: string) => {
    setDemoResult(`❌ Error: ${error}`);
  };

  return (
    <PageLayout
      title="Approve Scan Button"
      description="A button component for approving scans and adding identified cards to the user's collection. Integrates with the Optimistic CRUD Pipeline pattern."
    >
      <ContentSection title="Overview" headingLevel={2}>
        <p>
          The ApproveScanButton component provides a clean interface for users to approve processed scans 
          and add identified cards to their collection. It follows the Optimistic CRUD Pipeline pattern 
          and provides clear feedback states.
        </p>
        <p>
          The component handles the complete approval workflow:
        </p>
        <ul>
          <li><strong>Loading State:</strong> Shows spinner and "Approving..." text</li>
          <li><strong>Success State:</strong> Shows checkmark and "Approved" text</li>
          <li><strong>Error Handling:</strong> Provides error feedback via callback</li>
          <li><strong>Collection Integration:</strong> Creates user_cards entries</li>
        </ul>
      </ContentSection>

      <ContentSection title="Basic Usage" headingLevel={2}>
        <ExampleShowcase
          title="Default Button"
          description="Standard approve scan button with success/error callbacks"
          preview={
            <div style={{ padding: '1rem', border: '1px solid var(--border-default)', borderRadius: 'var(--sds-size-radius-100)' }}>
              <ApproveScanButton
                scanId="demo-scan-id"
                onSuccess={handleDemoSuccess}
                onError={handleDemoError}
              />
              {demoResult && (
                <div style={{ marginTop: '1rem', padding: '0.5rem', fontSize: '0.875rem' }}>
                  {demoResult}
                </div>
              )}
            </div>
          }
          code={codeExample}
        />
      </ContentSection>

      <ContentSection title="Props" headingLevel={2}>
        <ExampleShowcase
          title="Component Interface"
          description="Available props for the ApproveScanButton component"
          preview={<pre className="code-block">{propsExample}</pre>}
          code={propsExample}
        />
      </ContentSection>

      <ContentSection title="States" headingLevel={2}>
        <p>
          The button has three main states:
        </p>
        <ul>
          <li><strong>Default:</strong> Shows "📚 Approve Scan" with primary styling</li>
          <li><strong>Loading:</strong> Shows spinner and "Approving..." text, button is disabled</li>
          <li><strong>Success:</strong> Shows "✅ Approved" with success styling for 3 seconds</li>
        </ul>
      </ContentSection>

      <ContentSection title="Integration" headingLevel={2}>
        <p>
          This component integrates with several parts of the system:
        </p>
        <ul>
          <li><strong>API Endpoint:</strong> Calls <code>/api/scans/bulk</code> for bulk operations</li>
          <li><strong>Database:</strong> Creates entries in <code>user_cards</code> table</li>
          <li><strong>Scan Status:</strong> Updates scan processing status to 'approved'</li>
          <li><strong>Collection Pipeline:</strong> Completes the scan → review → collection workflow</li>
        </ul>
      </ContentSection>

      <ContentSection title="Design Tokens" headingLevel={2}>
        <p>
          The component uses CircuitDS design tokens for consistent styling:
        </p>
        <ul>
          <li><strong>Spacing:</strong> Uses <code>--sds-size-space-*</code> tokens</li>
          <li><strong>Colors:</strong> Uses semantic color tokens for success states</li>
          <li><strong>Typography:</strong> Uses <code>--sds-size-font-*</code> tokens</li>
          <li><strong>Border Radius:</strong> Uses <code>--sds-size-radius-*</code> tokens</li>
        </ul>
      </ContentSection>
    </PageLayout>
  );
} 