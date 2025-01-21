import { JSX } from 'preact';
import { useCallback } from 'preact/hooks';
import { Button } from './ui/button';

interface Props {
  title: string;
  moreLink: string;
  children: JSX.Element;
  isScrollable?: boolean;
}

export const ContentSection = ({ title, moreLink, children, isScrollable }: Props) => {
  const MoreLink = useCallback(({ location }: { location: string }) => {
    return (
      <Button asChild variant="outline">
        <a href={location}>More</a>
      </Button>
    );
  }, []);

  return (
    <section class="mb-8 w-full">
      <div class="flex justify-between items-center mb-2 px-4 md:px-6">
        <h2 class="text-xl font-semibold">{title}</h2>
        <MoreLink location={moreLink} />
      </div>
      <div class={isScrollable ? 'overflow-x-auto pt-2 pb-4 overscroll-contain' : 'px-4 md:px-6'}>{children}</div>
    </section>
  );
};
