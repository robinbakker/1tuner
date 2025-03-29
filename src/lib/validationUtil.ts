export const MAX_SEARCH_LENGTH = 100;
export const MIN_SEARCH_LENGTH = 1;

const validateSearchQuery = (query: string | null | undefined): string => {
  if (!query) return '';
  const sanitizedQuery = query.trim().slice(0, MAX_SEARCH_LENGTH);

  // Return empty string if below minimum length
  if (sanitizedQuery.length < MIN_SEARCH_LENGTH) {
    return '';
  }

  // Remove any characters that are not letters, numbers, spaces, hyphens, or underscores
  return sanitizedQuery.replace(/[^a-zA-Z0-9\s\-_]/g, '');
};

export const validationUtil = { validateSearchQuery };
