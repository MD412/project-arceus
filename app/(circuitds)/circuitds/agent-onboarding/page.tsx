'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import Link from 'next/link';

export default function AgentOnboardingPage() {
  return (
    <PageLayout
      title="AI Agent Onboarding Guide"
      description="A quick start guide for AI agents to get context on Project Arceus, CircuitDS, and key technical strategies. Read this page first!"
    >
      <ContentSection title="Introduction" headingLevel={2}>
        <p className="body-medium">
          Welcome, AI Agent! This page provides a consolidated starting point to quickly get you up to speed with Project Arceus.
          It summarizes key information from our core documentation. For more detailed information, please refer to the linked full documents.
        </p>
      </ContentSection>

      <ContentSection title="1. Product Summary" headingLevel={2}>
        <p className="body-medium">
          Project Arceus aims to solve the tedious manual cataloging of Pokémon card collections. It offers a desktop-first, two-step process: bulk-upload binder photos, then auto-detect, label, and price cards using a vision pipeline. Key goals include massive time savings for serious collectors, high accuracy (North Star: 1000 cards &lt; 10 mins, ≥ 95% accuracy), and a feature roadmap evolving from core import/review to collection management and social sharing.
        </p>
        <p className="body-medium" style={{ marginTop: 'var(--sds-size-space-300)' }}>
          <Link href="/circuitds/product-summary" className="text-brand underline">Read the full Product Summary here</Link>
        </p>
      </ContentSection>

      <ContentSection title="2. CircuitDS Developer Guide" headingLevel={2}>
        <p className="body-medium">
          The CircuitDS Developer Guide outlines the philosophy, directory structure, key files, core layout components for documentation (PageLayout, ContentSection, ExampleShowcase), design token usage (via CSS custom properties in <code>app/styles/circuit.css</code>), accessibility standards, and workflows for adding new documentation pages or UI components. It also contains a dedicated 'AI Data Section' with structured information for automated processing, covering file paths, core components, design tokens, and workflow summaries.
        </p>
        <p className="body-medium" style={{ marginTop: 'var(--sds-size-space-200)' }}>
          For detailed technical and structural information about CircuitDS and its integration, refer to the full guide, especially its AI Data Section.
        </p>
        <p className="body-medium" style={{ marginTop: 'var(--sds-size-space-300)' }}>
          <Link href="/circuitds/developer-guide" className="text-brand underline">Read the full Developer Guide here</Link>
        </p>
      </ContentSection>

      <ContentSection title="3. Vision Pipeline: 3×3 Slice Strategy" headingLevel={2}>
        <p className="body-medium">
          The '3×3 Slice' card-detection strategy is core to Project Arceus's vision pipeline. Its goal is to turn a raw binder page photo into nine clean, labeled card crops. Key steps include: Ingesting the image, Pre-slicing into 3x3 tiles, Running YOLOv8 on each tile, Post-processing (re-projecting boxes, NMS, expanding boxes), Cropping and creating thumbnails, Enriching data via the Pokémon-TCG API, and Presenting results in a Review UI. This method mitigates issues with image distortion, lighting, and detection errors on full pages. Key next steps include YOLO fine-tuning and homography correction.
        </p>
        <p className="body-medium" style={{ marginTop: 'var(--sds-size-space-300)' }}>
          <Link href="/circuitds/vision-pipeline-3x3-slice" className="text-brand underline">Read the full 3x3 Slice Strategy documentation here</Link>
        </p>
      </ContentSection>

    </PageLayout>
  );
} 