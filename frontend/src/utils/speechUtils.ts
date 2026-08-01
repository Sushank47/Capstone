// High quality Sweet Girl Voice Text-To-Speech (TTS) Engine Utility

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
  utterance.pitch = 1.15; // Sweet, warm female pitch
  utterance.rate = 0.92;  // Gentle, articulate medical speech rate

  const setFemaleVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    
    // Priority list for sweet, natural female voices across Mac, Windows, Chrome, Safari
    const sweetVoice = voices.find((v) => {
      const name = v.name.toLowerCase();
      const lang = v.lang.toLowerCase();
      return (
        lang.startsWith('en') &&
        (name.includes('jenny') ||
         name.includes('aria') ||
         name.includes('samantha') ||
         name.includes('zira') ||
         name.includes('victoria') ||
         name.includes('karen') ||
         name.includes('female') ||
         name.includes('google us english') ||
         name.includes('google uk english female'))
      );
    }) || voices.find((v) => v.lang.startsWith('en'));

    if (sweetVoice) {
      utterance.voice = sweetVoice;
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
