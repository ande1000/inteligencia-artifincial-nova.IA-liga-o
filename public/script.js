let recognition;
let isCalling = false;
let isSpeaking = false; // Controla se a IA está falando no momento
const circle = document.getElementById('circle');

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true; // Tenta manter o microfone ligado
    recognition.interimResults = false; // Só envia quando você terminar de falar

    recognition.onresult = async (event) => {
        const last = event.results.length - 1;
        const userMessage = event.results[last][0].transcript;
        
        if (!userMessage.trim()) return;
        
        console.log("Você disse:", userMessage);
        recognition.stop(); // Para de ouvir para não captar o áudio da própria IA
        await sendToAI(userMessage);
    };

    recognition.onerror = (event) => {
        console.error("Erro no reconhecimento de voz:", event.error);
        // Se o usuário negou o microfone, encerra a ligação
        if (event.error === 'not-allowed') {
            endCall();
        }
    };

    recognition.onend = () => {
        // Se a ligação ainda está ativa e a IA NÃO está falando, religa o microfone
        if (isCalling && !isSpeaking) {
            try { recognition.start(); } catch (e) { console.log("Aguardando microfone..."); }
        }
    };
} else {
    alert("Seu navegador não suporta reconhecimento de voz. Use o Google Chrome.");
}

async function startCall() {
    if (isCalling) return;
    isCalling = true;
    circle.classList.add('active');
    console.log("Ligação iniciada...");
    
    // Saudação inicial
    playAudioResponse("Olá, eu sou a nova.IA. Como posso ajudar?");
}

function endCall() {
    isCalling = false;
    isSpeaking = false;
    circle.classList.remove('active');
    console.log("Ligação encerrada.");
    if (recognition) recognition.stop();
    window.speechSynthesis.cancel(); // Cancela qualquer fala pendente
}

async function sendToAI(message) {
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        
        if (data.text) {
            playAudioResponse(data.text);
        } else {
            // Se o servidor falhar, religa o microfone para tentar de novo
            if (isCalling) recognition.start();
        }
    } catch (error) {
        console.error("Erro ao se comunicar com a IA:", error);
        if (isCalling) recognition.start();
    }
}

function playAudioResponse(text) {
    isSpeaking = true;
    if (recognition) recognition.stop(); // Garante que o microfone está desligado enquanto fala
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0; 
    utterance.pitch = 1.0; 
    
    // Quando a IA terminar de falar, religa o microfone
    utterance.onend = () => {
        isSpeaking = false;
        if (isCalling) {
            try { recognition.start(); } catch(e){}
        }
    };
    
    window.speechSynthesis.speak(utterance);
}
