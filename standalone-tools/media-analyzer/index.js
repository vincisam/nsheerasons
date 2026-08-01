import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Temporarily store uploaded files on disk
const upload = multer({ dest: 'uploads/' }); 
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/analyze', upload.single('media'), async (req, res) => {
    try {
        const file = req.file;
        const prompt = req.body.prompt || "Describe this media in detail.";

        if (!file) {
            return res.status(400).json({ error: "No media file provided." });
        }

        // 1. Upload the file to Gemini
        console.log("Uploading to Gemini...");
        let uploadResult = await ai.files.upload({
            file: file.path,
            mimeType: file.mimetype,
        });

        // 2. Poll the API until the file is ready (Critical for video)
        console.log("Waiting for file processing...");
        let fileInfo = await ai.files.get({ name: uploadResult.name });
        
        while (fileInfo.state === 'PROCESSING') {
            process.stdout.write('.');
            await new Promise((resolve) => setTimeout(resolve, 2000));
            fileInfo = await ai.files.get({ name: uploadResult.name });
        }

        if (fileInfo.state === 'FAILED') {
            throw new Error("Gemini failed to process the media file.");
        }

        // 3. Generate content using the modern 3.6-flash model
        console.log("\nGenerating content...");
        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: [fileInfo, prompt]
        });

        // 4. Cleanup the local file
        fs.unlinkSync(file.path);

        res.json({ result: response.text });

    } catch (error) {
        console.error(error);
        // Ensure local file is cleaned up even on error
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));