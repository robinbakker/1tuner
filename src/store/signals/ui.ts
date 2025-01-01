import { signal } from '@preact/signals';
import { UIState } from '../types';

export const uiState = signal<UIState>({ headerTitle: '', headerDefaultTextColor: 'default' });
