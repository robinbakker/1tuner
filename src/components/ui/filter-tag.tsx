import { X } from 'lucide-preact';
import type { ComponentChildren, ComponentProps } from 'preact';
import { cn } from '~/lib/utils';

type SwitchProps = ComponentProps<'input'> & {
  children: ComponentChildren;
  onRemoveClick?: () => void;
  className?: string;
};

export function FilterTag({ className, onRemoveClick, children }: SwitchProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center mb-4 rounded-md border px-2.5 py-0.5 text-xs font-semibold',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground',
        className,
      )}
    >
      {children}
      {onRemoveClick && (
        <button onClick={onRemoveClick}>
          <X class={'ml-1 h-3 w-3'} />
        </button>
      )}
    </div>
  );
}
