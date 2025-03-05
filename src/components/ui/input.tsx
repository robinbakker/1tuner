import { forwardRef, InputHTMLAttributes } from 'preact/compat';
import { cn } from '~/lib/utils';

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ type, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      {...props}
      class={cn(
        'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1',
        'text-sm shadow-xs transition-colors file:border-0',
        'file:bg-transparent file:text-sm file:font-medium file:text-foreground',
        'placeholder:text-muted-foreground focus-visible:outline-hidden',
        'focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )}
    />
  );
});
Input.displayName = 'Input';

export { Input };
