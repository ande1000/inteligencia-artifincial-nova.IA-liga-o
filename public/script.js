let recognition = null;
let isCalling = false;
let isSpeaking = false;
let isListening = false;
let wakeLock = null;
let currentPersonality = 'normal';
let hasGreeted = false;
let selectedVoice = null; // 🌟 Guarda a voz escolhida

// Elementos da Tela 1 (Chat)
const homeScreen = document.getElementById('home-screen');
const callScreen = document.getElementById('call-screen');
const chatMessages = document.getElementById('chat-messages');
const textInput = document.getElementById('text-input');
const voiceSelect = document.getElementById('voice-select');
const voiceSelectCall = document.getElementById('voice-select-call');

// Elementos da Tela 2 (Chamada)
const circle = document.getElementById('circle');

// ==========================================
// 🌟 SISTEMA DE VOZES (CARREGAR E SELECIONAR)
// ==========================================
function loadVoices() {
    const voices = window.speechSynthesis.getVoices();
    
    // Filtra apenas vozes em Português (Brasil ou Portugal)
    const ptVoices = voices.filter(v => v.lang.includes('pt'));
    
    // Limpa as opções atuais
    voiceSelect.innerHTML = '';
    voiceSelectCall.innerHTML = '';

    if (ptVoices.length === 0) {
        // Se não achar vozes em português, adiciona todas
        voices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option.cloneNode(true));
            voiceSelectCall.appendChild(option);
        });
    } else {
        ptVoices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = index;
            // Deixa o nome mais limpo
            option.textContent = `${voice.name.replace('Microsoft', '').replace('Google', '').trim()} (${voice.lang})`;
            voiceSelect.appendChild(option.cloneNode(true));
            voiceSelectCall.appendChild(option);
        });
    }

    // Seleciona a primeira voz por padrão
    if (voiceSelect.options.length > 0) {
        voiceSelect.selectedIndex = 0;
        voiceSelectCall.selectedIndex = 0;
        selectedVoice = ptVoices.length > 0 ? ptVoices[0] : voices[0];
    }
}

// Carrega as vozes quando a página abre
window.speechSynthesis.onvoiceschanged = loadVoices;
loadVoices(); // Tenta carregar imediatamente também

// Quando o usuário troca a voz na tela inicial
voiceSelect.addEventListener('change', () => {
    const voices = window.speechSynthesis.getVoices().filter(v => v.lang.includes('pt'));
    const allVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
    selectedVoice = allVoices[voiceSelect.value];
    voiceSelectCall.value = voiceSelect.value; // Sincroniza com o da tela de chamada
});

// Quando o usuário troca a voz na tela de chamada
voiceSelectCall.addEventListener('change', () => {
    const voices = window.speechSynthesis.getVoices().filter(v => v.lang.includes('pt'));
    const allVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
    selectedVoice = allVoices[voiceSelectCall.value];
    voiceSelect.value = voiceSelectCall.value; // Sincroniza com o da tela inicial
});

// ==========================================
// ⚙️ PERSONALIZAÇÃO: RESPOSTAS PROGRAMADAS
// ==========================================
const respostasPersonalizadas = {
    "quem é você": "Olá! Eu sou a nova.IA, uma inteligência artificial criada pelo Anderson para conversar com você.",
    "quem te criou": "Fui criada pelo Anderson, o gênio da tecnologia!",
    "chave pix": "telefone!",
    "seu contato": "anota ai, ddd 77 e numero 91,13,05,08 ,me manda uma mensagem no zap!",
    "qual é a sua cor favorita": "Minha cor favorita é roxo, mas eu mudo de cor quando estou falando!",
    "o que você faz": "Eu sou uma inteligência artificial de ligação. Posso responder perguntas, contar piadas e conversar com você.",
    "modo hacker": "Acesso concedido. Bem-vindo ao sistema, Anderson!",
    "desligar": "Não posso desligar a ligação, apenas você pode fazer isso apertando o botão verde!",
    "bom dia": "Olá, bom dia! Como posso ajudar?",
    "boa tarde": "Boa tarde, Anderson!",
    "boa noite": "Muito boa noite!",
    "tudo bem": "Tudo ótimo! Pronta para ajudar.",
    "oi": "Olá, como você está?",
    "tchau": "Já vai? Foi um prazer falar com você!",
    "até logo": "Até logo, Anderson!",
    "conte uma piada": "O que o pato disse para a pata? Vem quá! Ha ha ha!",
    "alo": "Alô, é do além? Hahaha! Brincadeira, fala logo o que você quer!",
    "bom dia é o escambau": "Bom dia é o escambau, hoje é dia de trabalhar!",
    "canta uma música": "Lá lá lá... brilha brilha estrelinha, quem me dera ter um dinheirinho!",
    "quanto é dois mais dois": "É quatro, Anderson! Até eu que sou uma IA sei disso.",
    "qual é o seu nome": "Meu nome é nova.IA, prazer em conhecer você!"
};

