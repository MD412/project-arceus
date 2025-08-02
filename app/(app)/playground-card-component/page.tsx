'use client';

import { useState } from 'react';
import { convertHeicToJpeg } from '@/lib/utils';
import toast from 'react-hot-toast';
import styles from './playground-card-states.module.css';

export default function PlaygroundCardStates() {
  const [heicTestResult, setHeicTestResult] = useState<string>('');
  const [convertedImageUrl, setConvertedImageUrl] = useState<string>('');

  const handleHeicTest = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setHeicTestResult('Converting...');
    setConvertedImageUrl('');
    
    try {
      const startTime = Date.now();
      const converted = await convertHeicToJpeg(file);
      const endTime = Date.now();
      
      const result = `
Original: ${file.name} (${file.type || 'unknown'}) - ${(file.size / 1024).toFixed(2)}KB
Converted: ${converted.name} (${converted.type}) - ${(converted.size / 1024).toFixed(2)}KB
Time: ${endTime - startTime}ms
Status: ${converted !== file ? '✅ Converted successfully' : '⚠️ No conversion needed'}
      `;
      
      setHeicTestResult(result.trim());
      
      // Create a preview URL for the converted image
      const url = URL.createObjectURL(converted);
      setConvertedImageUrl(url);
      
      if (converted !== file) {
        toast.success('HEIC conversion successful!');
      } else {
        toast.success('File is already in a supported format');
      }
    } catch (error) {
      setHeicTestResult(`❌ Error: ${error}`);
      toast.error('HEIC conversion failed');
    }
  };

  return (
    <div className={styles.playgroundContainer}>
      <h1 className={styles.playgroundTitle}>HEIC File Support Test</h1>
      
      <section className={styles.playgroundSection}>
        <h2 className={styles.playgroundSectionTitle}>HEIC to JPEG Conversion</h2>
        <p className={styles.playgroundDescription}>
          Upload a HEIC file from your iPhone to test the conversion process. 
          The file will be converted to JPEG format for compatibility.
        </p>
        
        <div className={styles.playgroundHeicTest}>
          <div className="circuit-form-field">
            <label htmlFor="heic-upload" className="circuit-label">
              Select HEIC File
            </label>
            <input 
              id="heic-upload"
              type="file" 
              accept="image/*,.heic,.heif"
              onChange={handleHeicTest}
              className="circuit-input"
            />
          </div>
          
          {heicTestResult && (
            <div className={styles.playgroundTestResult}>
              <h3>Conversion Result:</h3>
              <pre className={styles.playgroundHeicResult}>{heicTestResult}</pre>
            </div>
          )}
          
          {convertedImageUrl && (
            <div className={styles.playgroundImagePreview}>
              <h3>Converted Image Preview:</h3>
              <img 
                src={convertedImageUrl} 
                alt="Converted preview" 
                style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }}
              />
            </div>
          )}
        </div>
      </section>

      <section className="playground-section">
        <h2 className="playground-section-title">How It Works</h2>
        <div className="playground-info">
          <ol>
            <li>When you upload a HEIC file, it's automatically detected</li>
            <li>The file is converted to JPEG format in your browser</li>
            <li>The converted JPEG is then uploaded to our servers</li>
            <li>If conversion fails, the original HEIC is uploaded and converted server-side</li>
          </ol>
          <p className="playground-note">
            <strong>Note:</strong> HEIC files are Apple's high-efficiency image format. 
            This conversion ensures compatibility across all devices and browsers.
          </p>
        </div>
      </section>

      <style jsx>{`
        .playground-container {
          max-width: 800px;
          margin: 0 auto;
          padding: var(--sds-size-space-600);
        }
        
        .playground-title {
          font-size: var(--font-size-500);
          margin-bottom: var(--sds-size-space-600);
          color: var(--text-primary);
        }
        
        .playground-section {
          margin-bottom: var(--sds-size-space-800);
          padding: var(--sds-size-space-600);
          background: var(--surface-background);
          border: 1px solid var(--border-default);
          border-radius: var(--sds-size-radius-200);
        }
        
        .playground-section-title {
          font-size: var(--font-size-300);
          margin-bottom: var(--sds-size-space-400);
          color: var(--text-primary);
        }
        
        .playground-description {
          color: var(--text-secondary);
          margin-bottom: var(--sds-size-space-400);
        }
        
        .playground-heic-test {
          display: flex;
          flex-direction: column;
          gap: var(--sds-size-space-400);
        }
        
        .playground-test-result,
        .playground-image-preview {
          padding: var(--sds-size-space-400);
          background: var(--surface-subtle);
          border-radius: var(--sds-size-radius-100);
        }
        
        .playground-test-result h3,
        .playground-image-preview h3 {
          font-size: var(--font-size-100);
          margin-bottom: var(--sds-size-space-200);
          color: var(--text-secondary);
        }
        
        .playground-heic-result {
          font-family: var(--font-mono);
          font-size: var(--font-size-75);
          line-height: 1.6;
          color: var(--text-primary);
          white-space: pre-wrap;
          margin: 0;
        }
        
        .playground-info ol {
          margin-left: var(--sds-size-space-400);
          color: var(--text-secondary);
        }
        
        .playground-info li {
          margin-bottom: var(--sds-size-space-200);
        }
        
        .playground-note {
          margin-top: var(--sds-size-space-400);
          padding: var(--sds-size-space-300);
          background: var(--surface-info-subtle);
          border-radius: var(--sds-size-radius-100);
          color: var(--text-primary);
          font-size: var(--font-size-75);
        }
        
        .circuit-form-field {
          display: flex;
          flex-direction: column;
          gap: var(--sds-size-space-200);
        }
        
        .circuit-label {
          font-size: var(--font-size-100);
          font-weight: 500;
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
} 