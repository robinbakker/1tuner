import type { ComponentProps } from 'preact';
import { cn } from '~/lib/utils';

type SwitchProps = ComponentProps<'input'> & {
  className?: string;
};

export function Switch({ className, ...props }: SwitchProps) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only peer" {...props} />
      <div
        className={cn(
          'relative w-12 h-6 rounded-full border-2 border-transparent',
          'bg-stone-300 peer-checked:bg-primary',
          'after:content-[""] after:absolute',
          'after:bg-background after:rounded-full after:h-5 after:w-5',
          'after:shadow-sm after:transition-all',
          'peer-checked:after:translate-x-5 peer-checked:after:left-1',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-ring',
          'peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background',
          'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
          className,
        )}
      />
    </label>
  );
}
