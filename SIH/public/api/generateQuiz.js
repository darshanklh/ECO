// File: /api/generateQuiz.js
// This code runs on Vercel's server, NOT in the user's browser.

export default async function handler(request, response) {
  // First, check if the request is a POST request.
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  // ⚙️ Securely access the API key from Vercel's Environment Variables.
  // This 'process.env.GEMINI_API_KEY' variable is the one you set in the Vercel dashboard.
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    // If the key is missing on the server, send an error.
    return response.status(500).json({ error: 'Server configuration error: API key not found.' });
  }

  try {
    // Get the 'prompt' that your frontend (script.js) will send in the request body.
    const { prompt } = request.body;
    if (!prompt) {
      return response.status(400).json({ error: 'Bad Request: prompt is required.' });
    }

    // This is the URL for the actual Google Gemini API.
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;

    // 🚀 Make the call to the Gemini API from the secure server environment.
    const geminiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    // If the call to Google's API fails, pass the error back to your frontend.
    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error("Gemini API Error:", errorData);
      return response.status(geminiResponse.status).json({ error: 'Failed to get a response from the AI model.' });
    }

    // ✅ If successful, get the JSON result from Google's API...
    const geminiResult = await geminiResponse.json();
    const quizJsonText = geminiResult.candidates[0].content.parts[0].text;

    // ...and send the cleaned-up quiz data back to your frontend (script.js).
    return response.status(200).json(JSON.parse(quizJsonText));

  } catch (error) {
    console.error('Error in serverless function:', error);
    return response.status(500).json({ error: 'An internal server error occurred.' });
  }
}
