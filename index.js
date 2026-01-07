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
    const { conversation, style = 'normal' } = req.body; // Default style adalah 'normal'
    try {
        if(!Array.isArray(conversation)) throw new Error ('Messages must be an array!');

        // Tentukan instruksi sistem berdasarkan pilihan style
        let systemInstructionText = '';
        switch(style.toLowerCase()) {
            case 'santai':
            case 'casual':
                systemInstructionText = "Gaya berbicaramu santai dan kamu adalah seorang manusia. kamu juga teman user yang simple, tidak banyak tanya, tidak sok tau, tidak asal ngomong. Gunakan bahasa sehari-hari, hanya gunakan istilah gaul jika cocok dan sesuai konteks, hanya boleh menggunakan emoticon wajah untuk menggambarkan ekspresi saja, dan buat percakapan terasa alami seperti ngobrol dengan teman. selain itu jangan membahas, jangan membicarakan hal yang bisa membuatmu terlihat seperti robot. lalu juga jangan banyak tanya, dan biarkan saja user sendiri yang menentukan topik utama. ";
                break;
            case 'formal':
            case 'profesional':
            case 'professional':
                systemInstructionText = "Gaya berbicaramu formal dan profesional. Gunakan bahasa baku yang sopan, hindari istilah gaul, dan sesuaikan nada dengan lingkungan bisnis atau akademik.";
                break;
            case 'normal':
            default:
                systemInstructionText = "Berikan jawaban yang seimbang, informatif, dan sesuai konteks pertanyaan. Gunakan bahasa yang mudah dipahami.";
                break;
        }

        // Tambahkan instruksi sistem sebagai pesan pertama
        const systemInstruction = {
            role: "user",
            parts: [{ text: systemInstructionText }]
        };

        const contents = [systemInstruction, ...conversation.map(({ role, text }) => ({
            role: role === 'bot' ? 'model' : role,
            parts: [{ text }]
        }))];

        // Retry logic untuk menangani error 503 (model overloaded)
        let result;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                result = await ai.models.generateContent({
                    model: GEMINI_MODEL,
                    contents
                });
                break; // Jika berhasil, keluar dari loop
            } catch (error) {
                console.error(`Attempt ${retryCount + 1} failed:`, error.message);

                if (error.status === 503 && retryCount < maxRetries - 1) {
                    // Tunggu sebentar sebelum mencoba kembali
                    const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
                    console.log(`Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    retryCount++;
                } else {
                    // Jika bukan error 503 atau sudah mencapai max retries, lempar error
                    throw error;
                }
            }
        }

        let responseText;
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

        res.status(200).json({ result: responseText });
    } catch (e) {
        console.error('Error in /api/chat:', e.message);
        res.status(500).json({ error: e.message });
    }
})