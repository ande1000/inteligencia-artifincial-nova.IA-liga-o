require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: "Você é a nova.IA, uma inteligência artificial criada por Anderson. Você está em uma ligação telefônica. Responda de forma natural, rápida, educada e concisa, como se estivesse conversando por voz. Não use emojis ou formatação markdown."
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const result = await model.generateContent(message);
        const responseText = result.response.text();
        
        // Agora só devolvemos o texto, o áudio será feito pelo navegador
        res.json({ text: responseText });
    } catch (error) {
        console.error('Erro:', error.message);
        res.status(500).json({ error: 'Erro ao processar a solicitação.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor da nova.IA rodando na porta ${PORT}`);
});