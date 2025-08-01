'use client';

import { useEffect } from 'react';
import { initToolbar } from '@stagewise/toolbar';

export default function StagewiseInitializer() {
  useEffect(() => {
    // Only initialize in development mode
    if (process.env.NODE_ENV === 'development') {
      const stagewiseConfig = {
        plugins: [], // Add your custom plugins here
      };
      
      initToolbar(stagewiseConfig);
    }
  }, []);

  return null; // This component doesn't render anything
} 