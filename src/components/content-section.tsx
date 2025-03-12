import { JSX } from 'preact';
import { useCallback } from 'preact/hooks';
import { Button } from './ui/button';

interface Props {
  title: string;
  children: JSX.Element;
  moreLink?: string;
  isScrollable?: boolean;
  hasNoPadding?: boolean;
}

export const ContentSection = ({ title, moreLink, children, isScrollable, hasNoPadding }: Props) => {
  const MoreLink = useCallback(({ location }: { location: string }) => {
    return (
      <Button asChild variant="outline">
        <a href={location}>More</a>
      </Button>
    );
  }, []);

  const padding = hasNoPadding ? '' : 'px-4 md:px-6';

  return (
    <section class="mb-8 w-full">
      <div class={`flex justify-between items-center mb-2 ${padding}`}>
        <h2 class="text-xl font-semibold">{title}</h2>
        {moreLink && <MoreLink location={moreLink} />}
      </div>
      <div class={isScrollable ? 'overflow-x-auto pt-2 pb-4 overscroll-contain' : padding}>{children}</div>
    </section>
  );
};
