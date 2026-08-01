// High quality Female Voice Text-To-Speech (TTS) Engine Utility

export const speakFemaleVoice = (text: string, onEnd?: () => void): (() => void) => {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech Synthesis API is not supported in this browser.');
    if (onEnd) onEnd();
    return () => {};
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Strip markdown formatting symbols for natural speech
  const cleanText = text
    .replace(/\*\*/g, '')
    .replace(/#/g, '')
    .replace(/`/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/[-*•]/g, ' ')
    .trim();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.pitch = 1.05; // Slightly warmer female pitch
  utterance.rate = 0.95;  // Clear, natural medical speech rate

  const setFemaleVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    
    // Priority order for natural female voices across OS and browsers
    const femaleVoice = voices.find((v) => {
      const name = v.name.toLowerCase();
      const lang = v.lang.toLowerCase();
      return (
        lang.startsWith('en') &&
        (name.includes('jenny') ||
         name.includes('aria') ||
         name.includes('zira') ||
         name.includes('samantha') ||
         name.includes('victoria') ||
         name.includes('karen') ||
         name.includes('female') ||
         name.includes('google us english') ||
         name.includes('natural'))
      );
    }) || voices.find((v) => v.lang.startsWith('en'));

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
  };

  setFemaleVoice();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = setFemaleVoice;
  }

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);

  // Return a cancellation stop function
  return () => {
    window.speechSynthesis.cancel();
    if (onEnd) onEnd();
  };
};

export const stopSpeech = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
