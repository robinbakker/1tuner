import { cn } from './utils';

const selectBaseClass = cn(
  'custom-select-arrow',
  'border border-stone-400 dark:border-stone-200 rounded-lg',
  'text-sm disabled:opacity-50 disabled:pointer-events-none dark:bg-stone-900 dark:border-stone-600',
);

const select = cn(selectBaseClass, 'py-3 px-4 pe-9 block w-full');

const selectSmall = cn(selectBaseClass, 'custom-select-arrow--small', 'py-1 px-2 pe-5 block');

const textLink = cn('text-primary hover:underline');

export const styleClass = {
  select,
  selectSmall,
  textLink,
};