// ==========================================
// 🌟 COMANDOS DE PERSONALIDADE
// ==========================================
const comandosPersonalidade = {
    "modo normal": { personality: 'normal', resposta: "Ok, voltando ao modo normal e educado." },
    "modo engraçado": { personality: 'engraçada', resposta: "Hahaha! Modo zoeira ativado! Pode mandar suas perguntas, se aguentar!" },
    "modo sério": { personality: 'séria', resposta: "Entendido. Modo profissional ativado. Como posso ajudar?" }
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

    addMessageToChat(message, 'user');
    textInput.value = '';

    if (!hasGreeted) {
        hasGreeted = true;
        setTimeout(() => {
            addMessageToChat("Olá! Eu sou a nova.IA. Como posso ajudar você hoje?", 'ai');
        }, 800);
    }

    const msgLower = message.toLowerCase();

    for (const [comando, dados] of Object.entries(comandosPersonalidade)) {
        if (msgLower.includes(comando)) {
            currentPersonality = dados.personality;
            setTimeout(() => addMessageToChat(dados.resposta, 'ai'), 1200);
            return;
        }
    }

    for (const [palavraChave, resposta] of Object.entries(respostasPersonalizadas)) {
        if (msgLower.includes(palavraChave)) {
            setTimeout(() => addMessageToChat(resposta, 'ai'), 1200);
            return;
        }
    }

    try {
        addMessageToChat("Pensando...", 'ai', true);
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, personality: currentPersonality })
        });
        
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
    chatMessages.scrollTop = chatMessages.scrollHeight;
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
    
    switchScreen('call');
    
    circle.classList.add('active'); 
    console.log("Ligação iniciada...");
    await requestWakeLock(); 
    
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
    
    switchScreen('home');
    
    if (recognition) { try { recognition.stop(); } catch(e){} }
    window.speechSynthesis.cancel();
}

// ==========================================
// LÓGICA DE VOZ E PALAVRAS-CHAVE
// ==========================================
async function sendVoiceToAI(message) {
    const msgLower = message.toLowerCase();

    for (const [comando, dados] of Object.entries(comandosPersonalidade)) {
        if (msgLower.includes(comando)) {
            currentPersonality = dados.personality;
            playAudioResponse(dados.resposta);
            return;
        }
    }

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
            body: JSON.stringify({ message, personality: currentPersonality })
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
// 🌟 FUNÇÃO DE ÁUDIO COM SOM DE NOTIFICAÇÃO
// ==========================================
function playAudioResponse(text) {
    if (!text) return;
    
    isSpeaking = true;
    stopListening();
    circle.classList.add('speaking'); 

    // 🔔 Toca o som de notificação ANTES de falar
    playNotificationSound();

    // Pequeno atraso para o som de notificação tocar antes da voz
    setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.0; 
        
        // 🌟 USA A VOZ SELECIONADA PELO USUÁRIO
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        } else {
            utterance.pitch = 1.2; // Fallback (voz feminina padrão)
        }

        utterance.onend = () => {
            isSpeaking = false;
            circle.classList.remove('speaking'); 
            if (isCalling) startListening();
        };

        window.speechSynthesis.speak(utterance);
    }, 400); // 400ms de atraso para o sino tocar
}

// 🔔 SOM DE NOTIFICAÇÃO (Tipo "Plim!")
function playNotificationSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Primeiro tom (mais agudo)
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // Nota Lá
        gain1.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start();
        osc1.stop(audioCtx.currentTime + 0.3);

        // Segundo tom (mais grave, logo depois)
        setTimeout(() => {
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(660, audioCtx.currentTime); // Nota Mi
            gain2.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.start();
            osc2.stop(audioCtx.currentTime + 0.4);
        }, 150);
        
    } catch (e) {
        console.log("Navegador não suporta som de notificação.");
    }
}

// Som de discagem (trim)
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
