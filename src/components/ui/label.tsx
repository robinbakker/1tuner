import * as LabelPrimitive from '@radix-ui/react-label';
import { cva } from 'class-variance-authority';
import { ComponentProps } from 'preact';
import { forwardRef } from 'preact/compat';
import { cn } from '~/lib/utils';

interface LabelProps extends ComponentProps<'input'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  name?: string;
}

const labelVariants = cva('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70');

const Label = forwardRef<HTMLInputElement, LabelProps>(({ ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants())} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
