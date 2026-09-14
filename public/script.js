let recognition;
let isCalling = false;
const circle = document.getElementById('circle');

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = async (event) => {
        const userMessage = event.results[0][0].transcript;
        console.log("Você disse:", userMessage);
        await sendToAI(userMessage);
    };

    recognition.onerror = (event) => console.error("Erro no reconhecimento de voz:", event.error);
    recognition.onend = () => { if (isCalling) recognition.start(); };
} else {
    alert("Seu navegador não suporta reconhecimento de voz. Use o Google Chrome.");
}

async function startCall() {
    if (isCalling) return;
    isCalling = true;
    circle.classList.add('active');
    
    // Saudação inicial usando a voz do navegador
    playAudioResponse("Olá, eu sou a nova.IA. Como posso ajudar?");
    
    if (recognition) recognition.start();
}

function endCall() {
    isCalling = false;
    circle.classList.remove('active');
    if (recognition) recognition.stop();
}

async function sendToAI(message) {
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        const data = await response.json();
        if (data.text) playAudioResponse(data.text);
    } catch (error) {
        console.error("Erro ao se comunicar com a IA:", error);
    }
}

// Função que usa a voz nativa do navegador (Google Chrome)
function playAudioResponse(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0; // Velocidade da fala
    utterance.pitch = 1.0; // Tom da voz
    window.speechSynthesis.speak(utterance);
}