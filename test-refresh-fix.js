const express = require('express');
const path = require('path');

const app = express();
const PORT = 5001; // Use a different port for testing

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'client/build')));

// Test API endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Handle React routing, return all requests to React app
// But exclude API routes
app.get('*', (req, res) => {
  // Don't serve React app for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'API route not found'
    });
  }
  
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🧪 Test server running on port ${PORT}`);
  console.log(`📱 Open http://localhost:${PORT} in your browser`);
  console.log(`🔧 Test API: http://localhost:${PORT}/api/test`);
  console.log(`\n✅ To test the refresh fix:`);
  console.log(`1. Open http://localhost:${PORT}`);
  console.log(`2. Navigate to any route (e.g., /dashboard)`);
  console.log(`3. Refresh the page - it should work now!`);
});
