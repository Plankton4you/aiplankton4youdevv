import { useEffect, useRef } from 'react';

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const playAudio = async () => {
      if (audioRef.current) {
        try {
          // Set volume to a reasonable level
          audioRef.current.volume = 0.3;
          
          // Try to play the audio
          await audioRef.current.play();
        } catch (error) {
          console.log('Audio autoplay blocked by browser:', error);
          // Most browsers block autoplay, so we'll just set it up to play on first user interaction
          const handleFirstInteraction = async () => {
            if (audioRef.current) {
              try {
                await audioRef.current.play();
              } catch (err) {
                console.log('Failed to play audio on interaction:', err);
              }
            }
            // Remove listeners after first interaction
            document.removeEventListener('click', handleFirstInteraction);
            document.removeEventListener('keydown', handleFirstInteraction);
          };

          document.addEventListener('click', handleFirstInteraction);
          document.addEventListener('keydown', handleFirstInteraction);
        }
      }
    };

    playAudio();
  }, []);

  return (
    <audio
      ref={audioRef}
      loop
      preload="auto"
      style={{ display: 'none' }}
    >
      <source src="https://files.catbox.moe/ahkw21.mp3" type="audio/mpeg" />
    </audio>
  );
}
