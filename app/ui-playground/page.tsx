import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export const metadata = {
  title: 'UI Playground',
  description: 'A scratchpad to experiment with design-system components in isolation.',
};

export default function UIPlaygroundPage() {
  return (
    <PageLayout title="UI Playground" description="Quick sandbox for CircuitDS components.">
      <section style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Delete</Button>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <Card style={{ padding: '1rem' }}>
          <p style={{ margin: 0 }}>
            Use this page to try out new component props, colors, layouts, or animations without
            touching production pages.
          </p>
        </Card>
      </section>
    </PageLayout>
  );
} 