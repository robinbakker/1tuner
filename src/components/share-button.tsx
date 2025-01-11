import { Share2 } from 'lucide-preact';
import { cn } from '~/lib/utils';
import { uiState } from '~/store/signals/ui';

export function ShareButton({ hasDarkBackground }: { hasDarkBackground: boolean }) {
  const handleShare = async () => {
    if (!navigator.share || !uiState.value.headerTitle) return;
    try {
      await navigator.share({
        title: uiState.value.headerTitle,
        url: window?.location.href,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <button
      onClick={handleShare}
      class={cn(
        'p-2 rounded-full  transition-colors duration-200',
        hasDarkBackground ? 'hover:bg-stone-200/20' : 'hover:bg-stone-200',
      )}
    >
      <Share2 class={cn('h-6 w-6', hasDarkBackground ? 'text-white' : 'text-stone-600')} />
    </button>
  );
}
