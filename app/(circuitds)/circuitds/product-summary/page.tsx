'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import Link from 'next/link';

export default function ProductSummaryPage() {
  return (
    <PageLayout
      title="Project Arceus: Product Summary"
      description="A high-level overview of Project Arceus from a product perspective, outlining its goals, target users, and core value proposition."
    >
      <ContentSection title="1. Core Problem & Solution" headingLevel={2}>
        <p className="body-medium">
          <strong>The Pain:</strong> Project Arceus tackles a very real and frustrating pain point for dedicated Pokémon card collectors: the sheer tedium and inaccuracy of manually cataloging large collections. Existing solutions are often clunky, mobile-first (which isn't always preferred for large tasks), and don't deliver the accuracy needed.
        </p>
        <p className="body-medium" style={{ marginTop: 'var(--sds-size-space-300)' }}>
          <strong>The Insight:</strong> The project cleverly leans into existing user behavior (collectors using desktop for serious collection management and emailing photos) rather than trying to force a completely new workflow. This lowers the barrier to adoption.
        </p>
        <p className="body-medium" style={{ marginTop: 'var(--sds-size-space-300)' }}>
          <strong>The Solution:</strong> It offers a streamlined, two-step process: bulk upload photos of binder pages, and then let the system automatically identify, label, and price the cards. This directly attacks the manual data entry bottleneck.
        </p>
      </ContentSection>

      <ContentSection title="2. Target User" headingLevel={2}>
        <p className="body-medium">
          The product is clearly aimed at <strong>serious Pokémon TCG collectors</strong>. These aren't casual players with a handful of cards, but individuals with potentially hundreds or thousands of cards in binders who care about tracking value, rarity, and condition, and possibly trading or selling.
        </p>
      </ContentSection>

      <ContentSection title="3. Value Proposition" headingLevel={2}>
        <p className="body-medium">Why would a collector use Project Arceus?</p>
        <ul className="list-disc pl-6 body-medium">
          <li style={{ marginTop: 'var(--sds-size-space-200)' }}>
            <strong>Massive Time Savings:</strong> This is the killer app feature. The promise of "no more typing 1,000 SKUs by hand" and the North Star metric of "import 1,000 cards in &lt; 10 minutes" would be a game-changer.
          </li>
          <li style={{ marginTop: 'var(--sds-size-space-200)' }}>
            <strong>Increased Accuracy:</strong> Aiming for ≥ 95% accuracy addresses a major frustration with current tools. A high baseline accuracy significantly reduces the correction burden.
          </li>
          <li style={{ marginTop: 'var(--sds-size-space-200)' }}>
            <strong>Desktop-First Workflow:</strong> Catering to the preference for desktop management (larger screen for review, keyboard/mouse for edits) is a smart differentiator.
          </li>
          <li style={{ marginTop: 'var(--sds-size-space-200)' }}>
            <strong>Centralized Collection Management:</strong> Beyond cataloging, the vision includes a dashboard for tracking value, filtering, and eventually exporting for trades/sales and social sharing.
          </li>
          <li style={{ marginTop: 'var(--sds-size-space-200)' }}>
            <strong>Empowerment & Enjoyment:</strong> By removing drudgery, Project Arceus allows collectors to focus on enjoying their collection.
          </li>
        </ul>
      </ContentSection>

      <ContentSection title="4. Feature Roadmap & Product Evolution" headingLevel={2}>
        <p className="body-medium">
          The phased approach (Genesis → Alpha → Beta) is logical:
        </p>
        <ul className="list-disc pl-6 body-medium">
          <li style={{ marginTop: 'var(--sds-size-space-200)' }}>
            <strong>Genesis (Core Utility):</strong> Nail the core pain point first: getting cards into the system efficiently and accurately (Binder Upload, Vision Pipeline, TCG Data Enrichment, Review UI).
          </li>
          <li style={{ marginTop: 'var(--sds-size-space-200)' }}>
            <strong>Alpha (Management & Utility):</strong> Build on the cataloged data to provide management tools (Collection Dashboard, Trade Sheet Export).
          </li>
          <li style={{ marginTop: 'var(--sds-size-space-200)' }}>
            <strong>Beta (Community & Engagement):</strong> Introduce social features (Social Sharing).
          </li>
        </ul>
      </ContentSection>

      <ContentSection title="5. The North Star Metric" headingLevel={2}>
        <p className="body-medium">
          <strong>"Import 1,000 cards in &lt; 10 minutes at ≥ 95% accuracy."</strong>
        </p>
        <p className="body-medium" style={{ marginTop: 'var(--sds-size-space-200)' }}>
          This is an excellent North Star: ambitious, user-centric, and directly measurable. Hitting this would make Project Arceus incredibly compelling.
        </p>
      </ContentSection>

      <ContentSection title="6. Potential Strengths & Differentiators" headingLevel={2}>
        <ul className="list-disc pl-6 body-medium">
          <li>Focus on Bulk & Desktop processing.</li>
          <li>High accuracy as a key goal for the vision pipeline.</li>
          <li>Aiming for a comprehensive feature set (import, manage, share).</li>
          <li>Potential for rich visual experiences (e.g., leveraging 3D rendering capabilities hinted at by the tech stack).</li>
        </ul>
      </ContentSection>

      <ContentSection title="7. Potential Challenges & Risks (Product Perspective)" headingLevel={2}>
        <ul className="list-disc pl-6 body-medium">
          <li><strong>Accuracy of the Vision Pipeline:</strong> This is the linchpin.</li>
          <li><strong>TCG Data Source Reliability:</strong> Dependence on external APIs for card data and pricing.</li>
          <li><strong>User Onboarding & Trust:</strong> Especially concerning image uploads of valuable collections.</li>
          <li><strong>Competition:</strong> Clearly communicating unique benefits against existing tools.</li>
          <li><strong>Monetization Strategy:</strong> Future consideration for sustainability.</li>
          <li><strong>Scope Creep:</strong> Maintaining focus on core value at each stage.</li>
        </ul>
      </ContentSection>

      <ContentSection title="8. Overall Product Potential" headingLevel={2}>
        <p className="body-medium">
          Project Arceus has strong potential if it can execute on its core promise, especially the speed and accuracy of its vision pipeline. It targets a passionate user base with a clear, significant pain point.
        </p>
        <p className="body-medium" style={{ marginTop: 'var(--sds-size-space-200)' }}>
          Success will largely hinge on:
        </p>
        <ol className="list-decimal pl-6 body-medium">
          <li style={{ marginTop: 'var(--sds-size-space-100)' }}>Nailing the technology for card recognition.</li>
          <li style={{ marginTop: 'var(--sds-size-space-100)' }}>Providing a user experience in the Review UI that makes correcting errors quick and painless.</li>
          <li style={{ marginTop: 'var(--sds-size-space-100)' }}>Building out subsequent dashboard and utility features that genuinely enhance the collector's experience.</li>
        </ol>
        <p className="body-medium" style={{ marginTop: 'var(--sds-size-space-300)' }}>
          It feels like a product born from genuine user frustration, which is often the best starting point.
        </p>
      </ContentSection>

    </PageLayout>
  );
} 