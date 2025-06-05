import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import ExampleShowcase from '@/components/layout/ExampleShowcase';

export default function ContainerTestPage() {
  return (
    <PageLayout
      title="Container Components Test"
      description="A dedicated page to test the PageLayout, ContentSection, and ExampleShowcase components in isolation."
    >
      <ContentSection title="Test Section 1" headingLevel={2}>
        <p className="body-medium">This is some content within the first ContentSection.</p>
        <ExampleShowcase
          title="Isolated Example Showcase"
          description="This showcase is to test its padding and title rendering."
          headingLevel={3}
          code='<ExampleShowcase title="Test Title" />'
        >
          <div style={{ padding: '20px', background: 'rgba(0,255,0,0.1)' }}>Preview Area Content</div>
        </ExampleShowcase>
      </ContentSection>

      <ContentSection title="Test Section 2: Showcase without description" headingLevel={2}>
        <ExampleShowcase
          title="Showcase without Description"
          headingLevel={3}
          code='<ExampleShowcase title="Another Test" />'
        >
          <div style={{ padding: '20px', background: 'rgba(0,0,255,0.1)' }}>Another Preview</div>
        </ExampleShowcase>
      </ContentSection>

      <ContentSection title="Test Section 3: Showcase without title or description" headingLevel={2}>
         <ExampleShowcase
          code='<ExampleShowcase />'
        >
          <div style={{ padding: '20px', background: 'rgba(255,0,0,0.1)' }}>Preview Only</div>
        </ExampleShowcase>
      </ContentSection>
    </PageLayout>
  );
} 