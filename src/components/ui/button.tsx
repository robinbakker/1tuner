import { cva, type VariantProps } from 'class-variance-authority';
import { ComponentChildren } from 'preact';
import { ButtonHTMLAttributes, forwardRef } from 'preact/compat';
import { cn } from '~/lib/utils';

const buttonVariants = cva(
  cn(
    'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors cursor-pointer',
    'focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none',
    'disabled:opacity-50',
  ),
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90',
        outline: 'border border-current/33 bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost: 'border border-white/10 text-white/70 hover:border-white/30 hover:text-white/90',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      styleSize: {
        default: 'h-9 px-4 py-2 rounded-lg',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-10 rounded-lg px-8',
        icon: 'h-12 w-12 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      styleSize: 'default',
    },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  children?: ComponentChildren;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, styleSize, asChild = false, children, ...props }, ref) => {
    const classes = buttonVariants({ variant, styleSize, class: props.class });

    if (asChild && children && typeof children === 'object' && 'type' in children) {
      const Child = children.type;
      // @ts-expect-error - Passing refs through might need additional typing
      return <Child {...children.props} class={cn(classes, children.props?.class)} ref={ref} />;
    }

    return (
      <button type="button" ref={ref} {...{ ...props, class: classes }}>
        {children}
      </button>
    );
  },
);
