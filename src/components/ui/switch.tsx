import type { ComponentProps } from 'preact';
import { cn } from '~/lib/utils';

type Props = ComponentProps<'input'> & {
  label?: string;
};

export function Switch({ label, ...props }: Props) {
  return (
    <div class={cn('flex items-center gap-2')}>
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" class="sr-only peer" {...props} />
        <div
          class={cn(
            'relative w-12 h-6 rounded-full border-2 border-transparent',
            'bg-stone-300 peer-checked:bg-primary',
            'after:content-[""] after:absolute',
            'after:bg-background after:rounded-full after:h-5 after:w-5',
            'after:shadow-xs after:transition-all',
            'peer-checked:after:translate-x-5 peer-checked:after:left-1',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-ring',
            'peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            props.class,
          )}
        />
      </label>
      {label && <span class="text-muted-foreground">{label}</span>}
    </div>
  );
}
