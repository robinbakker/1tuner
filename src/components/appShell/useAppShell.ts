import { useEffect, useRef, useState } from 'preact/hooks';
import { headerTitle } from '~/store/signals/ui';

export const useAppShell = () => {
  const headerSentinelRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const mainElement = document.querySelector('main');
    if (!mainElement || !headerSentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolled(!entry.isIntersecting);
      },
      {
        root: mainElement, // Set main as the root since we're scrolling inside it
        threshold: 1.0,
      },
    );

    // We observe a small empty div at the top of the page
    observer.observe(headerSentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleBackClick = () => {
    history.back();
  };

  const handleShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: headerTitle.value,
        url: window?.location.href,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const isActive = (path: string) => {
    return location?.pathname === path;
  };

  return {
    headerSentinelRef,
    isActive,
    isScrolled,
    handleBackClick,
    handleShare,
  };
};
