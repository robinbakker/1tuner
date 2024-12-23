import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, VariantProps } from 'class-variance-authority';
import { ComponentProps, forwardRef } from 'preact/compat';
import { cn } from '~/lib/utils';

interface LabelProps extends ComponentProps<typeof LabelPrimitive.Root>, VariantProps<typeof labelVariants> {}

const labelVariants = cva('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70');

const Label = forwardRef<HTMLLabelElement, LabelProps>(({ ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants())} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
