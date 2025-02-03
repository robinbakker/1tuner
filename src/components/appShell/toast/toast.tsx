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
      class={cn(
        'pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl border p-6 pr-4 shadow-lg transition-all',
        toastVariants[variant],
      )}
    >
      <div class="flex flex-col gap-1">
        {title && <div class="text-sm font-semibold">{title}</div>}
        {description && <div class="text-sm opacity-90">{description}</div>}
      </div>
      <button
        title="Dismiss"
        onClick={() => {
          onClose?.();
          dismissToast(id);
        }}
        class="p-2 hover:bg-stone-200 rounded-full transition-colors flex-shrink-0"
      >
        <X class="h-6 w-6 text-stone-600" />
      </button>
    </div>
  );
}
