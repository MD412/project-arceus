'use client';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'button_button_uCVc', // Base button class
  {
    variants: {
      variant: {
        primary: 'button_button_primary_uCVc',
        secondary: 'button_button_secondary_uCVc',
        ghost: 'button_button_ghost_uCVc',
        destructive: 'button_button_destructive_uCVc',
        'ghost-destructive': 'button_button_ghost-destructive_uCVc',
        info: 'button_button_info_uCVc',
        toolbar: 'button_button_toolbar_uCVc',
        filter: 'button_button_filter_uCVc',
        success: 'button_button_success_uCVc',
        warning: 'button_button_warning_uCVc',
      },
      size: {
        sm: 'circuit-button-sm',
        md: '',
        lg: 'circuit-button-lg',
      }
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  }
);

type NativeButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'>;

interface ButtonProps extends NativeButtonProps, VariantProps<typeof buttonVariants> {
  className?: string;
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${buttonVariants({ variant, size })} ${className || ''}`}
      {...props}
    />
  );
} 