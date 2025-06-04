import { clsx } from 'clsx';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'circuit-button', // Base circuit button class from the design system
  {
    variants: {
      variant: {
        primary: 'circuit-button-primary',
        secondary: 'circuit-button-secondary', 
        destructive: 'circuit-button-destructive',
      },
      size: {
        sm: 'circuit-button-sm',
        md: '', // Default size
        lg: 'circuit-button-lg',
      },
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