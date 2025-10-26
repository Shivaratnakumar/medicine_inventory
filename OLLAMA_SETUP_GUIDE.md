# Complete Ollama Setup Guide

This guide will walk you through setting up Ollama for AI-powered medicine search in your medicine inventory system.

## Prerequisites

- Node.js installed
- Your medicine inventory system running
- Basic command line knowledge

## Step 1: Install Ollama

### Windows

**Option A: Download from Website**
1. Go to [https://ollama.ai/download](https://ollama.ai/download)
2. Download the Windows installer
3. Run the installer as Administrator
4. Follow the installation wizard

**Option B: Using Package Managers**
```bash
# Using winget
winget install Ollama.Ollama

# Using Chocolatey
choco install ollama
```

### macOS

**Option A: Download from Website**
1. Go to [https://ollama.ai/download](https://ollama.ai/download)
2. Download the macOS installer
3. Run the installer

**Option B: Using Homebrew**
```bash
brew install ollama
```

### Linux (Ubuntu/Debian)

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

## Step 2: Verify Installation

Open a terminal/command prompt and run:

```bash
ollama --version
```

You should see output like: `ollama version 0.1.x`

## Step 3: Start Ollama Service

Start the Ollama service (this needs to run continuously):

```bash
ollama serve
```

**Important**: Keep this terminal window open. The service needs to stay running.

## Step 4: Download a Model

In a new terminal window, download a suitable model:

```bash
# Recommended for medicine search (good balance of speed and quality)
ollama pull llama3.2

# Alternative options:
# ollama pull mistral        # Fast and efficient
# ollama pull codellama      # Good for technical content
```

**Note**: The first download may take several minutes depending on your internet connection.

## Step 5: Test Ollama Setup

Run our test script to verify everything is working:

```bash
cd medicine_inventory
node test-ollama-setup.js
```

You should see:
- ✅ Ollama service is running!
- ✅ Ollama query successful!
- ✅ Medicine query successful!

## Step 6: Configure Environment Variables

1. Copy the example environment file:
```bash
cp server/env.example server/.env
```

2. Edit the `.env` file and add/update these lines:
```bash
# Ollama Configuration
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

## Step 7: Test the Integration

Run the integration test:

```bash
node test-ollama-integration.js
```

This will test:
- Ollama service status
- Medicine search functionality
- Fallback behavior

## Step 8: Start Your Application

1. Start your server:
```bash
cd server
npm start
```

2. Start your frontend:
```bash
cd client
npm start
```

3. Test the medicine search in your application - it should now use AI-powered search!

## Troubleshooting

### Common Issues

**1. "ollama: command not found"**
- Ollama is not installed or not in PATH
- Reinstall Ollama and restart your terminal

**2. "Connection refused" error**
- Ollama service is not running
- Run `ollama serve` in a terminal

**3. "Model not found" error**
- No models are installed
- Run `ollama pull llama3.2`

**4. Slow responses**
- Try a smaller model: `ollama pull mistral`
- Check your system resources

**5. "Permission denied" on Windows**
- Run terminal as Administrator
- Or add Ollama to your PATH manually

### Performance Tips

**For Better Performance:**
1. Use a smaller model for faster responses:
   ```bash
   ollama pull mistral
   ```
   Then update your `.env`:
   ```bash
   OLLAMA_MODEL=mistral
   ```

2. Ensure you have enough RAM (8GB+ recommended)

3. Close other resource-intensive applications

### Model Recommendations

| Model | Size | Speed | Quality | Best For |
|-------|------|-------|---------|----------|
| `mistral` | ~4GB | Fast | Good | Quick responses |
| `llama3.2` | ~2GB | Medium | Good | Balanced |
| `codellama` | ~4GB | Medium | Excellent | Technical content |

## Advanced Configuration

### Custom Model Configuration

You can customize the Ollama service behavior by modifying `server/services/ollamaService.js`:

```javascript
// Adjust these parameters for better results
const prompt = `You are a medical database assistant...`;

// Temperature: 0.1 (more consistent) to 1.0 (more creative)
temperature: 0.1,

// Top-p: Controls response diversity
top_p: 0.9,

// Max tokens: Maximum response length
max_tokens: 2000
```

### Multiple Models

You can install multiple models and switch between them:

```bash
# Install multiple models
ollama pull llama3.2
ollama pull mistral
ollama pull codellama

# List installed models
ollama list

# Switch model in .env file
OLLAMA_MODEL=mistral
```

## Security Considerations

1. **Local Only**: Ollama runs locally on your machine
2. **No Internet Required**: After model download, works offline
3. **Data Privacy**: All processing happens on your machine
4. **Firewall**: Ensure port 11434 is not exposed externally

## Monitoring and Maintenance

### Check Ollama Status
```bash
# Check if service is running
curl http://localhost:11434/api/tags

# List installed models
ollama list

# Check model details
ollama show llama3.2
```

### Update Models
```bash
# Update a model
ollama pull llama3.2

# Remove unused models
ollama rm old-model-name
```

### Restart Service
If you need to restart Ollama:
1. Stop the service (Ctrl+C in the terminal running `ollama serve`)
2. Start it again: `ollama serve`

## Next Steps

Once Ollama is set up:

1. **Test the Integration**: Use the medicine search in your application
2. **Monitor Performance**: Check response times and accuracy
3. **Customize Prompts**: Adjust the search prompts for better results
4. **Scale Up**: Consider using larger models for better accuracy

## Support

If you encounter issues:

1. **Check Logs**: Look at server console output for errors
2. **Test Ollama**: Run `node test-ollama-setup.js`
3. **Verify Configuration**: Check your `.env` file
4. **Restart Services**: Restart both Ollama and your application

## Success Indicators

You'll know Ollama is working correctly when:

- ✅ `ollama serve` runs without errors
- ✅ `ollama list` shows your installed model
- ✅ `node test-ollama-setup.js` passes all tests
- ✅ Medicine search in your app shows AI-generated results
- ✅ Console shows "Using Ollama search results" messages

Congratulations! You now have AI-powered medicine search in your inventory system! 🎉
