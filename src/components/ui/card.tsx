import { forwardRef, HTMLAttributes } from 'preact/compat';
import { cn } from '~/lib/utils';

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ ...props }, ref) => (
  <div ref={ref} class={cn('rounded-xl border bg-card text-card-foreground shadow-sm', props.class)} {...props} />
));
Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ ...props }, ref) => (
  <div ref={ref} class={cn('flex flex-col space-y-1.5 p-6', props.class)} {...props} />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(({ ...props }, ref) => (
  <h3 ref={ref} class={cn('font-semibold leading-none tracking-tight', props.class)} {...props} />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(({ ...props }, ref) => (
  <p ref={ref} class={cn('text-sm text-muted-foreground', props.class)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ ...props }, ref) => (
  <div ref={ref} class={cn('p-6 pt-0', props.class)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ ...props }, ref) => (
  <div ref={ref} class={cn('flex items-center p-6 pt-0', props.class)} {...props} />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
