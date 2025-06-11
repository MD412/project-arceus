'use client';

import BinderUploadForm from '@/components/binder/BinderUploadForm';

export default function UploadPage() {
  return (
    <div className="container">
      <header className="header">
        <h1>Upload New Binder</h1>
        <p>Upload a photo of your binder to start processing.</p>
      </header>
      <section>
        <BinderUploadForm />
      </section>
      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }
        .header {
          margin-bottom: 2rem;
        }
      `}</style>
    </div>
  );
} 