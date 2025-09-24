require('dotenv').config();
const express = require('express');
const path = require('path'); // Import the 'path' module
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 3001; // We'll keep it on 3001

// --- NEW: Serve static files from the 'public' folder ---
// This tells Express to serve your index.html, script.js, and styles.css
app.use(express.static(path.join(__dirname, 'public')));

// Middleware for parsing JSON (image data)
app.use(express.json({ limit: '10mb' }));

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// API Endpoint for verification (this stays the same)
app.post('/verify-plant-photo', async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ error: 'No image data provided.' });
        }
        console.log("Received image, sending to Gemini for verification...");

        const prompt = "Analyze this image. Does it clearly show a person planting a small tree, sapling, or plant in the ground or in a pot? Answer with only a single word: 'yes' or 'no'.";
        const base64ImageData = image.split(',')[1];
        const imagePart = {
            inlineData: { data: base64ImageData, mimeType: 'image/jpeg' }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = await result.response.text();
        console.log("Gemini response:", responseText);

        if (responseText.toLowerCase().includes('yes')) {
            res.json({ verified: true });
        } else {
            res.json({ verified: false });
        }
    } catch (error) {
        console.error("Error during AI verification:", error);
        res.status(500).json({ error: 'Failed to verify image with AI.' });
    }
});

app.listen(port, () => {
    console.log(`EcoQuest App and AI server listening on http://localhost:${port}`);
});