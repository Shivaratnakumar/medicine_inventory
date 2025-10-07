# Medicine Names API Documentation

This API provides fast, scalable medicine name management with autocomplete and fuzzy search capabilities using Fuse.js and Supabase.

## Features

- 🔍 **Fuzzy Search**: Advanced search with typo tolerance and similarity scoring
- ⚡ **Autocomplete**: Real-time suggestions as users type
- 🚀 **Fast Performance**: In-memory caching with Fuse.js for sub-millisecond searches
- 📊 **Analytics**: Medicine name statistics and popularity tracking
- 🔄 **Bulk Operations**: Import multiple medicine names at once
- 🛡️ **Security**: JWT authentication and admin-only operations

## Setup Instructions

### 1. Database Setup

Run the SQL script in your Supabase dashboard:

```sql
-- Copy and paste the contents of create-medicine-names-table.sql
-- into your Supabase SQL Editor and execute
```

### 2. Environment Variables

Ensure your `.env` file contains the Supabase credentials:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Start the Server

```bash
cd medicine_inventory/server
npm run dev
```

## API Endpoints

### Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### 1. Get All Medicine Names

```http
GET /api/medicine-names
```

**Query Parameters:**
- `search` (optional): Search query for filtering
- `limit` (optional, default: 50): Number of results per page
- `offset` (optional, default: 0): Pagination offset

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Paracetamol",
      "generic_name": "Acetaminophen",
      "brand_name": "Tylenol",
      "common_names": ["Panadol", "Calpol"],
      "popularity_score": 100,
      "is_active": true,
      "created_at": "2025-01-27T10:00:00Z",
      "updated_at": "2025-01-27T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### 2. Autocomplete

```http
GET /api/medicine-names/autocomplete?q=para&limit=10
```

**Query Parameters:**
- `q` (required): Search query (minimum 2 characters)
- `limit` (optional, default: 10): Maximum number of suggestions

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Paracetamol",
      "generic_name": "Acetaminophen",
      "brand_name": "Tylenol",
      "common_names": ["Panadol", "Calpol"],
      "score": 0.1,
      "highlight": [
        {
          "key": "name",
          "value": "Paracetamol",
          "indices": [[0, 3]]
        }
      ]
    }
  ],
  "query": "para",
  "total": 1
}
```

### 3. Advanced Search

```http
GET /api/medicine-names/search?q=ibuprofen&type=all&min_score=0.1&limit=20&offset=0
```

**Query Parameters:**
- `q` (required): Search query (minimum 2 characters)
- `type` (optional, default: "all"): Search type - "all", "generic", "brand", "common"
- `min_score` (optional, default: 0.1): Minimum similarity score (0-1)
- `limit` (optional, default: 20): Number of results
- `offset` (optional, default: 0): Pagination offset

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Ibuprofen",
      "generic_name": "Ibuprofen",
      "brand_name": "Advil",
      "common_names": ["Motrin", "Nurofen"],
      "score": 0.0,
      "matches": [
        {
          "key": "name",
          "value": "Ibuprofen",
          "indices": [[0, 8]]
        }
      ]
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  },
  "search": {
    "query": "ibuprofen",
    "type": "all",
    "min_score": 0.1
  }
}
```

### 4. Add Medicine Name (Admin Only)

```http
POST /api/medicine-names
```

**Request Body:**
```json
{
  "name": "New Medicine",
  "generic_name": "Generic Name",
  "brand_name": "Brand Name",
  "common_names": ["Common1", "Common2"],
  "popularity_score": 50
}
```

**Response:**
```json
{
  "success": true,
  "message": "Medicine name created successfully",
  "data": {
    "id": "uuid",
    "name": "New Medicine",
    "generic_name": "Generic Name",
    "brand_name": "Brand Name",
    "common_names": ["Common1", "Common2"],
    "popularity_score": 50,
    "is_active": true,
    "created_at": "2025-01-27T10:00:00Z",
    "updated_at": "2025-01-27T10:00:00Z"
  }
}
```

