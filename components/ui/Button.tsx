'use client';
import { clsx } from 'clsx';
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
        info: 'button_button_info_uCVc',
        toolbar: 'button_button_toolbar_uCVc',
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

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ 
  className, 
  variant,
  size,
  ...props 
}: ButtonProps) {
  return (
    <button
      className={clsx(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
} 