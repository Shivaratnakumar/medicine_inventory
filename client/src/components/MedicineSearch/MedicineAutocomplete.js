import React, { useState, useEffect, useRef } from 'react';
import { searchMedicineNames, getAutocompleteSuggestions } from '../../services/api';

const MedicineAutocomplete = ({ 
  onSelect, 
  placeholder = "Search medicines...", 
  className = "",
  showGeneric = true,
  showBrand = true,
  maxSuggestions = 10,
  minQueryLength = 2
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState(null);
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Debounced search function
  const debouncedSearch = (searchQuery) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(async () => {
      if (searchQuery.length >= minQueryLength) {
        setLoading(true);
        setError(null);
        
        try {
          const response = await getAutocompleteSuggestions(searchQuery, maxSuggestions);
          setSuggestions(response.data || []);
          setShowSuggestions(true);
        } catch (err) {
          console.error('Autocomplete error:', err);
          setError('Failed to load suggestions');
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // 300ms debounce
  };

  useEffect(() => {
    debouncedSearch(query);
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [query]);

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    
    if (value.length < minQueryLength) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (medicine) => {
    setQuery(medicine.name);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onSelect && onSelect(medicine);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Highlight matching text
  const highlightText = (text, query) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 font-semibold">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className={`relative ${className}`} ref={suggestionsRef}>
      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          autoComplete="off"
        />
        
        {/* Loading Indicator */}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-1 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((medicine, index) => (
            <div
              key={medicine.id}
              onClick={() => handleSuggestionSelect(medicine)}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                index === selectedIndex ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex flex-col">
                {/* Medicine Name */}
                <div className="font-semibold text-gray-900">
                  {highlightText(medicine.name, query)}
                </div>
                
                {/* Generic Name */}
                {showGeneric && medicine.generic_name && (
                  <div className="text-sm text-gray-600 mt-1">
                    Generic: {highlightText(medicine.generic_name, query)}
                  </div>
                )}
                
                {/* Brand Name */}
                {showBrand && medicine.brand_name && (
                  <div className="text-sm text-gray-500 mt-1">
                    Brand: {highlightText(medicine.brand_name, query)}
                  </div>
                )}
                
                {/* Manufacturer */}
                {medicine.manufacturer && (
                  <div className="text-xs text-gray-500 mt-1">
                    Manufacturer: {medicine.manufacturer}
                  </div>
                )}
                
                {/* Price */}
                {medicine.price && (
                  <div className="text-xs text-green-600 mt-1 font-medium">
                    Price: ${medicine.price}
                  </div>
                )}
                
                {/* Stock */}
                {medicine.quantity_in_stock !== undefined && (
                  <div className="text-xs text-blue-600 mt-1">
                    Stock: {medicine.quantity_in_stock} units
                  </div>
                )}
                
                {/* Common Names */}
                {medicine.common_names && medicine.common_names.length > 0 && (
                  <div className="text-xs text-gray-400 mt-1">
                    Also known as: {medicine.common_names.slice(0, 3).join(', ')}
                    {medicine.common_names.length > 3 && '...'}
                  </div>
                )}
                
                {/* Score (for debugging) */}
                {process.env.NODE_ENV === 'development' && medicine.score !== undefined && (
                  <div className="text-xs text-gray-400 mt-1">
                    Score: {medicine.score.toFixed(3)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {showSuggestions && !loading && suggestions.length === 0 && query.length >= minQueryLength && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
          No medicines found for "{query}"
        </div>
      )}
    </div>
  );
};

export default MedicineAutocomplete;
