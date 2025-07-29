'use client';

import { useEffect, useState } from 'react';

export default function TestScanPage() {
  const [scanData, setScanData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchScan() {
      try {
        const response = await fetch('/api/scans/66a46556-2446-4bc9-aa1c-c3b706ab6457');
        const data = await response.json();
        
        if (!response.ok) {
          setError(`API Error ${response.status}: ${JSON.stringify(data)}`);
        } else {
          setScanData(data);
        }
      } catch (err) {
        setError(`Fetch error: ${err}`);
      } finally {
        setLoading(false);
      }
    }

    fetchScan();
  }, []);

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Scan Page</h1>
      <h2>Scan ID: 66a46556-2446-4bc9-aa1c-c3b706ab6457</h2>
      
      {scanData && (
        <div>
          <h3>Scan Details:</h3>
          <p>Title: {scanData.scan_title || scanData.binder_title}</p>
          <p>Status: {scanData.processing_status}</p>
          <p>User ID: {scanData.user_id}</p>
          
          <h3>Enriched Cards:</h3>
          {scanData.results?.enriched_cards ? (
            <ul>
              {scanData.results.enriched_cards.map((card: any, index: number) => (
                <li key={index}>
                  {card.card_name} - {card.enrichment_success ? '✅' : '❌'}
                </li>
              ))}
            </ul>
          ) : (
            <p>No enriched cards</p>
          )}
          
          <h3>Raw JSON:</h3>
          <pre style={{ background: '#f0f0f0', padding: '10px', overflow: 'auto' }}>
            {JSON.stringify(scanData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 