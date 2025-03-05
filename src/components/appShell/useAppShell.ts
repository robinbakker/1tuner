import { useLocation } from 'preact-iso';
import { useEffect, useMemo, useRef } from 'preact/hooks';
import { playerState } from '~/store/signals/player';
import { uiIsScrolled } from '~/store/signals/ui';

export const useAppShell = () => {
  const headerSentinelRef = useRef<HTMLDivElement>(null);
  const { path } = useLocation();

  useEffect(() => {
    if (!headerSentinelRef.current) {
      uiIsScrolled.value = false;
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        uiIsScrolled.value = !entry.isIntersecting;
      },
      {
        threshold: 1.0,
        rootMargin: '100px 0px 0px 0px', // Adjust the margin as needed
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

  const isActive = (checkPath: string) => {
    return checkPath === '/' ? path === checkPath : path.startsWith(checkPath);
  };

  const isMainRoute = useMemo(() => {
    return ['/', '/radio-stations', '/podcasts', '/settings'].includes(path);
  }, [path]);

  return {
    headerSentinelRef,
    isActive,
    isMainRoute,
    isScrolled: uiIsScrolled.value,
    handleBackClick,
    isPlayerOpen: !!playerState.value?.streams?.length,
  };
};
