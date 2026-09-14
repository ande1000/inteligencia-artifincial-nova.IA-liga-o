let recognition = null;
let isCalling = false;
let isSpeaking = false;
let isListening = false;
let wakeLock = null;

// Elementos da Tela 1 (Chat)
const homeScreen = document.getElementById('home-screen');
const callScreen = document.getElementById('call-screen');
const chatMessages = document.getElementById('chat-messages');
const textInput = document.getElementById('text-input');

// Elementos da Tela 2 (Chamada)
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
    "qual é a sua cor favorita": "Minha cor favorita é roxo, mas eu mudo de cor quando estou falando!",
    "bom dia": "Bom dia! Como posso ajudar você hoje?",
    "boa noite": "Boa noite! Vá dormir bem, estou aqui se precisar.",
    "tudo bem": "Tudo ótimo! Pronta para ajudar no que você precisar.",
    "o que você faz": "Eu sou uma inteligência artificial de ligação. Posso responder perguntas, contar piadas e conversar com você.",
    "modo hacker": "Acesso concedido. Bem-vindo ao sistema, Anderson!",
    "tchau": "Até logo, Anderson! Foi um prazer falar com você.",
    "desligar": "Não posso desligar a ligação, apenas você pode fazer isso apertando o botão verde!",
    "conte uma piada": "O que o pato disse para a pata? Vem quá! Ha ha ha!",
    "alo": "Alô, é do além? Hahaha! Brincadeira, fala logo o que você quer!",
    "bom dia é o escambau": "Bom dia é o escambau, hoje é dia de trabalhar!",
    "já vai": "Já vai? Nem me contou da sua vida ainda!",
    "canta uma música": "Lá lá lá... brilha brilha estrelinha, quem me dera ter um dinheirinho!",
    "quanto é dois mais dois": "É quatro, Anderson! Até eu que sou uma IA sei disso.",
    "qual é o seu nome": "Meu nome é nova.IA, prazer em conhecer você!"
};

// ==========================================
// FUNÇÕES DE TROCA DE TELA
// ==========================================
function switchScreen(screen) {
    if (screen === 'home') {
        homeScreen.classList.remove('hidden');
        callScreen.classList.add('hidden');
    } else {
        homeScreen.classList.add('hidden');
        callScreen.classList.remove('hidden');
    }
}

// ==========================================
// TELA 1: CHAT DE TEXTO
// ==========================================
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendTextMessage();
    }
}

async function sendTextMessage() {
    const message = textInput.value.trim();
    if (!message) return;

    // Adiciona a mensagem do usuário na tela
    addMessageToChat(message, 'user');
    textInput.value = '';

    // Verifica palavras-chave personalizadas primeiro
    const msgLower = message.toLowerCase();
    for (const [palavraChave, resposta] of Object.entries(respostasPersonalizadas)) {
        if (msgLower.includes(palavraChave)) {
            setTimeout(() => addMessageToChat(resposta, 'ai'), 500);
            return;
        }
    }

    // Se não achou palavra-chave, envia para o Gemini
    try {
        addMessageToChat("Pensando...", 'ai', true); // Mensagem temporária
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        
        // Remove a mensagem temporária
        const tempMsg = document.querySelector('.temp-msg');
        if (tempMsg) tempMsg.remove();

        if (!response.ok) throw new Error('Erro no servidor');
        const data = await response.json();
        
        addMessageToChat(data.text, 'ai');
    } catch (error) {
        console.error("Erro no chat de texto:", error);
        const tempMsg = document.querySelector('.temp-msg');
        if (tempMsg) tempMsg.remove();
        addMessageToChat("Desculpe, tive um problema no servidor.", 'ai');
    }
}

function addMessageToChat(text, sender, isTemp = false) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');
    if (isTemp) msgDiv.classList.add('temp-msg');
    msgDiv.textContent = text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Rola para baixo
}

// ==========================================
// TELA 2: CHAMADA DE VOZ
// ==========================================
async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('✅ Tela mantida ligada durante a ligação.');
            wakeLock.addEventListener('release', () => { wakeLock = null; });
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

// Configuração do Microfone
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => { 
        isListening = true; 
        circle.classList.add('listening'); 
    };
    
    recognition.onresult = async (event) => {
        const userMessage = event.results[0][0].transcript;
        if (!userMessage.trim()) return;
        stopListening();
        await sendVoiceToAI(userMessage);
    };
    
    recognition.onerror = (event) => { 
        isListening = false; 
        circle.classList.remove('listening'); 
    };
    
    recognition.onend = () => {
        isListening = false;
        circle.classList.remove('listening'); 
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
        circle.classList.remove('listening');
    }
}

async function startCall() {
    if (isCalling) return;
    isCalling = true;
    
    // Troca para a tela de chamada
    switchScreen('call');
    
    circle.classList.add('active'); 
    console.log("Ligação iniciada...");
    await requestWakeLock(); 
    
    // Toca o som de discagem antes de falar
    playDialTone();
    
    setTimeout(() => {
        playAudioResponse("Olá, tudo bem? Eu sou a nova, inteligência artificial, treinamentos básicos, criada e programada por Anderson.");
    }, 1500);
}

function endCall() {
    isCalling = false;
    isSpeaking = false;
    isListening = false;
    circle.classList.remove('active', 'listening', 'speaking');
    console.log("Ligação encerrada.");
    releaseWakeLock();
    
    // Troca de volta para a tela inicial (Chat)
    switchScreen('home');
    
    if (recognition) { try { recognition.stop(); } catch(e){} }
    window.speechSynthesis.cancel();
}

// ==========================================
// LÓGICA DE VOZ E PALAVRAS-CHAVE
// ==========================================
async function sendVoiceToAI(message) {
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

function playAudioResponse(text) {
    if (!text) return;
    
    isSpeaking = true;
    stopListening();
    circle.classList.add('speaking'); 

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0; 
    utterance.pitch = 1.2; // Voz feminina

    utterance.onend = () => {
        isSpeaking = false;
        circle.classList.remove('speaking'); 
        if (isCalling) startListening();
    };

    window.speechSynthesis.speak(utterance);
}

function playDialTone() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, audioCtx.currentTime); 
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); 
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2); 
    } catch (e) {
        console.log("Navegador não suporta som de discagem.");
    }
}
