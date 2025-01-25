import { toasts } from '~/store/signals/ui';
import { Toast } from './toast';

export function Toaster() {
  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] gap-2">
      {toasts.value.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
}
