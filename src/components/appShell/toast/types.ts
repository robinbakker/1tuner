export type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error';
  duration?: number;
  onClose?: () => void;
};
