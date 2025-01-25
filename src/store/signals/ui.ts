import { signal } from '@preact/signals';
import { ToastProps } from '~/components/appShell/toast/types';
import { UIState } from '../types';

export const uiState = signal<UIState>({ headerTitle: '', headerDefaultTextColor: 'default' });
export const uiIsScrolled = signal<boolean>(false);
export const toasts = signal<ToastProps[]>([]);

const TOAST_DURATION = 5000;

export const addToast = (toast: Omit<ToastProps, 'id'>) => {
  const id = new Date().toISOString();
  const newToast = { ...toast, id };

  toasts.value = [...toasts.value, newToast];

  // Auto dismiss
  setTimeout(() => {
    dismissToast(id);
  }, toast.duration || TOAST_DURATION);

  return id;
};

export const dismissToast = (id: string) => {
  toasts.value = toasts.value.filter((t) => t.id !== id);
};
