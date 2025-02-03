import { ChevronDown, X } from 'lucide-preact';
import { JSX } from 'preact';
import { HTMLAttributes } from 'preact/compat';
import { useEffect, useRef, useState } from 'preact/hooks';
import { cn } from '~/lib/utils';

interface Option {
  value: string;
  label: string | JSX.Element;
  minimalLabel?: string | JSX.Element;
  searchableLabel?: string;
}

interface TagSelectProps extends HTMLAttributes<HTMLDivElement> {
  options: Option[];
  selectedValues: string[];
  onChangeTags: (values: string[]) => void;
  icon?: JSX.Element;
  placeholder?: string | JSX.Element;
  disabled?: boolean;
  align?: 'left' | 'right';
}

export function TagSelect({
  options,
  selectedValues,
  onChangeTags,
  icon,
  placeholder = 'Select options...',
  disabled = false,
  align = 'left',
  ...props
}: TagSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOptions = options.filter((opt) => selectedValues.includes(opt.value));
  const availableOptions = options.filter((opt) => !selectedValues.includes(opt.value));

  const filteredOptions = availableOptions.filter((option) => {
    const searchableText = option.searchableLabel || (typeof option.label === 'string' ? option.label : '');
    return searchableText.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleRemoveTag = (valueToRemove: string) => {
    onChangeTags(selectedValues.filter((value) => value !== valueToRemove));
  };

  const handleAddOption = (valueToAdd: string) => {
    onChangeTags([...selectedValues, valueToAdd]);
    setIsOpen(false);
    setSearchTerm('');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          onChangeTags([filteredOptions[highlightedIndex].value]);
          setIsOpen(false);
          setSearchTerm('');
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        break;
    }
  };

  return (
    <div ref={containerRef} class={cn('relative', props.class)} onKeyDown={handleKeyDown}>
      {selectedValues.length === 0 ? (
        // Button-like appearance when no selections
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => searchInputRef.current?.focus(), 0);
            }
          }}
          disabled={disabled}
          class={cn(
            'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium w-full',
            'transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            'disabled:pointer-events-none disabled:opacity-50 border border-input bg-background',
            'shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-3 rounded-lg gap-2',
          )}
        >
          <span class="text-muted-foreground font-semibold">{placeholder}</span>
          <ChevronDown class="h-4 w-4 opacity-50 ml-auto" />
        </button>
      ) : (
        // Existing tag display when there are selections
        <div
          class={cn(
            'inline-flex items-center w-full min-h-[2.25rem] rounded-lg border border-stone-500',
            'bg-background px-3 py-1 text-sm ring-offset-background focus-within:ring-2',
            'focus-within:ring-ring focus-within:ring-offset-2',
            disabled && 'cursor-not-allowed opacity-50',
          )}
        >
          {!!(icon && selectedOptions.length) && (
            <div class="mr-2 flex-shrink-0" title={typeof placeholder === 'string' ? placeholder : ''}>
              {icon}
            </div>
          )}
          <div class="flex flex-wrap gap-2 flex-grow">
            <ul>
              {selectedOptions.map((option) => (
                <li
                  key={option.value}
                  class={cn(
                    'inline-flex items-center pl-1 pr-2 font-semibold',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                    'transition-colors text-foreground',
                    option.minimalLabel && 'text-lg',
                  )}
                  title={typeof option.label === 'string' ? option.label : ''}
                >
                  {option.minimalLabel ?? option.label}
                  <button onClick={() => handleRemoveTag(option.value)} class="ml-1 hover:text-destructive">
                    <X class="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              if (!isOpen) {
                setTimeout(() => searchInputRef.current?.focus(), 0);
              }
            }}
            disabled={disabled}
            class="ml-2 flex-shrink-0 hover:text-accent-foreground"
          >
            <ChevronDown class="h-4 w-4 opacity-50" />
          </button>
        </div>
      )}
      {isOpen && (
        <div
          class={cn(
            'absolute z-10 mt-1 bg-white dark:bg-black border rounded-lg shadow-lg',
            'w-max min-w-full whitespace-nowrap',
            align === 'right' ? 'right-0' : 'left-0',
          )}
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
              class="w-full px-3 py-2 border dark:bg-black text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <ul role="listbox" class="max-h-60 overflow-auto py-1" aria-activedescendant={`option-${highlightedIndex}`}>
            {filteredOptions.length === 0 ? (
              <li class="px-4 py-2 text-muted-foreground">No options found</li>
            ) : (
              filteredOptions.map((option, index) => (
                <li
                  key={option.value}
                  id={`option-${index}`}
                  role="option"
                  onClick={() => handleAddOption(option.value)}
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
      )}
    </div>
  );
}
