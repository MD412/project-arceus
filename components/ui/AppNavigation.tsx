'use client';
import Link from 'next/link';
import { clsx } from 'clsx';
import { usePathname } from 'next/navigation';
import React from 'react';

// Define the types for navigation items
export interface NavLinkItem {
  type: 'link';
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export interface NavGroupItem {
  type: 'group';
  heading: string;
  icon?: React.ReactNode; // Optional icon for the group heading
  children: NavLinkItem[]; // Groups contain a list of NavLinkItem
}

export type NavigationConfigItem = NavLinkItem | NavGroupItem;

// Define the props for the AppNavigation component
interface AppNavigationProps {
  navTitle?: string | React.ReactNode;
  items: NavigationConfigItem[];
  baseNavClass?: string;
  headerClass?: string;
  titleClass?: string;
  navListClass?: string;
  navItemClass?: string; // Applied to all <li> elements, including those in sub-lists if navSubItemClass is not provided
  navLinkClass?: string;
  navLinkActiveClass?: string;
  navGroupHeadingClass?: string;
  navSubListClass?: string;
  navSubItemClass?: string; // Specific class for <li> in sub-lists
  navSubLinkClass?: string; // Specific class for <a> in sub-lists, defaults to navLinkClass
}

export default function AppNavigation({
  navTitle,
  items,
  baseNavClass = 'sidebar-nav',
  headerClass = 'sidebar-nav-header',
  titleClass = 'sidebar-nav-title',
  navListClass = 'sidebar-nav-list',
  navItemClass = 'sidebar-nav-item',
  navLinkClass = 'sidebar-nav-link',
  navLinkActiveClass = 'sidebar-nav-link-active',
  navGroupHeadingClass = 'sidebar-nav-group-heading',
  navSubListClass = 'sidebar-nav-sublist',
  navSubItemClass, // Defaults to undefined, logic below will handle fallback
  navSubLinkClass, // Defaults to undefined, logic below will handle fallback
}: AppNavigationProps) {
  const pathname = usePathname();

  const renderLink = (link: NavLinkItem, isSubLink: boolean = false) => {
    const currentLinkClass = isSubLink ? (navSubLinkClass || navLinkClass) : navLinkClass;
    return (
      <Link
        href={link.href}
        className={clsx(
          currentLinkClass,
          pathname === link.href && navLinkActiveClass
        )}
        aria-current={pathname === link.href ? 'page' : undefined}
      >
        {link.icon && <span className="sidebar-nav-icon">{link.icon}</span>}
        {link.label}
      </Link>
    );
  };

  return (
    <nav className={baseNavClass} aria-label={typeof navTitle === 'string' ? navTitle : 'Main navigation'}>
      {navTitle && (
        <div className={headerClass}>
          {typeof navTitle === 'string' ? (
            <h2 className={titleClass}>{navTitle}</h2>
          ) : (
            navTitle
          )}
        </div>
      )}
      <ul className={navListClass}>
        {items.map((item, index) => {
          // Use a more specific key if available, e.g., item.id or item.href for links, item.heading for groups
          const key = item.type === 'link' ? item.href : item.heading;
          return (
            <li key={key || index} className={navItemClass}>
              {item.type === 'link' ? (
                renderLink(item)
              ) : (
                <>
                  {item.heading && (
                    <h3 className={navGroupHeadingClass}>
                      {item.icon && <span className="sidebar-nav-icon">{item.icon}</span>}
                      {item.heading}
                    </h3>
                  )}
                  <ul className={navSubListClass}>
                    {item.children.map((childLink) => (
                      <li key={childLink.href} className={navSubItemClass || navItemClass}>
                        {renderLink(childLink, true)}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
} 