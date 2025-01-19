import { Plus } from 'lucide-preact';
import { JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { cn } from '~/lib/utils';

interface Option {
  value: string;
  label: string | JSX.Element;
  searchableLabel?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string | JSX.Element;
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  className = '',
}: SearchableSelectProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const filteredOptions = options.filter((option) => {
    const searchableText = option.searchableLabel || (typeof option.label === 'string' ? option.label : '');
    return searchableText.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
          onChange(filteredOptions[highlightedIndex].value);
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
    <div ref={containerRef} class={`relative ${className}`} onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => searchInputRef.current?.focus(), 0);
          }
        }}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        class={cn(
          'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium',
          'transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          'disabled:pointer-events-none disabled:opacity-50 border border-input bg-background',
          'shadow-sm hover:bg-accent hover:text-accent-foreground h-9 pl-3 pr-2 py-2 rounded-lg relative',
        )}
      >
        {selectedOption ? selectedOption.label : placeholder} <Plus class="ml-2 h-4 w-4 opacity-50" />
        {/* <ChevronDown class="ml-2 h-4 w-4 opacity-50" /> */}
      </button>

      {isOpen && (
        <div class="absolute left-0 z-10 mt-1 bg-white border rounded-lg shadow-lg whitespace-nowrap">
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
              class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <ul role="listbox" class="max-h-60 overflow-auto py-1" aria-activedescendant={`option-${highlightedIndex}`}>
            {filteredOptions.length === 0 ? (
              <li class="px-4 py-2 text-gray-500">No options found</li>
            ) : (
              filteredOptions.map((option, index) => (
                <li
                  key={option.value}
                  id={`option-${index}`}
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  class={`px-4 py-2 cursor-pointer flex items-center gap-2 ${
                    option.value === value ? 'bg-blue-100 text-blue-900' : 'hover:bg-gray-100'
                  } ${index === highlightedIndex ? 'bg-gray-100' : ''} focus:outline-none`}
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
