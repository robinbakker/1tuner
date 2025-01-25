// src/components/ui/toast/Toast.tsx
import { X } from 'lucide-preact';
import { cn } from '~/lib/utils';
import { dismissToast } from '~/store/signals/ui';
import { ToastProps } from './types';

const toastVariants = {
  default: 'bg-white dark:bg-stone-800 text-stone-950 dark:text-stone-50',
  success: 'bg-green-100 dark:bg-green-900 text-green-950 dark:text-green-50',
  error: 'bg-red-100 dark:bg-red-900 text-red-950 dark:text-red-50',
};

export function Toast({ id, title, description, variant = 'default', onClose }: ToastProps) {
  return (
    <div
      className={cn(
        'pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all',
        toastVariants[variant],
      )}
    >
      <div className="flex flex-col gap-1">
        {title && <div className="text-sm font-semibold">{title}</div>}
        {description && <div className="text-sm opacity-90">{description}</div>}
      </div>
      <button
        onClick={() => {
          onClose?.();
          dismissToast(id);
        }}
        className="absolute right-2 top-2 rounded-md p-1 text-stone-950/50 opacity-0 transition-opacity hover:text-stone-950 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
