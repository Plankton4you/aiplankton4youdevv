import { useEffect } from 'react';

export default function SparkleEffect() {
  useEffect(() => {
    const createSparkle = (x: number, y: number) => {
      for (let i = 0; i < 6; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'fixed w-1 h-1 bg-metallic-gold rounded-full pointer-events-none z-40';
        sparkle.style.left = x + (Math.random() - 0.5) * 20 + 'px';
        sparkle.style.top = y + (Math.random() - 0.5) * 20 + 'px';
        sparkle.style.animation = 'sparkle 1s ease-out forwards';
        
        document.body.appendChild(sparkle);
        
        setTimeout(() => {
          if (sparkle.parentNode) {
            sparkle.parentNode.removeChild(sparkle);
          }
        }, 1000);
      }
    };

    const handleClick = (e: MouseEvent) => {
      createSparkle(e.clientX, e.clientY);
    };

    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return null;
}
