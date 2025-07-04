'use client';

import { usePathname } from 'next/navigation';
import Navigation from '@/components/Navigation'; // This is your main application sidebar component

export default function GlobalNavigationWrapper() {
  const pathname = usePathname();

  // Define paths where the main navigation should be hidden
  const noNavPaths = ['/login', '/signup', '/forgot-password'];

  // Don't render the main application sidebar on /circuitds or /handbook routes
  if (pathname?.startsWith('/circuitds') || pathname?.startsWith('/handbook') || noNavPaths.includes(pathname)) {
    return null;
  }

  return <Navigation />;
} 