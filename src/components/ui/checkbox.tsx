import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { CheckIcon } from '@radix-ui/react-icons';
import { ComponentProps } from 'preact';
import { forwardRef } from 'preact/compat';
import { cn } from '~/lib/utils';

interface CheckboxProps extends ComponentProps<typeof CheckboxPrimitive.Root> {}

const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'peer h-4 w-4 shrink-0 rounded-sm border border-black shadow',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
      'disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-black',
      'data-[state=checked]:text-white',
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn('flex items-center justify-center text-current')}>
      <div className="h-4 w-4">
        <CheckIcon />
      </div>
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
