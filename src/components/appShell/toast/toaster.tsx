import { For } from '@preact/signals/utils';
import { cn } from '~/lib/utils';
import { toasts } from '~/store/signals/ui';
import { Toast } from './toast';

type Props = {
  isPlayerOpen?: boolean;
  isPlayerMaximized?: boolean;
};

export function Toaster({ isPlayerOpen, isPlayerMaximized }: Props) {
  return (
    <div
      class={cn(
        'fixed bottom-20 z-100 flex max-h-screen w-full',
        'flex-col-reverse p-4',
        'sm:bottom-20 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] gap-2',
        isPlayerOpen && !isPlayerMaximized && 'bottom-36 sm:bottom-20',
        isPlayerMaximized && 'bottom-0',
      )}
    >
      <For each={toasts}>{(toast) => <Toast {...toast} />}</For>
    </div>
  );
}
