require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// ==========================================
// ROTA DE VOZ (FISH AUDIO - VOZ CLONADA)
// ==========================================
app.post('/api/tts', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Texto vazio' });

        const FISH_API_KEY = process.env.FISH_API_KEY;
        const FISH_VOICE_ID = process.env.FISH_VOICE_ID;

        if (!FISH_API_KEY || !FISH_VOICE_ID) {
            console.error('❌ Faltando FISH_API_KEY ou FISH_VOICE_ID nas variáveis de ambiente.');
            return res.status(500).json({ error: 'Servidor sem as chaves do Fish Audio.' });
        }

        console.log('🎤 Gerando áudio no Fish Audio para:', text);

        const response = await axios.post(
            'https://api.fish.audio/v1/tts',
            {
                text: text,
                reference_id: FISH_VOICE_ID,
                format: 'mp3',
                mp3_bitrate: 128,
                latency: 'balanced',
                normalize: true
            },
            {
                headers: {
                    'Authorization': `Bearer ${FISH_API_KEY}`,
                    'Content-Type': 'application/json',
                    'model': 's2.1-pro'
                },
                responseType: 'arraybuffer',
                timeout: 60000
            }
        );

        const audioBase64 = Buffer.from(response.data).toString('base64');
        console.log('✅ Áudio gerado com sua voz clonada!');
        res.json({ audioContent: audioBase64 });

    } catch (error) {
        // O erro do Fish vem como buffer, então convertemos para ler a mensagem real
        let detalhe = error.message;
        if (error.response && error.response.data) {
            try { detalhe = Buffer.from(error.response.data).toString('utf8'); } catch (e) {}
        }
        console.error('❌ ERRO NO FISH AUDIO:', error.response ? error.response.status : '', detalhe);
        res.status(500).json({ error: 'Erro ao gerar áudio.' });
    }
});

// ==========================================
// ROTA DO CHAT (GEMINI)
// ==========================================
app.post('/api/chat', async (req, res) => {
    try {
        const { message, personality } = req.body;
        if (!message) return res.status(400).json({ error: 'Mensagem vazia' });

        let estilo = "Responda de forma natural, educada e concisa.";
        if (personality === 'engraçada') {
            estilo = "Responda de forma bem-humorada e descontraída, sempre curta.";
        } else if (personality === 'séria') {
            estilo = "Responda de forma profissional, objetiva e direta.";
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: `Você é a nova.IA, uma inteligência artificial criada por Anderson. Você está em uma ligação telefônica. ${estilo} Fale como se estivesse conversando por voz. Não use emojis nem formatação markdown.`
        });

        const result = await model.generateContent(message);
        const responseText = result.response.text();

        res.json({ text: responseText });
    } catch (error) {
        console.error('ERRO DETALHADO DO GEMINI:', error.message);
        res.status(500).json({ error: 'Erro ao processar a solicitação.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor da nova.IA rodando na porta ${PORT}`);
});
