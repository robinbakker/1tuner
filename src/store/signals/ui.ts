import { signal } from '@preact/signals';
import { UIState } from '../types';

export const uiState = signal<UIState>({ headerTitle: '', headerDefaultTextColor: 'default' });
export const uiIsScrolled = signal<boolean>(false);
