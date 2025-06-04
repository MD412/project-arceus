'use client';
import Link from 'next/link';
import { clsx } from 'clsx';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'Collection', href: '/' },
  { label: 'Add Card', href: '#' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="circuit-sidebar" aria-label="Main">
      <div className="circuit-sidebar-header">
        <h2 className="subtitle">Project Arceus</h2>
      </div>
      <ul className="circuit-nav-list">
        {navItems.map((item) => (
          <li key={item.href} className="circuit-nav-item">
            <Link
              href={item.href}
              className={clsx(
                'circuit-nav-link',
                pathname === item.href && 'circuit-nav-link-active'
              )}
              aria-current={pathname === item.href ? 'page' : undefined}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
} 