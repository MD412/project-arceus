'use client';

import React from 'react';
import Link from 'next/link';
import styles from './TextLink.module.css';

type Variant = 'default' | 'muted' | 'destructive' | 'info' | 'success' | 'warning';

interface BaseProps {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}

type AnchorProps = BaseProps & {
  href: string;
  onClick?: never;
  title?: string;
  target?: string;
  rel?: string;
};

type ButtonProps = BaseProps & {
  href?: never;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  title?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
};

export type TextLinkProps = AnchorProps | ButtonProps;

export function TextLink(props: TextLinkProps) {
  const { variant = 'default', className = '', children } = props as BaseProps;
  const classes = [
    styles.textLink,
    styles[`textLink--${variant}`] || '',
    className || ''
  ].join(' ').trim();

  if ('href' in props && props.href) {
    const { href, title, target, rel } = props as AnchorProps;
    return (
      <Link href={href} className={classes} title={title} target={target} rel={rel}>
        {children}
      </Link>
    );
  }

  const { onClick, title, disabled, type = 'button', ariaLabel } = props as ButtonProps;
  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      title={title}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

export default TextLink;


