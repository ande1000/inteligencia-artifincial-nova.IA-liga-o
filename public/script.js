let recognition = null;
let isCalling = false;
let isSpeaking = false;
let isListening = false;
let wakeLock = null;

const circle = document.getElementById('circle');

// ==========================================
// ⚙️ PERSONALIZAÇÃO: RESPOSTAS PROGRAMADAS
// ==========================================
const respostasPersonalizadas = {
    "quem é você": "Olá! Eu sou a nova.IA, uma inteligência artificial criada pelo Anderson para conversar com você.",
    "quem te criou": "Fui criada pelo Anderson, o gênio da tecnologia!",
    "chave pix": "telefone!",
    "seu contato": "anota ai, ddd 77 e numero 91,13,05,08 ,me manda uma mensagem no zap!",
    "sim": "ok anderson, mas alguma coisa!",
    "nova ia": "oi sou uma ia !",     
    "qual é a sua cor favorita": "Minha cor favorita é roxo, a cor do meu círculo brilhante!",
    "conte uma piada": "O que o pato disse para a pata? Vem quá! Ha ha ha!",
    "bom dia": "Bom dia! Como posso ajudar você hoje?",
    "boa noite": "Boa noite! Vá dormir bem, estou aqui se precisar.",
    "tudo bem": "Tudo ótimo! Pronta para ajudar no que você precisar.",
    "o que você faz": "Eu sou uma inteligência artificial de ligação. Posso responder perguntas, contar piadas e conversar com você.",
    "modo hacker": "Acesso concedido. Bem-vindo ao sistema, Anderson!",
    "tchau": "Até logo, Anderson! Foi um prazer falar com você.",
    "desligar": "Não posso desligar a ligação, apenas você pode fazer isso apertando o botão vermelho!"
};

// ==========================================
// FUNÇÕES PARA MANTER A TELA LIGADA (WAKE LOCK)
// ==========================================
async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('✅ Tela mantida ligada durante a ligação.');
            wakeLock.addEventListener('release', () => {
                wakeLock = null;
            });
        } catch (err) {
            console.log(`Erro ao manter tela ligada: ${err.message}`);
        }
    }
}

function releaseWakeLock() {
    if (wakeLock !== null) {
        wakeLock.release();
        wakeLock = null;
        console.log('💤 Tela pode apagar novamente.');
    }
}

document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible' && isCalling) {
        await requestWakeLock();
    }
});

// ==========================================
// CONFIGURAÇÃO DO MICROFONE
// ==========================================
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => { isListening = true; };
    
    recognition.onresult = async (event) => {
        const userMessage = event.results[0][0].transcript;
        if (!userMessage.trim()) return;
        stopListening();
        await sendToAI(userMessage);
    };
    
    recognition.onerror = (event) => { isListening = false; };
    recognition.onend = () => {
        isListening = false;
        if (isCalling && !isSpeaking) setTimeout(startListening, 800);
    };
} else {
    alert("Seu navegador não suporta reconhecimento de voz. Use o Google Chrome.");
}

function startListening() {
    if (recognition && !isListening && !isSpeaking && isCalling) {
        try { recognition.start(); } catch (e) { console.log("Aguardando..."); }
    }
}

function stopListening() {
    if (recognition && isListening) {
        try { recognition.stop(); } catch (e) {}
        isListening = false;
    }
}

// ==========================================
// FUNÇÕES PRINCIPAIS DA LIGAÇÃO
// ==========================================
async function startCall() {
    if (isCalling) return;
    isCalling = true;
    circle.classList.add('active');
    console.log("Ligação iniciada...");
    await requestWakeLock(); 
    // 🌟 SUA SAUDAÇÃO PERSONALIZADA:
    playAudioResponse("Olá, tudo bem? Eu sou a nova, inteligência artificial, treinamentos básicos, criada e programada por Anderson.");
}

function endCall() {
    isCalling = false;
    isSpeaking = false;
    isListening = false;
    circle.classList.remove('active');
    console.log("Ligação encerrada.");
    releaseWakeLock();
    if (recognition) { try { recognition.stop(); } catch(e){} }
    window.speechSynthesis.cancel();
}

// ==========================================
// 🌟 AQUI ACONTECE A MÁGICA DAS PALAVRAS-CHAVE
// ==========================================
async function sendToAI(message) {
    const msgLower = message.toLowerCase();

    for (const [palavraChave, resposta] of Object.entries(respostasPersonalizadas)) {
        if (msgLower.includes(palavraChave)) {
            console.log(`🎯 Palavra-chave detectada: "${palavraChave}"`);
            playAudioResponse(resposta);
            return;
        }
    }

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        if (!response.ok) throw new Error(`Erro no servidor: ${response.status}`);
        const data = await response.json();
        if (data.text) playAudioResponse(data.text);
        else { if (isCalling) startListening(); }
    } catch (error) {
        console.error("Erro na IA:", error);
        playAudioResponse("Desculpe, tive um problema no servidor.");
    }
}

// ==========================================
// FUNÇÃO DE ÁUDIO (VOZ DO NAVEGADOR - SEM SERVIDOR)
// ==========================================
function playAudioResponse(text) {
    if (!text) return;
    
    isSpeaking = true;
    stopListening();

    // Usa a voz nativa do navegador (Google Chrome, Edge, etc.)
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0; 
    utterance.pitch = 1.0; 

    utterance.onend = () => {
        isSpeaking = false;
        if (isCalling) startListening();
    };

    window.speechSynthesis.speak(utterance);
}
