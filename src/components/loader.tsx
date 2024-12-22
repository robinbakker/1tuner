import { useEffect, useRef } from 'preact/hooks';

export const Loader = () => {
  const needleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const needle = needleRef.current;
    if (!needle) return;

    const animate = () => {
      const randomPosition = Math.random() * 100;
      needle.style.left = `${randomPosition}%`;

      const duration = 500 + Math.random() * 1000; // Random duration between 0.5s and 1.5s
      needle.style.transition = `left ${duration}ms ease-in-out`;

      setTimeout(animate, duration);
    };

    animate();

    return () => {
      if (needle) {
        needle.style.transition = 'none';
      }
    };
  }, []);

  return (
    <div class="flex items-center justify-center h-screen">
      <div class="w-64 h-16 rounded-lg bg-stone-300 dark:bg-stone-700 animate-pulse relative overflow-hidden">
        <div
          ref={needleRef}
          class="absolute top-0 bottom-0 w-0.5 bg-primary transform -translate-x-1/2"
          style={{ left: '50%' }}
          aria-label="Tuning needle"
        />
      </div>
    </div>
  );
};