### 5. Update Medicine Name (Admin Only)

```http
PUT /api/medicine-names/:id
```

**Request Body:** Same as POST

**Response:** Same as POST

### 6. Delete Medicine Name (Admin Only)

```http
DELETE /api/medicine-names/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Medicine name deleted successfully"
}
```

### 7. Bulk Import (Admin Only)

```http
POST /api/medicine-names/bulk-import
```

**Request Body:**
```json
{
  "medicines": [
    {
      "name": "Medicine 1",
      "generic_name": "Generic 1",
      "brand_name": "Brand 1",
      "common_names": ["Common1"],
      "popularity_score": 10
    },
    {
      "name": "Medicine 2",
      "generic_name": "Generic 2",
      "popularity_score": 20
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully imported 2 medicine names",
  "data": {
    "imported": 2,
    "total": 2,
    "medicines": [...]
  }
}
```

### 8. Get Statistics

```http
GET /api/medicine-names/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "with_generic": 85,
    "with_brand": 70,
    "with_common_names": 60,
    "top_popular": [
      { "name": "Paracetamol", "score": 100 },
      { "name": "Ibuprofen", "score": 95 }
    ]
  }
}
```

## Frontend Integration

### React Autocomplete Component Example

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MedicineAutocomplete = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length >= 2) {
      setLoading(true);
      axios.get(`/api/medicine-names/autocomplete?q=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        setSuggestions(response.data.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Autocomplete error:', error);
        setLoading(false);
      });
    } else {
      setSuggestions([]);
    }
  }, [query]);

  return (
    <div className="autocomplete-container">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search medicines..."
        className="autocomplete-input"
      />
      {loading && <div className="loading">Searching...</div>}
      {suggestions.length > 0 && (
        <ul className="suggestions">
          {suggestions.map(medicine => (
            <li
              key={medicine.id}
              onClick={() => {
                onSelect(medicine);
                setQuery(medicine.name);
                setSuggestions([]);
              }}
              className="suggestion-item"
            >
              <strong>{medicine.name}</strong>
              {medicine.generic_name && (
                <span className="generic"> ({medicine.generic_name})</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

### Search with Debouncing

```jsx
import { useDebounce } from './hooks/useDebounce';

const MedicineSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      axios.get(`/api/medicine-names/search?q=${debouncedQuery}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => setResults(response.data.data))
      .catch(error => console.error('Search error:', error));
    }
  }, [debouncedQuery]);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search medicines..."
      />
      <div className="search-results">
        {results.map(medicine => (
          <div key={medicine.id} className="medicine-card">
            <h3>{medicine.name}</h3>
            {medicine.generic_name && (
              <p>Generic: {medicine.generic_name}</p>
            )}
            {medicine.brand_name && (
              <p>Brand: {medicine.brand_name}</p>
            )}
            <p>Score: {medicine.score?.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Performance Features

### Caching
- Medicine names are cached in memory for 5 minutes
- Fuse.js instance is reused for consistent performance
- Cache automatically refreshes when data changes

### Search Optimization
- Fuse.js provides sub-millisecond search times
- Configurable similarity thresholds
- Weighted search across multiple fields
- Extended search patterns support

### Database Optimization
- Full-text search vectors for PostgreSQL
- GIN indexes for array searches
- Trigram similarity for fuzzy matching
- Optimized indexes for common queries

## Testing

Run the test suite:

```bash
node test-medicine-names-api.js
```

This will test all endpoints and verify functionality.

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `500`: Internal Server Error

## Rate Limiting

The API includes rate limiting:
- 100 requests per 15 minutes per IP
- Applied to all `/api/` routes

## Security

- JWT authentication required for all endpoints
- Admin-only operations for create, update, delete
- Input validation and sanitization
- SQL injection protection via Supabase
- CORS configuration for frontend integration

