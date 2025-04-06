import { ChevronDown } from 'lucide-preact';
import { JSX } from 'preact';
import { HTMLAttributes, useRef, useState } from 'preact/compat';
import { cn } from '~/lib/utils';

export interface DropdownOption {
  value: string;
  label: JSX.Element | string;
  searchableLabel?: string;
}

interface DropdownListProps extends HTMLAttributes<HTMLDivElement> {
  options: DropdownOption[];
  value?: string;
  onChangeOption: (value: string) => void;
  placeholder?: string;
  align?: 'left' | 'right';
  useNativePopover?: boolean;
  id?: string;
  trigger?: React.ReactNode;
}

export function DropdownList({
  options,
  value,
  onChangeOption,
  placeholder = 'Select...',
  align = 'left',
  useNativePopover = false,
  trigger,
  ...props
}: DropdownListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const filteredOptions = options.filter((o) => {
    const searchableText = o.searchableLabel || (typeof o.label === 'string' ? o.label : '');
    return searchableText.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const closePopover = () => {
    if (useNativePopover && popoverRef.current) {
      popoverRef.current.hidePopover();
    } else {
      setIsOpen(false);
    }
    setSearchTerm('');
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          onChangeOption(filteredOptions[highlightedIndex].value);
          closePopover();
          setSearchTerm('');
        }
        break;
      case 'Escape':
        closePopover();
        setSearchTerm('');
        break;
    }
  };

  const defaultTrigger = (
    <button
      type="button"
      onClick={() => {
        if (useNativePopover && popoverRef.current) {
          popoverRef.current.togglePopover();
        } else {
          setIsOpen(!isOpen);
        }
      }}
      popoverTarget={useNativePopover ? `${props.id}-popover` : undefined}
      class={cn(
        'inline-flex items-center justify-between w-full px-3 py-2',
        'border rounded-lg bg-background shadow-xs',
        'hover:bg-accent hover:text-accent-foreground',
      )}
    >
      <span class={cn(!selectedOption && 'text-muted-foreground')}>{selectedOption?.label || placeholder}</span>
      <ChevronDown class="h-4 w-4 opacity-50 ml-2" />
    </button>
  );

  const content = (
    <div
      ref={popoverRef}
      class={cn(
        'bg-white dark:bg-black border rounded-lg shadow-lg',
        'w-max min-w-full whitespace-nowrap',
        useNativePopover
          ? 'p-2 mt-6 mx-auto min-w-[16rem] backdrop:bg-black/50 backdrop:backdrop-blur-md'
          : 'absolute z-10 mt-1',
        !useNativePopover && (align === 'right' ? 'right-0' : 'left-0'),
      )}
      id={props.id ? `${props.id}-popover` : undefined}
      popover={useNativePopover ? true : undefined}
    >
      <div class="p-2">
        <input
          ref={searchInputRef}
          type="text"
          value={searchTerm}
          onInput={(e) => {
            setSearchTerm((e.target as HTMLInputElement).value);
            setHighlightedIndex(0);
          }}
          placeholder="Type to search..."
          class="w-full px-3 py-2 border rounded-md focus:outline-hidden focus:ring-2"
        />
      </div>
      <ul role="listbox" class="max-h-60 overflow-auto py-1" aria-activedescendant={`option-${highlightedIndex}`}>
        {!filteredOptions.length ? (
          <li class="px-4 py-2 text-muted-foreground">No options found</li>
        ) : (
          filteredOptions.map((option, index) => (
            <li
              key={option.value}
              id={`option-${index}`}
              role="option"
              onClick={() => {
                onChangeOption(option.value);
                closePopover();
              }}
              class={cn(
                'px-4 py-2 cursor-pointer flex items-center gap-2',
                'hover:bg-accent hover:text-accent-foreground',
                index === highlightedIndex && 'bg-accent text-accent-foreground',
              )}
            >
              {option.label}
            </li>
          ))
        )}
      </ul>
    </div>
  );

  return (
    <div class="relative" onKeyDown={handleKeyDown} {...props}>
      {trigger || defaultTrigger}
      {!useNativePopover && isOpen && content}
      {useNativePopover && content}
    </div>
  );
}
