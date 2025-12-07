import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = "gemini-2.5-flash";

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const PORT = 3000;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

app.post('/api/chat', async (req, res) => {
    const { conversation } = req.body;
    try {
        console.log('Received conversation:', conversation); // Log untuk debugging
        if(!Array.isArray(conversation)) throw new Error ('Messages must be an array!');

        const contents = conversation.map(({ role, text }) => ({
            role: role === 'bot' ? 'model' : role,  // Ganti 'bot' menjadi 'model' agar sesuai dengan API GenAI
            parts: [{ text }]
        }));
        console.log('Mapped contents:', contents); // Log untuk debugging

        const result = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents
        });
        console.log('Raw result:', JSON.stringify(result, null, 2)); // Log hasil mentah

        // Akses teks dari struktur respons yang sebenarnya
        console.log('Available keys in result:', Object.keys(result));

        let responseText;
        try {
            if (result.candidates && result.candidates.length > 0) {
                const candidate = result.candidates[0];
                if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                    const part = candidate.content.parts[0];
                    if (part.text) {
                        responseText = part.text;
                    } else {
                        throw new Error('Text property not found in response part');
                    }
                } else {
                    throw new Error('No parts found in candidate content');
                }
            } else {
                throw new Error('No candidates found in response');
            }
        } catch (textError) {
            console.error('Error accessing text from candidates:', textError);
            console.error('Full result structure:', JSON.stringify(result, null, 2));
            throw new Error(`Error accessing response text: ${textError.message}`);
        }

        console.log('Response text:', typeof responseText === 'string' ? responseText.substring(0, 100) + '...' : 'Not a string'); // Log sebagian teks
        res.status(200).json({ result: responseText });
    } catch (e) {
        console.error('Detailed error in /api/chat:', e); // Log error yang lebih detail
        console.error('Error stack:', e.stack); // Log stack trace
        res.status(500).json({ error: e.message });
    }
})