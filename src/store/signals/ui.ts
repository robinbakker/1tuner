import { signal } from '@preact/signals';
import { ToastProps } from '~/components/appShell/toast/types';
import { UIState } from '../types';

export const uiState = signal<UIState>({
  headerTitle: '',
  headerDefaultTextColor: 'default',
});
export const uiIsScrolled = signal<boolean>(false);
export const toasts = signal<ToastProps[]>([]);

const TOAST_DURATION = 5000;

export const addToast = (toast: Omit<ToastProps, 'id'>) => {
  if (toasts.value.some((t) => t.title === toast.title && t.description === toast.description)) return;

  const id = new Date().toISOString();
  const newToast = { ...toast, id, duration: toast.duration || TOAST_DURATION };

  toasts.value = [...toasts.value, newToast];

  // Auto dismiss
  setTimeout(() => {
    dismissToast(id);
  }, newToast.duration);

  return id;
};

export const dismissToast = (id: string) => {
  toasts.value = toasts.value.filter((t) => t.id !== id);
};
