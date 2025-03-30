import { Share2 } from 'lucide-preact';
import { useCallback } from 'preact/hooks';
import { cn } from '~/lib/utils';
import { uiState } from '~/store/signals/ui';

type Props = {
  hasDarkBackground: boolean;
  shareUrl?: string;
  className?: string;
};

export function ShareButton({ hasDarkBackground, shareUrl, className }: Props) {
  const handleShare = useCallback(async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: uiState.value.headerTitle || '1tuner.com | listen to radio & podcasts',
        url: shareUrl || window?.location.href,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [shareUrl, uiState.value.headerTitle]);

  return (
    <button
      onClick={handleShare}
      class={cn(
        'p-2 rounded-full cursor-pointer transition-colors duration-200',
        hasDarkBackground ? 'hover:bg-stone-200/20' : 'hover:bg-stone-200 dark:hover:bg-stone-600',
        className,
      )}
    >
      <Share2 class={cn('h-6 w-6', hasDarkBackground && 'text-white')} />
    </button>
  );
}
