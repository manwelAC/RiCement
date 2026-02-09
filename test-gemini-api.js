// Simple API Test Script
// Run this in your browser console or Node.js to test the Gemini API

const API_KEY = 'AIzaSyATmW88NXhGI-h7coo2h70eKTEA5OSwmok';

async function testGeminiAPI() {
  try {
    console.log('Testing Gemini API...');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Hello, can you tell me about concrete?"
          }]
        }]
      }),
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      return;
    }

    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      console.log('SUCCESS! AI Response:', data.candidates[0].content.parts[0].text);
    } else {
      console.error('Unexpected response structure');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Uncomment to test:
// testGeminiAPI();

export { testGeminiAPI };
