import { useEffect, useRef } from 'preact/hooks';

export function Loader() {
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
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="w-64 h-16 bg-gray-300 rounded-lg animate-pulse relative overflow-hidden">
        <div
          ref={needleRef}
          className="absolute top-0 bottom-0 w-0.5 bg-primary transform -translate-x-1/2"
          style={{ left: '50%' }}
          aria-label="Tuning needle"
        />
      </div>
    </div>
  );
}
