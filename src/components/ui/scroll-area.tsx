import { ComponentChildren } from 'preact';
import { ComponentPropsWithoutRef, forwardRef } from 'preact/compat';
import { cn } from '~/lib/utils';

interface ScrollAreaProps extends ComponentPropsWithoutRef<'div'> {
  children: ComponentChildren;
  className?: string;
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(({ children, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative',
      '[&::-webkit-scrollbar]:h-2.5 [&::-webkit-scrollbar]:w-2.5',
      '[&::-webkit-scrollbar-thumb]:rounded-full',
      '[&::-webkit-scrollbar-thumb]:bg-border',
      '[&::-webkit-scrollbar-track]:bg-transparent',
      className,
    )}
    {...props}
  >
    {children}
  </div>
));
