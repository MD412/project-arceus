import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import ExampleShowcase from '@/components/layout/ExampleShowcase';
import CodeBlock from '../CodeBlock';
import { ScanReviewLayout } from '@/components/ui/ScanReviewLayout';

export default function ScanReviewLayoutPage() {
  // Mock data for the example
  const mockDetections = [
    {
      id: '1',
      card_name: 'Cynthia',
      similarity_score: 0.89,
      bbox: [100, 150, 200, 250] as [number, number, number, number],
      crop_url: '/ui-playground-pk-img/Cynthias-Garchomp-ex-SIR.jpg',
      identified_card: {
        id: 'cynthia-1',
        name: 'Cynthia',
        set_code: 'sma',
        card_number: 'SV82',
        image_url: '/ui-playground-pk-img/Cynthias-Garchomp-ex-SIR.jpg'
      }
    },
    {
      id: '2',
      card_name: 'Garchomp ex',
      similarity_score: 0.91,
      bbox: [300, 200, 400, 300] as [number, number, number, number],
      crop_url: '/ui-playground-pk-img/Cynthias-Garchomp-ex-SIR.jpg',
      identified_card: {
        id: 'garchomp-ex-1',
        name: 'Garchomp ex',
        set_code: 'sv4',
        card_number: '245',
        image_url: '/ui-playground-pk-img/Cynthias-Garchomp-ex-SIR.jpg'
      }
    },
    {
      id: '3',
      card_name: 'Cynthia\'s Ambition',
      similarity_score: 0.85,
      bbox: [500, 100, 600, 200] as [number, number, number, number],
      crop_url: '/ui-playground-pk-img/Cynthias-Garchomp-ex-SIR.jpg',
      identified_card: {
        id: 'cynthias-ambition-1',
        name: 'Cynthia\'s Ambition',
        set_code: 'swsh12pt5gg',
        card_number: 'GG60',
        image_url: '/ui-playground-pk-img/Cynthias-Garchomp-ex-SIR.jpg'
      }
    }
  ];

  const mockSummaryImageUrl = '/ui-playground-pk-img/Cynthias-Garchomp-ex-SIR.jpg';

  return (
    <PageLayout
      title="Scan Review Layout"
      description="Side-by-side layout for reviewing scan results with original image and detected cards"
    >
      <ContentSection title="Overview" headingLevel={2}>
        <p>
          The ScanReviewLayout component provides an optimized user experience for reviewing 
          card scan results. It displays the original scan image alongside detected cards 
          with their cropped regions, making it easy to compare and verify identifications.
        </p>
      </ContentSection>

      <ContentSection title="Features" headingLevel={2}>
        <ul>
          <li><strong>Side-by-side layout:</strong> Original scan on the left, detected cards on the right</li>
          <li><strong>Inline crops:</strong> Each detected card shows its cropped region from the original scan</li>
          <li><strong>Card details:</strong> Displays identified card information (name, set, number, confidence)</li>
          <li><strong>Interactive:</strong> Hover and click handlers for enhanced user experience</li>
          <li><strong>Responsive:</strong> Adapts to mobile and desktop screen sizes</li>
        </ul>
      </ContentSection>

      <ExampleShowcase title="Basic Usage">
        <div style={{ height: '600px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--sds-radius-200)' }}>
          <ScanReviewLayout
            summaryImageUrl={mockSummaryImageUrl}
            detections={mockDetections}
            onDetectionClick={(detection) => {
              console.log('Detection clicked:', detection);
            }}
            onDetectionHover={(detection) => {
              console.log('Detection hovered:', detection);
            }}
          />
        </div>
      </ExampleShowcase>

      <ContentSection title="Props" headingLevel={2}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ textAlign: 'left', padding: 'var(--sds-size-space-200)' }}>Prop</th>
              <th style={{ textAlign: 'left', padding: 'var(--sds-size-space-200)' }}>Type</th>
              <th style={{ textAlign: 'left', padding: 'var(--sds-size-space-200)' }}>Required</th>
              <th style={{ textAlign: 'left', padding: 'var(--sds-size-space-200)' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td style={{ padding: 'var(--sds-size-space-200)' }}>summaryImageUrl</td>
              <td style={{ padding: 'var(--sds-size-space-200)' }}>string</td>
              <td style={{ padding: 'var(--sds-size-space-200)' }}>Yes</td>
              <td style={{ padding: 'var(--sds-size-space-200)' }}>URL of the original scan image</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td style={{ padding: 'var(--sds-size-space-200)' }}>detections</td>
              <td style={{ padding: 'var(--sds-size-space-200)' }}>Detection[]</td>
              <td style={{ padding: 'var(--sds-size-space-200)' }}>Yes</td>
              <td style={{ padding: 'var(--sds-size-space-200)' }}>Array of detected cards with their details</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td style={{ padding: 'var(--sds-size-space-200)' }}>onDetectionClick</td>
              <td style={{ padding: 'var(--sds-size-space-200)' }}>{`(detection: Detection) => void`}</td>
              <td style={{ padding: 'var(--sds-size-space-200)' }}>No</td>
              <td style={{ padding: 'var(--sds-size-space-200)' }}>Callback when a detection is clicked</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td style={{ padding: 'var(--sds-size-space-200)' }}>onDetectionHover</td>
              <td style={{ padding: 'var(--sds-size-space-200)' }}>{`(detection: Detection) => void`}</td>
              <td style={{ padding: 'var(--sds-size-space-200)' }}>No</td>
              <td style={{ padding: 'var(--sds-size-space-200)' }}>Callback when a detection is hovered</td>
            </tr>
          </tbody>
        </table>
      </ContentSection>

      <ContentSection title="Detection Interface" headingLevel={2}>
        <p>
          The Detection interface defines the structure for detected cards:
        </p>
        <ul>
          <li><strong>id:</strong> Unique identifier for the detection</li>
          <li><strong>card_name:</strong> Name of the detected card</li>
          <li><strong>similarity_score:</strong> Confidence score (0-1)</li>
          <li><strong>bbox:</strong> Bounding box coordinates [x, y, width, height]</li>
          <li><strong>crop_url:</strong> URL to the cropped image from the original scan</li>
          <li><strong>identified_card:</strong> Optional identified card details</li>
        </ul>
      </ContentSection>

      <ContentSection title="Usage Example" headingLevel={2}>
        <p>
          Import and use the ScanReviewLayout component with your detection data:
        </p>
        <ul>
          <li>Pass the original scan image URL via <code>summaryImageUrl</code></li>
          <li>Provide detected cards array via <code>detections</code></li>
          <li>Optionally handle click and hover events</li>
          <li>The component handles responsive layout automatically</li>
        </ul>
      </ContentSection>

      <ContentSection title="Design Considerations" headingLevel={2}>
        <h3>UX Benefits</h3>
        <ul>
          <li><strong>Reduced cognitive load:</strong> Users can see the original scan and detected cards simultaneously</li>
          <li><strong>Immediate context:</strong> Inline crops show exactly where each card was detected</li>
          <li><strong>Easy comparison:</strong> Side-by-side layout eliminates scrolling between original and results</li>
          <li><strong>Visual verification:</strong> Users can quickly spot misidentifications or missing cards</li>
        </ul>

        <h3>Responsive Behavior</h3>
        <ul>
          <li><strong>Desktop:</strong> Two-column layout with original image on left, detections on right</li>
          <li><strong>Mobile:</strong> Single-column layout with detections below the original image</li>
          <li><strong>Image sizing:</strong> Original image maintains aspect ratio with max-height constraints</li>
        </ul>
      </ContentSection>
    </PageLayout>
  );
} 