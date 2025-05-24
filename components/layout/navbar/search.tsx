'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type Suggestion = {
  id: string;
  title: string;
  handle: string;
  url: string;
  image: string | null;
  altText?: string;
};

export default function Search() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search/search-suggestions?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();

        if (res.ok && Array.isArray(data.products) && data.products.length > 0) {
          setSuggestions(data.products);
          setShowDropdown(true);
        } else {
          setSuggestions([]);
          setShowDropdown(false);
        }
      } catch (error) {
        console.error('[Search] Fetch error:', error);
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        !dropdownRef.current?.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowDropdown(false);
    }
  };

  const handleSuggestionClick = (handle: string) => {
    router.push(`/products/${handle}`);
    setShowDropdown(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-full max-w-xl"
      role="search"
      aria-label="Product search"
    >
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name="q"
          placeholder="Search for products..."
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setShowDropdown(true)}
          aria-autocomplete="list"
          aria-controls="search-suggestion-list"
          aria-expanded={showDropdown}
          className="w-full rounded-md border bg-white px-4 py-3 pr-10 text-sm text-black shadow-sm placeholder:text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-400"
        />
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>

        {isLoading && (
          <div className="absolute top-2.5 right-9 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
       <ul
          ref={dropdownRef}
          id="search-suggestion-list"
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
        >
          {suggestions.map(({ id, title, url, image, altText }) => (
            <li
              key={id}
              role="option"
              tabIndex={0}
              className="cursor-pointer px-4 py-3 text-sm hover:bg-gray-100 hover:text-blue-700 focus:bg-blue-500 focus:text-white flex items-center gap-3"
              onClick={() => window.location.href = url}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  window.location.href = url;
                }
              }}
            >
              {image && (
                <img
                  src={image}
                  alt={altText || title}
                  className="w-10 h-10 object-cover rounded"
                />
              )}
              <span>{title}</span>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
