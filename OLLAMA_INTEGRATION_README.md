# Ollama Integration for Medicine Search

This document explains how to set up and use the Ollama AI integration for enhanced medicine search functionality.

## Overview

The Ollama integration provides intelligent medicine search using AI models, with automatic fallback to the existing database search when Ollama is unavailable.

## Features

- **AI-Powered Search**: Uses Ollama to generate relevant medicine suggestions based on natural language queries
- **Automatic Fallback**: Falls back to database search when Ollama is unavailable
- **Smart Scoring**: Calculates relevance scores for search results
- **Seamless Integration**: Works with existing MedicineAutocomplete component

## Setup Instructions

### 1. Install Ollama

First, install Ollama on your system:

**Windows:**
```bash
# Download from https://ollama.ai/download
# Or use winget
winget install Ollama.Ollama
```

**macOS:**
```bash
# Download from https://ollama.ai/download
# Or use Homebrew
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### 2. Start Ollama Service

Start the Ollama service:

```bash
ollama serve
```

### 3. Pull a Model

Download a suitable model for medicine search:

```bash
# Recommended models for medicine search
ollama pull llama3.2
# or
ollama pull mistral
# or
ollama pull codellama
```

### 4. Configure Environment Variables

Add the following environment variables to your server configuration:

```bash
# .env file
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

### 5. Test the Integration

Run the test script to verify the integration:

```bash
cd medicine_inventory
node test-ollama-integration.js
```

## API Endpoints

### Ollama Search Endpoint

**GET** `/api/medicine-names/ollama-search`

Search for medicines using Ollama AI.

**Parameters:**
- `q` (required): Search query
- `limit` (optional): Number of results (default: 10)
- `min_score` (optional): Minimum relevance score (default: 0.1)

**Example:**
```bash
curl -X GET "http://localhost:5000/api/medicine-names/ollama-search?q=paracetamol&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Ollama Status Endpoint

**GET** `/api/medicine-names/ollama-status`

Check Ollama service status and available models.

**Example:**
```bash
curl -X GET "http://localhost:5000/api/medicine-names/ollama-status" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Frontend Usage

The integration is automatically used in the MedicineAutocomplete component. No changes are needed in your existing code.

### Example Usage

```javascript
import { ollamaAPI } from '../services/api';

// Search medicines using Ollama
const searchMedicines = async (query) => {
  try {
    const response = await ollamaAPI.search(query, {
      limit: 10,
      min_score: 0.1
    });
    
    if (response.success) {
      console.log('Search results:', response.data);
      console.log('Source:', response.source); // 'ollama' or 'database_fallback'
    }
  } catch (error) {
    console.error('Search error:', error);
  }
};

// Check Ollama status
const checkStatus = async () => {
  try {
    const status = await ollamaAPI.getStatus();
    console.log('Ollama available:', status.data.available);
  } catch (error) {
    console.error('Status check error:', error);
  }
};
```

## How It Works

1. **Search Request**: User types in the medicine search field
2. **Ollama Query**: System sends the query to Ollama API
3. **AI Processing**: Ollama generates relevant medicine suggestions
4. **Result Processing**: System parses and scores the results
5. **Fallback**: If Ollama fails, system falls back to database search
6. **Display**: Results are displayed in the autocomplete dropdown

## Configuration Options

### Ollama Service Configuration

```javascript
// In server/services/ollamaService.js
const ollamaService = {
  baseURL: process.env.OLLAMA_API_URL || 'http://localhost:11434',
  model: process.env.OLLAMA_MODEL || 'llama3.2',
  timeout: 30000 // 30 seconds
};
```

### Search Parameters

```javascript
const searchOptions = {
  limit: 10,        // Number of results
  minScore: 0.1,    // Minimum relevance score
  temperature: 0.1, // AI creativity level (lower = more consistent)
  top_p: 0.9        // AI response diversity
};
```

## Troubleshooting

### Common Issues

1. **Ollama Service Not Available**
   - Ensure Ollama is running: `ollama serve`
   - Check the service URL in environment variables
   - Verify the model is downloaded: `ollama list`

2. **Slow Response Times**
   - Reduce the model size or use a faster model
   - Increase timeout in configuration
   - Check system resources

3. **Poor Search Results**
   - Try different models (llama3.2, mistral, codellama)
   - Adjust temperature and top_p parameters
   - Modify the search prompt in ollamaService.js

4. **Fallback Not Working**
   - Check database connection
   - Verify medicine_names table exists
   - Check server logs for errors

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=ollama:*
```

### Performance Monitoring

Monitor Ollama performance:

```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Check model info
ollama show llama3.2
```

## Security Considerations

- Ollama API should be accessible only from your server
- Use authentication tokens for API access
- Consider rate limiting for search requests
- Monitor resource usage and costs

## Future Enhancements

- **Caching**: Cache Ollama responses for common queries
- **Model Selection**: Allow dynamic model selection
- **Batch Processing**: Process multiple queries at once
- **Custom Prompts**: Allow custom search prompts per category
- **Analytics**: Track search performance and user behavior

## Support

For issues related to:
- **Ollama Setup**: Check [Ollama Documentation](https://ollama.ai/docs)
- **Integration Issues**: Check server logs and test script output
- **Performance**: Monitor system resources and Ollama status

## License

This integration is part of the Medicine Inventory Management System and follows the same license terms.
