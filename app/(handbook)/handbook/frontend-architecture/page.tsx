'use client';

import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ContentSection from '@/components/layout/ContentSection';
import ExampleShowcase from '@/components/layout/ExampleShowcase';
import { getSupabaseClient } from '@/lib/supabase/browser';
// import { CodeBlock } from '@/components/CodeBlock';
// import { ExternalLink } from '@/components/ExternalLink';

export default function FrontendArchitecturePage() {
  const supabaseClientCode = `
// lib/supabase/client.ts
// For client-side components (React)
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
`.trim();

  const serviceLayerCode = `
// services/cards.ts
// Encapsulates all API calls related to cards.
import { supabase } from '@/lib/supabase/client';

export async function getCards(userId: string) {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data;
}
`.trim();

  const schemaCode = `
// schemas/binder.ts
// Defines the shape and validation rules for our data.
import { z } from 'zod';

export const BinderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  file: z.instanceof(File).refine(f => f.size < 10e6, 'Max 10MB'),
});
`.trim();

  const reactQueryHookCode = `
// hooks/useCards.ts
// Custom hook for managing card data with TanStack Query.
import { useQuery } from '@tanstack/react-query';
import { getCards } from '@/services/cards';

export function useCards(userId: string) {
  return useQuery({
    queryKey: ['cards', userId],
    queryFn: () => getCards(userId),
    enabled: !!userId,
  });
}
`.trim();

  const errorHandlingCode = `
// hooks/useCards.ts (with toast notifications)
// ...
const { mutate } = useMutation({
  mutationFn: deleteCard,
  onSuccess: () => {
    toast.success('Card deleted!');
    queryClient.invalidateQueries({ queryKey: ['cards', userId] });
  },
  onError: (err) => {
    toast.error(\`Deletion failed: \${err.message}\`);
  }
});
`.trim();

  const folderStructureCode = `
project-arceus/
├── /app            # Next.js routes, pages, and layouts
├── /components     # Reusable UI components (buttons, cards, etc.)
│   ├── /layout     # Page structure components (PageLayout, ErrorBoundary)
│   └── /providers  # Global providers (QueryProvider, ToastProvider)
├── /hooks          # Custom React hooks (e.g., useCards)
├── /lib            # Core library helpers and client initializations
│   └── /supabase   # Supabase client configurations
├── /schemas        # Zod validation schemas
├── /services       # API interaction layer (e.g., card services)
└── /styles         # Global CSS files
`.trim();

  return (
    <PageLayout
      title="🚀 Frontend Architecture Guide"
      description="The foundational patterns and architecture of the Project Arceus frontend. This guide ensures consistency, scalability, and maintainability."
    >
      <ContentSection title="Core Principles" headingLevel={2}>
        <p className="body-large">
          The frontend architecture is built on a set of modern best practices designed to create a robust, type-safe, and maintainable application. By separating concerns and using specialized libraries for specific tasks, we can build features faster and with fewer bugs.
        </p>
        <ul className="list-disc pl-6 body-medium space-y-2 mt-4">
          <li><strong>Centralization:</strong> Key clients and configurations are defined in one place.</li>
          <li><strong>Abstraction:</strong> Implementation details are hidden behind clear interfaces (services, hooks).</li>
          <li><strong>Type Safety:</strong> Zod and TypeScript provide end-to-end type safety.</li>
          <li><strong>Declarative State Management:</strong> TanStack Query handles server state, eliminating manual fetching and caching.</li>
        </ul>
      </ContentSection>

      <ContentSection title="1. Centralized Supabase Client" headingLevel={2}>
        <p className="body-medium">
          We never initialize the Supabase client directly in components. Instead, we use a centralized client from <code>/lib/supabase</code>. This makes it easy to manage credentials, update the client, or even swap out the backend service in the future.
        </p>
        <ExampleShowcase code={supabaseClientCode} />
      </ContentSection>

      <ContentSection title="2. Service Layer" headingLevel={2}>
        <p className="body-medium">
          All interactions with the backend API are encapsulated within a service layer (<code>/services</code>). Components and hooks call these service functions instead of making direct API calls. This decouples our UI from the data source.
        </p>
        <ExampleShowcase code={serviceLayerCode} />
      </ContentSection>

      <ContentSection title="3. Schema-Driven Validation" headingLevel={2}>
        <p className="body-medium">
          We use Zod (<code>/schemas</code>) to define the shape and validation rules for our data structures. This provides a single source of truth for validation, which can be used in forms, API routes, and service functions, ensuring data integrity.
        </p>
        <ExampleShowcase code={schemaCode} />
      </ContentSection>

      <ContentSection title="4. Modern Data Fetching with TanStack Query" headingLevel={2}>
        <p className="body-medium">
          All server state (data fetching, caching, mutations) is managed by TanStack Query (React Query). We create custom hooks (<code>/hooks</code>) to encapsulate query logic, providing a simple, declarative API to our components and handling caching, retries, and invalidation automatically.
        </p>
        <ExampleShowcase code={reactQueryHookCode} />
      </ContentSection>

      <ContentSection title="5. Robust Error Handling & UI Feedback" headingLevel={2}>
        <p className="body-medium">
          The application provides clear user feedback and gracefully handles errors. We use <code>react-hot-toast</code> for global notifications on API successes or failures and a global <code>ErrorBoundary</code> to prevent the UI from crashing on rendering errors.
        </p>
        <ExampleShowcase code={errorHandlingCode} />
      </ContentSection>

      <ContentSection title="6. Standardized Folder Structure" headingLevel={2}>
        <p className="body-medium">
          A consistent and logical folder structure makes it easy to locate files and understand the overall architecture of the application.
        </p>
        <pre style={{
          background: 'var(--surface-preview-background)',
          padding: 'var(--sds-size-space-400)',
          borderRadius: 'var(--sds-size-radius-100)',
          overflowX: 'auto',
          fontSize: 'var(--font-body-code)'
        }}>
          {folderStructureCode}
        </pre>
      </ContentSection>

    </PageLayout>
  );
} 