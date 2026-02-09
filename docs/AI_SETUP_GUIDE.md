# 🤖 AI API Setup Guide for RiCement

## 🎯 Current Implementation: Google Gemini API

Your RiCement app is now configured to use **Google Gemini API** with a generous free tier.

### 📊 **Free Tier Benefits:**
- **1,500 requests per day** (plenty for testing and moderate usage)
- **15 requests per minute** rate limit
- **Excellent quality** for construction/engineering questions
- **No credit card required** for free tier

---

## 🔧 **Setup Instructions:**

### Step 1: Get Your Free API Key
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key" 
4. Create a new project (if needed)
5. Copy your API key

### Step 2: Add API Key to Your App ✅ **COMPLETED**
~~Open `app/(tabs)/dashboard.tsx` and replace:~~
```typescript
// OLD (placeholder):
const API_KEY = 'YOUR_GEMINI_API_KEY';
```
~~With:~~
```typescript
// ✅ ALREADY UPDATED with your real key:
const API_KEY = 'AIzaSyATmW88NXhGI-h7coo2h70eKTEA5OSwmok';
```

**✅ Your API key is already configured and ready to use!**

### Step 3: Test the Integration
1. Run your app: `npx expo start`
2. Open the dashboard
3. Tap the AI chat bubble (bottom right)
4. Send a message like "What's the optimal RHA percentage?"
5. You should get intelligent, contextual responses!

---

## 🔄 **Fallback System:**

Your app includes a smart fallback system:
- **Primary**: Gemini API (when API key is configured)
- **Fallback**: Local responses (if API fails or no key)
- **No crashes**: Always provides a response

---

## 💰 **Alternative Free Options:**

### If you need more free requests:

#### 1. **Hugging Face** (30,000 chars/month free)
```typescript
// Replace the Gemini API call with:
const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
  headers: { Authorization: 'Bearer YOUR_HF_TOKEN' },
  method: 'POST',
  body: JSON.stringify({ inputs: userMessage })
});
```

#### 2. **Ollama** (Unlimited, runs locally)
```bash
# Install Ollama locally
curl -fsSL https://ollama.ai/install.sh | sh
ollama run llama3.1
```

#### 3. **OpenAI Free Trial** ($5 credit)
```typescript
// Replace with OpenAI API call
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: { 
    'Authorization': 'Bearer YOUR_OPENAI_KEY',
    'Content-Type': 'application/json'
  },
  method: 'POST',
  body: JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: userMessage }]
  })
});
```

---

## 🎯 **Current Features:**

✅ **Context-Aware**: AI knows your current material levels  
✅ **RiCement Expert**: Trained on construction/RHA knowledge  
✅ **Real-Time Data**: Includes live system status in responses  
✅ **Professional UI**: Floating chat bubble with typing indicators  
✅ **Fallback System**: Never fails, always responds  

---

## 🚀 **Usage Tips:**

- **Ask specific questions**: "How to improve RHA block strength?"
- **Check material status**: "Should I restock gravel?"
- **Get recommendations**: "Best curing temperature for RHA blocks?"
- **Troubleshooting**: "Why are my blocks cracking?"

---

## 📝 **API Usage Monitoring:**

Google AI Studio provides a dashboard to monitor:
- Daily request count
- Rate limit status
- API usage statistics
- Error logs

Visit [Google AI Studio](https://aistudio.google.com/) to check your usage.

---

## 🔧 **Troubleshooting:**

### If you get "Gemini API Error: Invalid API Response":

1. **Check API Key Permissions:**
   - Visit [Google AI Studio](https://aistudio.google.com/)
   - Make sure your API key has "Generative Language API" enabled
   - Try regenerating the API key if needed

2. **Test API Directly:**
   ```bash
   # Run the test script
   node test-gemini-api.js
   ```

3. **Check Network/CORS:**
   - API calls work in Expo/React Native (no CORS issues)
   - Make sure your internet connection is stable

4. **Fallback System:**
   - If API fails, the app automatically uses local responses
   - Look for console logs to see the exact error

### **Common Issues:**
- ❌ **Invalid API key**: Double-check the key in dashboard.tsx
- ❌ **Wrong model name**: Use `gemini-2.0-flash` (now fixed!)
- ❌ **Response parsing**: Fixed API response structure handling
- ❌ **Token limits**: Optimized for better responses  
- ❌ **Quota exceeded**: You've hit the 1,500 daily request limit
- ❌ **Network error**: Check internet connection
- ✅ **RESOLVED**: API is now working with gemini-2.0-flash model and improved parsing!

---

## ⚡ **Quick Start:**
1. ✅ Get API key from Google AI Studio
2. ✅ Replace `YOUR_GEMINI_API_KEY` in dashboard.tsx  
3. ✅ Test with: "Hello, what's my material status?"
4. 🎉 Enjoy intelligent RiCement assistance!

**Note:** If you get API errors, the app will still work using local responses.