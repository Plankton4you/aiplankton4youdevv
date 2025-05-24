import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import UploadModal from "@/components/modals/UploadModal";
import UpgradeModal from "@/components/modals/UpgradeModal";
import HistoryModal from "@/components/modals/HistoryModal";

export default function Home() {
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{url: string, name: string, type: string}[]>([]);
  const isMobile = useIsMobile();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handler ketika file berhasil diupload
  const handleFileUploaded = (fileUrl: string, fileName: string, fileType: string) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev, {url: fileUrl, name: fileName, type: fileType}];
      // Maksimal 10 file
      if (newFiles.length > 10) {
        return newFiles.slice(-10);
      }
      return newFiles;
    });
    setUploadModalOpen(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Metalik Super Mencolok */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-black"></div>
      
      {/* Efek Cahaya Metalik Mencolok */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-yellow-400/10 via-transparent to-cyan-400/10"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-yellow-400/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-radial from-cyan-400/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-radial from-purple-400/15 to-transparent rounded-full blur-2xl animate-pulse"></div>
      </div>
      
      {/* Grid Pattern Metalik */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `
          linear-gradient(rgba(255,215,0,0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,215,0,0.3) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }}></div>
      
      {/* Animated Lines */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-pulse"></div>
        <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-purple-400/50 to-transparent animate-pulse"></div>
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-yellow-400/50 to-transparent animate-pulse"></div>
      </div>
      
      <div className="relative z-10 flex h-screen">
        {/* Responsive Sidebar - use isOpen prop for mobile */}
        <Sidebar
          currentConversationId={currentConversationId}
          onNewChat={() => setCurrentConversationId(null)}
          onSelectConversation={setCurrentConversationId}
          onShowUpload={() => setUploadModalOpen(true)}
          onShowUpgrade={() => setUpgradeModalOpen(true)}
          onShowHistory={() => setHistoryModalOpen(true)}
          isOpen={isMobile ? sidebarOpen : true}
          onToggle={toggleSidebar}
        />
        
        {/* Full-width Chat Area */}
        <div className={`flex-1 flex flex-col ${isMobile ? 'w-full' : ''}`}>
          <ChatArea
            conversationId={currentConversationId}
            onConversationCreated={setCurrentConversationId}
            onShowUpload={() => setUploadModalOpen(true)}
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}
          />
        </div>
      </div>

      <UploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onFileUploaded={handleFileUploaded}
      />

      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
      />

      <HistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        onSelectConversation={(id) => {
          setCurrentConversationId(id);
          setHistoryModalOpen(false);
        }}
      />
    </div>
  );
}
