const axios = require('axios');

class OllamaService {
  constructor() {
    this.baseURL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama3.2';
    this.timeout = 30000; // 30 seconds timeout
  }

  /**
   * Search for medicines using Ollama API
   * @param {string} query - The search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} - Search results
   */
  async searchMedicines(query, options = {}) {
    try {
      const { limit = 10, minScore = 0.1 } = options;
      
      // Create a prompt for medicine search
      const prompt = this.createMedicineSearchPrompt(query, limit);
      
      const response = await axios.post(`${this.baseURL}/api/generate`, {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1, // Low temperature for more consistent results
          top_p: 0.9,
          max_tokens: 2000
        }
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.response) {
        return this.parseMedicineResponse(response.data.response, query, minScore);
      }

      throw new Error('Invalid response from Ollama API');
    } catch (error) {
      console.error('Ollama API error:', error);
      
      // Return empty results on error
      return {
        success: false,
        data: [],
        error: error.message,
        fallback: true
      };
    }
  }

  /**
   * Create a prompt for medicine search
   * @param {string} query - The search query
   * @param {number} limit - Number of results to return
   * @returns {string} - The formatted prompt
   */
  createMedicineSearchPrompt(query, limit) {
    return `You are a medical database assistant. Based on the search query "${query}", provide a list of ${limit} relevant medicines with their details.

For each medicine, provide the following information in JSON format:
- name: The brand/commercial name
- generic_name: The generic/chemical name
- manufacturer: The pharmaceutical company
- description: Brief description of the medicine
- common_names: Array of common names or aliases
- category: Medicine category (e.g., Antibiotic, Pain Relief, etc.)
- prescription_required: Boolean indicating if prescription is needed

Format the response as a JSON array of objects. Only return the JSON, no additional text.

Example format:
[
  {
    "name": "Paracetamol",
    "generic_name": "Acetaminophen",
    "manufacturer": "Various",
    "description": "Pain reliever and fever reducer",
    "common_names": ["Tylenol", "Panadol"],
    "category": "Pain Relief",
    "prescription_required": false
  }
]

Search query: "${query}"`;
  }

  /**
   * Parse the response from Ollama API
   * @param {string} response - The raw response from Ollama
   * @param {string} query - Original search query
   * @param {number} minScore - Minimum score threshold
   * @returns {Object} - Parsed results
   */
  parseMedicineResponse(response, query, minScore) {
    try {
      // Clean the response - remove any markdown formatting or extra text
      let cleanResponse = response.trim();
      
      // Remove any text before the first '[' and after the last ']'
      const startIndex = cleanResponse.indexOf('[');
      const endIndex = cleanResponse.lastIndexOf(']');
      
      if (startIndex !== -1 && endIndex !== -1) {
        cleanResponse = cleanResponse.substring(startIndex, endIndex + 1);
      }

      // Parse the JSON
      const medicines = JSON.parse(cleanResponse);
      
      if (!Array.isArray(medicines)) {
        throw new Error('Response is not an array');
      }

      // Add search metadata and score to each medicine
      const scoredMedicines = medicines.map((medicine, index) => ({
        ...medicine,
        id: `ollama_${Date.now()}_${index}`, // Generate unique ID
        score: this.calculateScore(medicine, query),
        source: 'ollama',
        search_query: query
      }));

      // Filter by minimum score and sort by score
      const filteredMedicines = scoredMedicines
        .filter(medicine => medicine.score >= minScore)
        .sort((a, b) => b.score - a.score);

      return {
        success: true,
        data: filteredMedicines,
        total: filteredMedicines.length,
        source: 'ollama',
        query: query
      };
    } catch (error) {
      console.error('Error parsing Ollama response:', error);
      return {
        success: false,
        data: [],
        error: 'Failed to parse Ollama response',
        fallback: true
      };
    }
  }

  /**
   * Calculate relevance score for a medicine
   * @param {Object} medicine - Medicine object
   * @param {string} query - Search query
   * @returns {number} - Relevance score (0-1)
   */
  calculateScore(medicine, query) {
    const queryLower = query.toLowerCase();
    let score = 0;
    let matches = 0;

    // Check name match (highest weight)
    if (medicine.name && medicine.name.toLowerCase().includes(queryLower)) {
      score += 0.4;
      matches++;
    }

    // Check generic name match
    if (medicine.generic_name && medicine.generic_name.toLowerCase().includes(queryLower)) {
      score += 0.3;
      matches++;
    }

    // Check common names match
    if (medicine.common_names && Array.isArray(medicine.common_names)) {
      const commonMatch = medicine.common_names.some(name => 
        name.toLowerCase().includes(queryLower)
      );
      if (commonMatch) {
        score += 0.2;
        matches++;
      }
    }

    // Check description match
    if (medicine.description && medicine.description.toLowerCase().includes(queryLower)) {
      score += 0.1;
      matches++;
    }

    // Bonus for exact matches
    if (medicine.name && medicine.name.toLowerCase() === queryLower) {
      score += 0.2;
    }

    // Normalize score based on number of matches
    if (matches > 0) {
      score = Math.min(score, 1.0);
    }

    return score;
  }

  /**
   * Check if Ollama service is available
   * @returns {Promise<boolean>} - Service availability
   */
  async isAvailable() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.error('Ollama service not available:', error.message);
      return false;
    }
  }

  /**
   * Get available models
   * @returns {Promise<Array>} - List of available models
   */
  async getModels() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`, {
        timeout: 5000
      });
      return response.data.models || [];
    } catch (error) {
      console.error('Error fetching Ollama models:', error);
      return [];
    }
  }
}

module.exports = new OllamaService();
