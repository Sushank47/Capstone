// High quality Smooth Siri-style Female Voice Text-To-Speech (TTS) Engine Utility

export const speakFemaleVoice = (text: string, onEnd?: () => void): (() => void) => {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech Synthesis API is not supported in this browser.');
    if (onEnd) onEnd();
    return () => {};
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Strip markdown formatting symbols for smooth natural speech
  const cleanText = text
    .replace(/\*\*/g, '')
    .replace(/#/g, '')
    .replace(/`/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/[-*•]/g, ' ')
    .trim();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.pitch = 1.0;  // Smooth natural Siri pitch
  utterance.rate = 0.95;  // Smooth, natural Siri cadence

  const setFemaleVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    
    // Priority order for smooth Apple Siri female voices & natural browser voices
    const siriVoice =
      voices.find((v) => {
        const name = v.name.toLowerCase();
        const lang = v.lang.toLowerCase();
        return lang.startsWith('en') && (name.includes('samantha') || name.includes('siri'));
      }) ||
      voices.find((v) => {
        const name = v.name.toLowerCase();
        const lang = v.lang.toLowerCase();
        return (
          lang.startsWith('en') &&
          (name.includes('victoria') ||
           name.includes('jenny') ||
           name.includes('aria') ||
           name.includes('karen') ||
           name.includes('zira') ||
           name.includes('female') ||
           name.includes('google us english'))
        );
      }) ||
      voices.find((v) => v.lang.startsWith('en'));

    if (siriVoice) {
      utterance.voice = siriVoice;
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
