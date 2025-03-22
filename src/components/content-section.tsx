import { Search } from 'lucide-preact';
import { JSX } from 'preact';
import { useCallback } from 'preact/hooks';
import { cn } from '~/lib/utils';
import { Button } from './ui/button';

interface Props {
  title: string;
  children: JSX.Element;
  moreLink?: string;
  isScrollable?: boolean;
  hasNoPadding?: boolean;
  className?: string;
  insetClassName?: string;
  hasSearchButton?: boolean;
}

export const ContentSection = ({
  title,
  moreLink,
  children,
  isScrollable,
  hasNoPadding,
  className,
  insetClassName,
  hasSearchButton = false,
}: Props) => {
  const MoreLink = useCallback(
    ({ isSearch }: { isSearch?: boolean }) => {
      const link = isSearch ? `${moreLink}?focus-search=true` : moreLink;
      return (
        <Button asChild variant={isSearch ? 'outline' : 'link'}>
          <a href={link}>{isSearch ? <Search size={18} /> : <>More...</>}</a>
        </Button>
      );
    },
    [moreLink],
  );

  const padding = hasNoPadding ? '' : insetClassName ? insetClassName : 'px-4 md:px-6';

  return (
    <section class={cn('mb-8 w-full', className)}>
      <div class={`flex justify-between items-center mb-2 ${padding}`}>
        <h2 class="text-xl font-semibold">
          {title} {moreLink && <MoreLink />}
        </h2>
        <div class="flex items-center gap-2">{hasSearchButton && moreLink && <MoreLink isSearch />}</div>
      </div>
      <div class={isScrollable ? 'overflow-x-auto pt-2 pb-4 overscroll-contain' : padding}>{children}</div>
    </section>
  );
};
