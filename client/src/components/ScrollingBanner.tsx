export default function ScrollingBanner() {
  return (
    <div className="fixed top-0 left-0 w-full h-14 overflow-hidden z-50 relative">
      {/* Galaxy background with metallic effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900 via-blue-800 to-indigo-900 opacity-90"></div>
      
      {/* Enhanced galaxy effect with more stars */}
      <div className="absolute inset-0" style={{ 
        background: 'linear-gradient(125deg, rgba(0,0,0,0) 40%, rgba(83,0,128,0.4) 70%, rgba(0,0,0,0) 100%)', 
        backgroundSize: '200% 200%',
        animation: 'shimmer 4s linear infinite'
      }}></div>
      
      {/* Stars effect */}
      <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 2px), radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 1px)', backgroundSize: '50px 50px, 30px 30px', backgroundPosition: '0 0, 25px 25px' }}></div>
      
      {/* Glowing borders - enhanced */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      
      {/* Animated scrolling text with enhanced metallic galaxy effect */}
      <div className="animate-scroll h-full flex items-center whitespace-nowrap relative z-10">
        <span className="inline-block font-orbitron font-bold text-xl tracking-wider px-4 py-1" 
              style={{ 
                background: 'linear-gradient(90deg, #ff00cc, #3393ff, #9933ff, #00ffff, #ff00cc)',
                backgroundSize: '400% 100%',
                animation: 'galaxyFlow 12s linear infinite',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 8px rgba(255, 0, 255, 0.6), 0 0 12px rgba(0, 195, 255, 0.6)',
                letterSpacing: '1px'
              }}>
          PLANK.DEV • Advanced AI Solutions • Premium Features Available • File Analysis • Code Generation • Unlimited Support • 
        </span>
        <span className="inline-block font-orbitron font-bold text-xl tracking-wider px-4 py-1" 
              style={{ 
                background: 'linear-gradient(90deg, #ff00cc, #3393ff, #9933ff, #00ffff, #ff00cc)',
                backgroundSize: '400% 100%',
                animation: 'galaxyFlow 12s linear infinite',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 8px rgba(255, 0, 255, 0.6), 0 0 12px rgba(0, 195, 255, 0.6)',
                letterSpacing: '1px'
              }}>
          PLANK.DEV • Advanced AI Solutions • Premium Features Available • File Analysis • Code Generation • Unlimited Support • 
        </span>
      </div>
    </div>
  );
}
