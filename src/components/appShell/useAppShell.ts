import { useLocation } from 'preact-iso';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

export const useAppShell = () => {
  const mainRef = useRef<HTMLElement>(null);
  const headerSentinelRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const { path } = useLocation();

  useEffect(() => {
    if (!mainRef.current || !headerSentinelRef.current) {
      setIsScrolled(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolled(!entry.isIntersecting);
      },
      {
        root: mainRef.current, // Set main as the root since we're scrolling inside it
        threshold: 1.0,
        rootMargin: '100px 0px 0px 0px', // Adjust the margin as needed
      },
    );

    // We observe a small empty div at the top of the page
    observer.observe(headerSentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [mainRef.current, headerSentinelRef.current, setIsScrolled]);

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
    mainRef,
    headerSentinelRef,
    isActive,
    isMainRoute,
    isScrolled,
    handleBackClick,
  };
};
