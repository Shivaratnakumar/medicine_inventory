import React, { useState } from 'react';
import MedicineAutocomplete from './MedicineAutocomplete';
import { searchMedicineNames, ollamaAPI } from '../../services/api';

const MedicineSearchExample = () => {
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleMedicineSelect = (medicine) => {
    setSelectedMedicine(medicine);
    console.log('Selected medicine:', medicine);
  };

  const handleSearch = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Try Ollama API first
      const ollamaResponse = await ollamaAPI.search(query, {
        limit: 20,
        min_score: 0.1
      });
      
      if (ollamaResponse.success && ollamaResponse.data && ollamaResponse.data.length > 0) {
        setSearchResults(ollamaResponse.data);
        console.log('Using Ollama search results:', ollamaResponse.source);
      } else {
        // Fallback to database search
        console.log('Ollama search failed or no results, using database search');
        const response = await searchMedicineNames(query, {
          type: 'all',
          min_score: 0.1,
          limit: 20
        });
        setSearchResults(response.data || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      
      // Fallback to database search on error
      try {
        console.log('Falling back to database search due to error');
        const response = await searchMedicineNames(query, {
          type: 'all',
          min_score: 0.1,
          limit: 20
        });
        setSearchResults(response.data || []);
      } catch (fallbackError) {
        console.error('Fallback search error:', fallbackError);
        setSearchResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    handleSearch(value);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Medicine Search & Autocomplete Demo
        </h2>
        
        {/* Autocomplete Example */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Autocomplete Search
          </h3>
          <p className="text-gray-600 mb-4">
            Start typing a medicine name to see autocomplete suggestions:
          </p>
          <MedicineAutocomplete
            onSelect={handleMedicineSelect}
            placeholder="Type medicine name (e.g., 'para', 'ibu', 'amox')..."
            className="w-full"
            showGeneric={true}
            showBrand={true}
            maxSuggestions={8}
          />
          
          {selectedMedicine && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800">Selected Medicine:</h4>
              <div className="mt-2 text-sm text-blue-700">
                <p><strong>Name:</strong> {selectedMedicine.name}</p>
                {selectedMedicine.generic_name && (
                  <p><strong>Generic:</strong> {selectedMedicine.generic_name}</p>
                )}
                {selectedMedicine.brand_name && (
                  <p><strong>Brand:</strong> {selectedMedicine.brand_name}</p>
                )}
                {selectedMedicine.common_names && selectedMedicine.common_names.length > 0 && (
                  <p><strong>Common Names:</strong> {selectedMedicine.common_names.join(', ')}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Search Results Example */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Advanced Search
          </h3>
          <p className="text-gray-600 mb-4">
            Use the search below to see detailed search results with similarity scores:
          </p>
          
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInputChange}
              placeholder="Search medicines with fuzzy matching..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold text-gray-700">
                Search Results ({searchResults.length} found):
              </h4>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {searchResults.map((medicine, index) => (
                  <div
                    key={medicine.id}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-800">
                          {medicine.name}
                        </h5>
                        {medicine.generic_name && (
                          <p className="text-sm text-gray-600">
                            Generic: {medicine.generic_name}
                          </p>
                        )}
                        {medicine.brand_name && (
                          <p className="text-sm text-gray-600">
                            Brand: {medicine.brand_name}
                          </p>
                        )}
                        {medicine.common_names && medicine.common_names.length > 0 && (
                          <p className="text-xs text-gray-500">
                            Also known as: {medicine.common_names.slice(0, 3).join(', ')}
                            {medicine.common_names.length > 3 && '...'}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono text-gray-500">
                          Score: {medicine.score?.toFixed(3) || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-400">
                          Popularity: {medicine.popularity_score}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
            <div className="mt-4 p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
              No medicines found for "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      {/* API Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          API Features Demonstrated
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>✅ <strong>Fuzzy Search:</strong> Find medicines even with typos</li>
          <li>✅ <strong>Autocomplete:</strong> Real-time suggestions as you type</li>
          <li>✅ <strong>Similarity Scoring:</strong> Results ranked by relevance</li>
          <li>✅ <strong>Multiple Fields:</strong> Search across name, generic, brand, and common names</li>
          <li>✅ <strong>Debounced Requests:</strong> Optimized API calls</li>
          <li>✅ <strong>Keyboard Navigation:</strong> Arrow keys, Enter, Escape support</li>
          <li>✅ <strong>Error Handling:</strong> Graceful error states</li>
          <li>✅ <strong>Loading States:</strong> Visual feedback during searches</li>
        </ul>
      </div>
    </div>
  );
};

export default MedicineSearchExample;

