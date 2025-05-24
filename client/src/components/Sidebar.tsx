import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import DraggableMenuButton from "@/components/DraggableMenuButton";
import { 
  MessageSquare, 
  History, 
  Upload, 
  Camera, 
  Crown,
  LogOut
} from "lucide-react";

interface SidebarProps {
  currentConversationId: number | null;
  onNewChat: () => void;
  onSelectConversation: (id: number) => void;
  onShowUpload: () => void;
  onShowUpgrade: () => void;
  onShowHistory: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({
  currentConversationId,
  onNewChat,
  onSelectConversation,
  onShowUpload,
  onShowUpgrade,
  onShowHistory,
  isOpen = true,
  onToggle
}: SidebarProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const { data: usage } = useQuery({
    queryKey: ["/api/usage"],
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleCamera = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        // Create a simple camera modal (in a real app, this would be more sophisticated)
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.style.maxWidth = '100%';
        video.style.maxHeight = '400px';
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50';
        modal.appendChild(video);
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.className = 'absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded';
        closeBtn.onclick = () => {
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(modal);
        };
        modal.appendChild(closeBtn);
        
        document.body.appendChild(modal);
      })
      .catch(err => {
        console.error('Camera access denied:', err);
        alert('Camera access is required for this feature. Please enable camera permissions.');
      });
  };

  // Close sidebar after navigation on mobile
  const handleNavigation = (callback: () => void) => {
    return () => {
      callback();
      if (isMobile && onToggle) {
        onToggle();
      }
    };
  };

  // Fixed class for mobile sidebar with increased top padding
  const sidebarClasses = isMobile
    ? `fixed top-0 left-0 bottom-0 z-40 w-80 bg-gradient-to-b from-metallic-navy to-metallic-blue border-r border-metallic-gold/30 flex flex-col transition-transform duration-300 pt-16 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`
    : "w-80 bg-gradient-to-b from-metallic-navy to-metallic-blue border-r border-metallic-gold/30 flex flex-col pt-14";

  return (
    <>
      {/* Overlay for mobile when sidebar is open */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 transition-opacity"
          onClick={onToggle}
        />
      )}

      {/* Draggable menu button for mobile */}
      {isMobile && (
        <DraggableMenuButton isOpen={isOpen} onToggle={onToggle} />
      )}

      <div className={sidebarClasses}>
        {/* Logo Section - with additional top margin for spacing */}
        <div className="pb-4 border-b border-metallic-gold/30">
          <div className="flex items-center space-x-3 px-6">
            <img 
              src="https://files.catbox.moe/98ma2n.jpg" 
              alt="AI Plank Logo" 
              className="w-12 h-12 rounded-full object-cover border-2 border-metallic-gold"
            />
            <div>
              <h1 className="font-orbitron font-bold text-xl text-metallic-gold">AI PLANK.DEV</h1>
              <p className="text-metallic-silver text-sm">Advanced AI Assistant</p>
            </div>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-b border-metallic-gold/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-metallic-gold to-metallic-silver rounded-full flex items-center justify-center">
              <span className="text-metallic-navy font-bold text-sm">
                {user?.firstName?.[0] || user?.email?.[0] || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">
                {user?.firstName || user?.email || 'User'}
              </p>
              <p className="text-sm text-metallic-silver">
                {user?.isPremium ? 'Pro Plan' : `Free Plan (${usage?.usageCount || 0}/${usage?.limit || 10} uses)`}
              </p>
            </div>
          </div>
          
          {!user?.isPremium && (
            <Button
              onClick={handleNavigation(onShowUpgrade)}
              className="w-full mt-3 bg-gradient-to-r from-metallic-gold to-yellow-500 text-metallic-navy hover:from-yellow-500 hover:to-metallic-gold font-bold"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Pro - Rp 25.000
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <Button
              onClick={handleNavigation(onNewChat)}
              variant="ghost"
              className="w-full justify-start bg-metallic-accent/50 hover:bg-metallic-accent/70 text-white"
            >
              <MessageSquare className="w-4 h-4 mr-3 text-metallic-gold" />
              New Chat
            </Button>
            
            <Button
              onClick={handleNavigation(onShowHistory)}
              variant="ghost"
              className="w-full justify-start hover:bg-metallic-accent/30 text-white"
            >
              <History className="w-4 h-4 mr-3 text-metallic-silver" />
              Chat History
            </Button>
            
            <Button
              onClick={handleNavigation(onShowUpload)}
              variant="ghost"
              className="w-full justify-start hover:bg-metallic-accent/30 text-white"
            >
              <Upload className="w-4 h-4 mr-3 text-metallic-silver" />
              Upload Files
            </Button>
            
            <Button
              onClick={handleCamera}
              variant="ghost"
              className="w-full justify-start hover:bg-metallic-accent/30 text-white"
            >
              <Camera className="w-4 h-4 mr-3 text-metallic-silver" />
              Camera
            </Button>
          </div>
        </nav>

        {/* Contact Support */}
        <div className="p-4 border-t border-metallic-gold/30">
          <h3 className="text-metallic-gold font-bold mb-3">Contact Support</h3>
          <div className="flex space-x-3">
            <a
              href="https://wa.me/628881382817"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
            >
              <i className="fab fa-whatsapp text-white text-xl"></i>
            </a>
            <a
              href="https://wa.me/6283824299082"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
            >
              <i className="fab fa-whatsapp text-white text-xl"></i>
            </a>
            <a
              href="https://whatsapp.com/channel/0029Vay9jnG65yDFJDN6tG1j"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
            >
              <i className="fas fa-broadcast-tower text-white text-xl"></i>
            </a>
            <a
              href="https://www.instagram.com/plankton4you.dev?igsh=OHlhcWo5YnZiNTgz"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
            >
              <i className="fab fa-instagram text-white text-xl"></i>
            </a>
          </div>
          
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full mt-4 text-metallic-silver hover:text-white hover:bg-metallic-accent/30"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </>
  );
}
