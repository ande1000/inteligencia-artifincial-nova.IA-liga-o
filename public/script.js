let recognition;
let isCalling = false;
let isSpeaking = false;
let isListening = false;

const circle = document.getElementById('circle');

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false; // Desligamos o contínuo para evitar o erro "already started"
    recognition.interimResults = false;

    recognition.onstart = () => { 
        isListening = true; 
        console.log("Microfone LIGADO");
    };
    
    recognition.onresult = async (event) => {
        const userMessage = event.results[0][0].transcript;
        if (!userMessage.trim()) return;
        
        console.log("Você disse:", userMessage);
        stopListening(); // Desliga o microfone imediatamente
        await sendToAI(userMessage);
    };

    recognition.onerror = (event) => {
        console.error("Erro no reconhecimento de voz:", event.error);
        isListening = false;
        if (event.error === 'not-allowed') endCall();
    };

    recognition.onend = () => {
        isListening = false;
        console.log("Microfone DESLIGADO");
        // Só religa se a ligação estiver ativa e a IA não estiver falando
        if (isCalling && !isSpeaking) {
            setTimeout(startListening, 800); 
        }
    };
} else {
    alert("Seu navegador não suporta reconhecimento de voz. Use o Google Chrome.");
}

function startListening() {
    if (!isListening && !isSpeaking && isCalling) {
        try { recognition.start(); } catch (e) { console.log("Aguardando microfone..."); }
    }
}

function stopListening() {
    if (isListening) {
        try { recognition.stop(); } catch (e) {}
        isListening = false;
    }
}

async function startCall() {
    if (isCalling) return;
    isCalling = true;
    circle.classList.add('active');
    console.log("Ligação iniciada...");
    playAudioResponse("Olá, eu sou a nova.IA. Como posso ajudar?");
}

function endCall() {
    isCalling = false;
    isSpeaking = false;
    isListening = false;
    circle.classList.remove('active');
    console.log("Ligação encerrada.");
    if (recognition) { try { recognition.stop(); } catch(e){} }
    window.speechSynthesis.cancel();
}

async function sendToAI(message) {
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        if (!response.ok) throw new Error(`Erro no servidor: ${response.status}`);
        
        const data = await response.json();
        if (data.text) {
            playAudioResponse(data.text);
        } else { 
            if (isCalling) startListening(); 
        }
    } catch (error) {
        console.error("Erro ao se comunicar com a IA:", error);
        playAudioResponse("Desculpe, tive um problema no servidor. Pode repetir?");
    }
}

function playAudioResponse(text) {
    isSpeaking = true;
    stopListening();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0; 
    
    utterance.onend = () => {
        isSpeaking = false;
        if (isCalling) startListening();
    };
    
    window.speechSynthesis.speak(utterance);
}
