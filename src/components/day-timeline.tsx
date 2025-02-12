import { HTMLAttributes } from 'preact/compat';

export interface DayTimelineProps extends HTMLAttributes<HTMLUListElement> {}

export const DayTimeline = (props: DayTimelineProps) => {
  return (
    <ul {...props}>
      {new Array(13).fill(0).map((_, i) => (
        <li
          key={`timeli-${i}`}
          class="relative flex items-start h-[60px] w-full text-sm text-stone-400 dark:text-stone-500 first:opacity-60 last:opacity-60"
        >
          {`${`${i * 2}`.padStart(2, '0')}:00`}
          {i < 12 && (
            <span class="absolute border-dashed border-stone-300 dark:border-stone-600 border-r top-6 bottom-1 left-4"></span>
          )}
        </li>
      ))}
    </ul>
  );
};
