// Text-to-speech utility for audio feedback
export function speakFeedback(message: string, type: 'correction' | 'encouragement' | 'warning' = 'correction') {
  // Check if speech synthesis is supported
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Create utterance
  const utterance = new SpeechSynthesisUtterance(message);
  
  // Configure based on feedback type
  switch (type) {
    case 'correction':
      utterance.pitch = 1.0;
      utterance.rate = 0.95; // Slightly slower for corrections
      utterance.volume = 0.9;
      break;
    case 'encouragement':
      utterance.pitch = 1.1; // Slightly higher pitch for positive feedback
      utterance.rate = 1.0;
      utterance.volume = 0.85;
      break;
    case 'warning':
      utterance.pitch = 0.9; // Slightly lower pitch for warnings
      utterance.rate = 0.9; // Slower for emphasis
      utterance.volume = 1.0;
      break;
  }

  // Speak the message
  window.speechSynthesis.speak(utterance);
}

// Optional: Function to stop all speech
export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
