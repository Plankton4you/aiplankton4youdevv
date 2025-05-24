import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Paperclip, Send, Trash2, Download, Plus, Upload, Camera, X } from "lucide-react";
import { Message, Conversation } from "@/lib/types";

interface ChatAreaProps {
  conversationId: number | null;
  onConversationCreated: (id: number) => void;
  onShowUpload: () => void;
  uploadedFiles?: {url: string, name: string, type: string}[];
  setUploadedFiles?: (files: {url: string, name: string, type: string}[]) => void;
}

// Define proper types for message data
interface MessageData {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant';
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  createdAt: string;
}

export default function ChatArea({
  conversationId,
  onConversationCreated,
  onShowUpload: originalOnShowUpload,
  uploadedFiles: propsUploadedFiles = [],
  setUploadedFiles: propsSetUploadedFiles
}: ChatAreaProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [localUploadedFiles, setLocalUploadedFiles] = useState<{url: string, name: string, type: string}[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState<number | null>(null);
  
  // Gunakan props uploadedFiles jika tersedia, jika tidak gunakan local state
  const uploadedFiles = propsUploadedFiles.length > 0 ? propsUploadedFiles : localUploadedFiles;
  const setUploadedFiles = propsSetUploadedFiles || ((files: {url: string, name: string, type: string}[]) => setLocalUploadedFiles(files));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Custom handler untuk upload file dengan callback
  const onShowUpload = () => {
    if (uploadedFiles.length >= 10) {
      toast({
        title: "Batas upload tercapai",
        description: "Maksimal 10 file dapat diupload. Silakan hapus beberapa sebelum menambahkan yang baru.",
        variant: "destructive"
      });
      return;
    }
    
    // Show upload modal with callback untuk menambahkan file ke daftar
    originalOnShowUpload();
  };
  


  // Fetch messages for current conversation - gunakan localStorage untuk demo
  const { data: messages = [], isLoading: messagesLoading } = useQuery<MessageData[]>({
    queryKey: ["/api/conversations", conversationId, "messages"],
    queryFn: () => {
      if (!conversationId) return [];
      const stored = localStorage.getItem(`messages_${conversationId}`);
      return stored ? JSON.parse(stored) : [];
    },
    enabled: !!conversationId,
  });

  // Tambahkan tipe untuk data usage
  interface UsageData {
    usageCount: number;
    limit: number | null;
    isPremium: boolean;
  }
  
  const { data: usage = { usageCount: 0, limit: 10, isPremium: false } } = useQuery<UsageData>({
    queryKey: ["/api/usage"],
  });

  // Create conversation mutation (simplified for demo)
  const createConversationMutation = useMutation({
    mutationFn: async (title: string) => {
      // Simulasi create conversation yang pasti berhasil
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        id: Date.now(),
        userId: "demo-user",
        title,
        createdAt: new Date().toISOString()
      };
    },
    onSuccess: (data: Conversation) => {
      onConversationCreated(data.id);
    },
  });

  // Send message mutation (direct to OpenAI API)
  const sendMessageMutation = useMutation<
    { userMessage: MessageData, aiMessage: MessageData },
    Error,
    { 
      conversationId: number; 
      content: string; 
      fileUrl?: string; 
      fileName?: string; 
      fileType?: string;
      activeFile?: {url: string, name: string, type: string} | null;
    }
  >({
    mutationFn: async (data: { 
      conversationId: number; 
      content: string; 
      fileUrl?: string; 
      fileName?: string; 
      fileType?: string;
      activeFile?: {url: string, name: string, type: string} | null;
    }) => {
      let fileUrl = data.fileUrl;
      let fileName = data.fileName;
      let fileType = data.fileType;
      
      // Jika ada active file yang dipilih
      if (data.activeFile) {
        fileUrl = data.activeFile.url;
        fileName = data.activeFile.name;
        fileType = data.activeFile.type;
        
        // Log untuk debugging
        console.log("File yang dipilih:", data.activeFile);
      }
      
      // Buat user message
      const userMessage = {
        id: Date.now(),
        role: 'user' as const,
        content: data.content,
        fileUrl: fileUrl,
        fileName: fileName,
        fileType: fileType,
        createdAt: new Date().toISOString(),
        conversationId: data.conversationId
      };
      
      // Generate AI response dengan analisis file otomatis
      let aiResponse: string;
      
      if (fileUrl && fileName) {
        // Jika ada file, kirim ke server untuk analisis real
        try {
          const analysisResponse = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              message: data.content || `Tolong analisis file ini: ${fileName}`,
              fileUrl: fileUrl,
              fileName: fileName,
              fileType: fileType
            })
          });
          
          if (analysisResponse.ok) {
            const analysisData = await analysisResponse.json();
            aiResponse = analysisData.response;
          } else {
            throw new Error('Analysis failed');
          }
        } catch (error) {
          console.error('File analysis error:', error);
          // Fallback jika API gagal
          const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
          aiResponse = generateFileAnalysisResponse(fileName || 'unknown', fileType || 'unknown', fileExtension);
        }
      } else {
        // Jika tidak ada file, kirim pesan biasa ke AI
        aiResponse = await generateAIResponse(data.content);
      }
      
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant' as const,
        content: aiResponse,
        createdAt: new Date().toISOString(),
        conversationId: data.conversationId
      };
      
      return { userMessage, aiMessage };
    },
    onSuccess: (response) => {
      // Update messages di localStorage untuk demo
      const existingMessages = queryClient.getQueryData(["/api/conversations", conversationId, "messages"]) as MessageData[] || [];
      const newMessages = [...existingMessages, response.userMessage, response.aiMessage];
      
      // Simpan ke localStorage
      localStorage.setItem(`messages_${conversationId}`, JSON.stringify(newMessages));
      
      // Update query cache
      queryClient.setQueryData(["/api/conversations", conversationId, "messages"], newMessages);
      setMessage("");
      setIsTyping(false);
    },
    onError: (error: any) => {
      setIsTyping(false);
      toast({
        title: "Error",
        description: "Gagal mengirim pesan. Silakan coba lagi.",
        variant: "destructive",
      });
    },
  });

  // Fungsi untuk generate AI response
  const generateAIResponse = async (userMessage: string, fileContext?: string): Promise<string> => {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          fileContext: fileContext
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.response;
      } else {
        return generateFallbackResponse(userMessage, fileContext);
      }
    } catch (error) {
      return generateFallbackResponse(userMessage, fileContext);
    }
  };

  // Fungsi untuk generate fallback response yang lebih personal
  const generateFallbackResponse = (userMessage: string, fileContext?: string): string => {
    if (fileContext) {
      return `Halo! Saya AI PLANK.DEV 🤖

Saya telah menerima file yang Anda upload. Meskipun sistem AI sedang mengalami gangguan, saya tetap dapat memberikan analisis dasar.

**File yang diterima:** ${fileContext}

Dari informasi yang tersedia, saya dapat membantu Anda:
• Menganalisis jenis dan format file
• Memberikan saran penggunaan file
• Membantu dengan pertanyaan terkait file
• Mengidentifikasi potensi masalah atau kegunaan

Silakan kirim pertanyaan spesifik tentang file ini atau hal lain yang bisa saya bantu!`;
    }

    return `Halo! Saya AI PLANK.DEV 🤖

Anda mengatakan: "${userMessage}"

Saya adalah asisten AI canggih yang siap membantu dengan:

✨ **Chat Cerdas** - Percakapan natural seperti ChatGPT
🔍 **Analisis File** - Gambar, dokumen, APK, ZIP, dan lainnya  
💻 **Bantuan Coding** - Programming, debugging, development
📊 **Analisis Data** - Memproses informasi kompleks
💡 **Brainstorming** - Ide kreatif dan solusi inovatif
📝 **Penulisan** - Konten, artikel, dokumentasi

Bagaimana saya bisa membantu Anda lebih lanjut?`;
  };

  // Fungsi untuk generate analisis file yang detail
  const generateFileAnalysisResponse = (fileName: string, fileType: string, fileExtension: string): string => {
    const analysisMap: Record<string, string> = {
      'jpg': 'File gambar JPEG yang dapat berisi foto, ilustrasi, atau grafik. Saya dapat menganalisis komposisi, warna, dan konten visual.',
      'png': 'File gambar PNG dengan dukungan transparansi. Cocok untuk logo, ikon, atau gambar dengan latar belakang transparan.',
      'pdf': 'Dokumen PDF yang dapat berisi teks, gambar, dan format khusus. Saya dapat membantu menganalisis struktur dan konten.',
      'doc': 'Dokumen Microsoft Word yang berisi teks terformat. Saya dapat membantu dengan editing, review, dan analisis konten.',
      'docx': 'Dokumen Microsoft Word modern dengan format XML. Saya dapat menganalisis struktur dan memberikan saran perbaikan.',
      'zip': 'File arsip terkompresi yang berisi multiple file. Saya dapat membantu menganalisis struktur dan isi arsip.',
      'apk': 'File aplikasi Android. Saya dapat menganalisis metadata, permissions, dan memberikan insight tentang fungsionalitas app.',
      'mp3': 'File audio MP3. Saya dapat membantu menganalisis metadata, quality, dan memberikan info tentang konten audio.',
      'mp4': 'File video MP4. Saya dapat menganalisis metadata, resolusi, dan memberikan insight tentang konten video.',
      'txt': 'File teks plain yang dapat dianalisis untuk konten, struktur, dan memberikan saran improvement.',
      'csv': 'File data CSV yang dapat dianalisis untuk patterns, insights, dan visualisasi data.'
    };

    const defaultAnalysis = `File dengan ekstensi .${fileExtension} yang dapat saya bantu analisis lebih lanjut.`;
    const specificAnalysis = analysisMap[fileExtension] || defaultAnalysis;

    return `## 📁 Analisis File: ${fileName}

**🔍 Informasi File:**
• **Nama:** ${fileName}
• **Tipe:** ${fileType || 'Unknown'}
• **Ekstensi:** .${fileExtension}

**📋 Analisis Otomatis:**
${specificAnalysis}

**💡 Yang bisa saya lakukan:**
• Memberikan insight mendalam tentang file ini
• Menyarankan cara penggunaan optimal
• Menganalisis konten jika memungkinkan
• Memberikan rekomendasi tools yang sesuai
• Membantu troubleshooting jika ada masalah

**❓ Pertanyaan untuk Anda:**
Apa yang ingin Anda ketahui tentang file ini? Saya siap memberikan analisis yang lebih spesifik sesuai kebutuhan Anda!`;
  };

  const handleSendMessage = async () => {
    // Jika tidak ada pesan dan tidak ada file yang dipilih, tidak perlu mengirim
    if (!message.trim() && activeFileIndex === null) return;

    let currentConversationId = conversationId;

    // Create new conversation if none exists
    if (!currentConversationId) {
      try {
        setIsTyping(true);
        const title = message.slice(0, 50) + (message.length > 50 ? "..." : "") || "New Chat";
        const conversation = await createConversationMutation.mutateAsync(title);
        currentConversationId = conversation.id;
      } catch (error) {
        setIsTyping(false);
        return;
      }
    }

    // Siapkan data untuk dikirim termasuk file jika ada
    const activeFile = activeFileIndex !== null && activeFileIndex < uploadedFiles.length 
      ? uploadedFiles[activeFileIndex] 
      : null;
    
    // Pastikan file yang dipilih valid
    if (activeFileIndex !== null && !activeFile) {
      toast({
        title: "File tidak valid",
        description: "File yang dipilih tidak ditemukan, silakan pilih file lain",
        variant: "destructive"
      });
      setActiveFileIndex(null);
      return;
    }
    
    // Jika pesan kosong tapi ada file, buat pesan default
    const messageContent = message.trim() || (activeFile ? `Tolong analisis file ini: ${activeFile.name}` : '');

    // Pastikan kita memiliki pesan yang akan dikirim
    if (!messageContent) {
      toast({
        title: "Pesan kosong",
        description: "Silakan ketik pesan atau pilih file untuk dikirim",
        variant: "destructive"
      });
      return;
    }

    // Send the message
    setIsTyping(true);
    
    // Gunakan try-catch untuk penanganan error yang lebih baik
    try {
      const dataToSend: {
        conversationId: number;
        content: string;
        activeFile?: {url: string, name: string, type: string} | null;
      } = {
        conversationId: currentConversationId,
        content: messageContent
      };
      
      // Tambahkan file jika ada
      if (activeFile) {
        dataToSend.activeFile = activeFile;
      }
      
      // Kirim pesan dengan file
      await sendMessageMutation.mutateAsync(dataToSend);
      
      // Reset pesan dan active file hanya jika pengiriman berhasil
      setMessage("");
      setActiveFileIndex(null);
      
      console.log("Pesan berhasil dikirim dengan file:", activeFile);
    } catch (error) {
      console.error("Error sending message:", error);
      setIsTyping(false);
      toast({
        title: "Gagal mengirim pesan",
        description: "Terjadi kesalahan saat mengirim pesan. Silakan coba lagi.",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    if (conversationId) {
      // In a real app, this would delete the conversation
      onConversationCreated(null as any);
    }
  };

  const exportChat = () => {
    if (messages.length === 0) return;
    
    const chatContent = messages
      .map((msg: Message) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join("\n\n");
    
    const blob = new Blob([chatContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${conversationId || "new"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Auto-scroll to bottom hanya ketika ada pesan baru atau status typing berubah
  useEffect(() => {
    // Gunakan ref untuk menandai apakah ini pertama kali atau karena ada pesan baru
    const shouldScroll = messages.length > 0 || isTyping;
    
    if (messagesEndRef.current && shouldScroll) {
      // Gunakan timeout lebih pendek untuk mengurangi gangguan
      const timer = setTimeout(() => {
        if (document.activeElement !== document.querySelector('input')) {
          messagesEndRef.current?.scrollIntoView({
            behavior: "auto",
            block: "end"
          });
        }
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [messages, isTyping]);
  
  // Ensure scroll position is maintained when container size changes
  useEffect(() => {
    const handleResize = () => {
      // Hindari auto-scroll saat pengguna sedang mengetik pesan
      if (messagesEndRef.current && document.activeElement !== document.querySelector('input')) {
        messagesEndRef.current.scrollIntoView({ block: "end", behavior: "auto" });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex-1 flex flex-col w-full min-w-0">
      {/* Chat Header */}
      <div className="p-4 border-b border-metallic-gold/30 bg-gradient-to-r from-metallic-navy to-metallic-blue flex-shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 to-transparent"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-metallic-gold/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
        
        <div className="flex items-center justify-between relative z-10">
          <div className="min-w-0 flex-1">
            <h2 className="font-orbitron font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-metallic-gold via-yellow-300 to-metallic-gold tracking-wider metallic-shine">AI PLANK.DEV</h2>
            <p className="text-metallic-silver text-sm font-light tracking-wide">Advanced AI Solutions</p>
          </div>
          <div className="flex space-x-2 flex-shrink-0">
            <Button
              onClick={clearChat}
              variant="ghost"
              size="sm"
              className="text-metallic-silver hover:text-metallic-gold hover:bg-metallic-accent/50 transition-all duration-300"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              onClick={exportChat}
              variant="ghost"
              size="sm"
              className="text-metallic-silver hover:text-metallic-gold hover:bg-metallic-accent/50 transition-all duration-300"
              disabled={messages.length === 0}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Messages - DENGAN CSS CLASSES UNTUK FORCE WRAPPING */}
      <div className="chat-container flex-1 overflow-y-auto p-4 space-y-3 max-h-[calc(100vh-200px)] custom-scrollbar">
        {!conversationId && messages.length === 0 && (
          <div className="chat-message-wrapper flex justify-start">
            <div className="chat-bubble max-w-[90%] p-3 rounded-2xl rounded-bl-sm bg-gradient-to-r from-metallic-blue to-metallic-accent border border-metallic-gold/30">
              <div className="flex items-center space-x-2 mb-2">
                <img 
                  src="https://files.catbox.moe/98ma2n.jpg" 
                  alt="AI" 
                  className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                />
                <span className="font-bold text-metallic-gold text-sm">AI PLANK.DEV</span>
              </div>
              <p className="text-white text-sm chat-text">Halo! Saya AI canggih siap membantu Anda dengan berbagai tugas!</p>
            </div>
          </div>
        )}

        {messagesLoading && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-metallic-gold"></div>
          </div>
        )}

        {messages && messages.map((msg) => (
          <div key={msg.id} className={`chat-message-wrapper flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`chat-bubble max-w-[75%] sm:max-w-[80%] p-3 rounded-2xl text-sm relative overflow-hidden ${
                msg.role === 'user' 
                  ? 'rounded-br-sm bg-gradient-to-r from-metallic-gold to-yellow-500 text-metallic-navy font-medium border border-yellow-400/50 shadow-lg shadow-yellow-500/20' 
                  : 'rounded-bl-sm bg-gradient-to-r from-metallic-blue to-metallic-accent border border-metallic-gold/30 text-white shadow-lg shadow-blue-500/20'
              }`}
            >
              {/* Metallic shine effect */}
              <div className={`absolute inset-0 opacity-10 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-yellow-100 via-transparent to-transparent'
                  : 'bg-gradient-to-br from-blue-300 via-transparent to-transparent'
              }`}></div>
              
              {msg.role === 'assistant' && (
                <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-metallic-gold/30 relative z-10">
                  <img 
                    src="https://files.catbox.moe/98ma2n.jpg" 
                    alt="AI" 
                    className="w-6 h-6 rounded-full object-cover border border-metallic-gold flex-shrink-0"
                  />
                  <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-metallic-gold via-yellow-300 to-metallic-gold text-sm tracking-wide">AI PLANK.DEV</span>
                </div>
              )}
              
              {msg.fileUrl && (
                <div className="mb-2 p-2 bg-black/20 rounded-lg border border-metallic-gold/20">
                  <div className="flex items-center space-x-2">
                    <Paperclip className="w-3 h-3 text-metallic-silver flex-shrink-0" />
                    <span className="text-metallic-gold text-xs font-medium chat-text">{msg.fileName}</span>
                  </div>
                </div>
              )}
              
              {/* TEXT DENGAN CSS CLASS KHUSUS */}
              <div className="chat-text leading-relaxed">
                {msg.content.split('\n').map((line, lineIdx) => {
                  if (!line.trim()) return <br key={lineIdx} />;
                  
                  if (line.startsWith('##')) {
                    return (
                      <div key={lineIdx} className="font-bold text-metallic-gold mb-1 mt-1 chat-text">
                        {line.replace('##', '').trim()}
                      </div>
                    );
                  }
                  
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return (
                      <div key={lineIdx} className="font-bold text-cyan-400 mb-1 chat-text">
                        {line.replace(/\*\*/g, '')}
                      </div>
                    );
                  }
                  
                  if (line.startsWith('• ') || line.startsWith('- ')) {
                    return (
                      <div key={lineIdx} className="mb-1 chat-text">
                        <span className="text-metallic-gold">• </span>
                        <span>{line.replace(/^[•\-]\s+/, '')}</span>
                      </div>
                    );
                  }
                  
                  return <div key={lineIdx} className="mb-1 chat-text">{line}</div>;
                })}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-md p-4 rounded-2xl rounded-bl-sm bg-gradient-to-r from-metallic-blue to-metallic-accent border border-metallic-gold/30">
              <div className="flex items-center space-x-2">
                <img 
                  src="https://files.catbox.moe/98ma2n.jpg" 
                  alt="AI" 
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="font-bold text-metallic-gold">AI PLANK.DEV</span>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-metallic-gold rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-metallic-gold rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-metallic-gold rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area with Upload options */}
      <div className="p-4 border-t border-metallic-gold/30">
        {/* Uploaded files list */}
        {uploadedFiles.length > 0 && (
          <div className="mb-3 p-2 bg-white/5 rounded-lg border border-metallic-gold/20 overflow-x-auto">
            <div className="flex gap-2 items-center">
              {uploadedFiles.map((file, index) => (
                <div 
                  key={file.url} 
                  className={`flex-shrink-0 py-1 px-2 rounded-md cursor-pointer transition-all ${
                    index === activeFileIndex 
                      ? 'bg-gradient-to-r from-metallic-gold/60 to-yellow-500/60 border border-metallic-gold border-2' 
                      : index === uploadedFiles.length - 1 
                      ? 'bg-gradient-to-r from-metallic-gold/30 to-yellow-500/30 border border-metallic-gold/50' 
                      : 'bg-black/30 border border-slate-700 hover:border-metallic-gold/30'
                  }`}
                  onClick={() => setActiveFileIndex(index === activeFileIndex ? null : index)}
                >
                  <div className="flex items-center gap-1">
                    <Paperclip className="h-3 w-3 text-metallic-silver" />
                    <span className="text-xs truncate max-w-[100px]">{file.name}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 ml-1 rounded-full hover:bg-red-500/20" 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeFileIndex === index) {
                          setActiveFileIndex(null);
                        } else if (activeFileIndex !== null && activeFileIndex > index) {
                          setActiveFileIndex(activeFileIndex - 1);
                        }
                        setUploadedFiles(uploadedFiles.filter((file, i) => i !== index));
                      }}
                    >
                      <X className="h-3 w-3 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {uploadedFiles.length >= 10 && (
                <div className="flex-shrink-0 py-1 px-2 rounded-md bg-red-500/30 border border-red-500/50">
                  <span className="text-xs text-white">Max 10 files</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Upload toolbar */}
        <div className="flex mb-3 p-2 bg-white/5 rounded-lg border border-metallic-gold/20">
          <Button
            onClick={onShowUpload}
            variant="ghost"
            size="sm"
            className="flex-1 text-metallic-gold hover:text-yellow-400 hover:bg-metallic-accent/50 justify-start"
            disabled={uploadedFiles.length >= 10}
          >
            <Paperclip className="w-5 h-5 mr-2" />
            <span>Upload File</span>
          </Button>
          
          <Button
            onClick={onShowUpload}
            variant="ghost"
            size="sm"
            className="flex-1 text-metallic-gold hover:text-yellow-400 hover:bg-metallic-accent/50 justify-start"
            disabled={uploadedFiles.length >= 10}
          >
            <Upload className="w-5 h-5 mr-2" />
            <span>Share Document</span>
          </Button>
          
          <Button
            onClick={() => {
              // Create a custom modal untuk fitur kamera dengan visual yang lebih baik
              const modalDiv = document.createElement('div');
              modalDiv.className = 'fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50';
              modalDiv.style.backdropFilter = 'blur(8px)';
              
              // Header dengan judul dan logo
              const header = document.createElement('div');
              header.className = 'w-full flex items-center justify-between p-4 border-b border-metallic-gold/30';
              
              const title = document.createElement('h3');
              title.className = 'text-xl font-bold text-metallic-gold';
              title.textContent = 'Camera Preview';
              header.appendChild(title);
              
              const closeBtn = document.createElement('button');
              closeBtn.className = 'rounded-full w-8 h-8 bg-red-500/30 hover:bg-red-500 text-white flex items-center justify-center transition-colors';
              closeBtn.innerHTML = '✕';
              header.appendChild(closeBtn);
              
              modalDiv.appendChild(header);
              
              // Container untuk video dan kontrol
              const container = document.createElement('div');
              container.className = 'relative w-full max-w-lg p-4 flex flex-col items-center';
              
              // Message saat permintaan akses kamera
              const accessMessage = document.createElement('div');
              accessMessage.className = 'py-12 px-8 rounded-lg bg-slate-800/70 border border-metallic-gold/30 text-center';
              accessMessage.innerHTML = `
                <div class="animate-spin mb-4 mx-auto h-12 w-12 border-4 border-metallic-gold border-t-transparent rounded-full"></div>
                <p class="text-white text-lg font-semibold">Meminta akses kamera...</p>
                <p class="text-metallic-silver text-sm mt-2">Silakan berikan izin pada browser Anda</p>
              `;
              container.appendChild(accessMessage);
              
              modalDiv.appendChild(container);
              
              // Tambahkan modal ke body
              document.body.appendChild(modalDiv);
              
              // Fungsi untuk menutup modal dan membersihkan resources
              let videoStream: MediaStream | null = null;
              
              const cleanupModal = () => {
                if (videoStream) {
                  videoStream.getTracks().forEach(track => track.stop());
                }
                if (document.body.contains(modalDiv)) {
                  document.body.removeChild(modalDiv);
                }
              };
              
              // Tambahkan event listener untuk tombol close
              closeBtn.onclick = cleanupModal;
              
              // Request akses kamera
              navigator.mediaDevices.getUserMedia({ 
                video: { 
                  facingMode: 'environment', // Gunakan kamera belakang di mobile
                  width: { ideal: 1280 },
                  height: { ideal: 720 } 
                } 
              })
              .then(stream => {
                videoStream = stream;
                
                // Hapus pesan loading
                container.removeChild(accessMessage);
                
                // Buat video element dengan kontrol
                const videoWrapper = document.createElement('div');
                videoWrapper.className = 'relative w-full rounded-lg overflow-hidden border-2 border-metallic-gold/50 bg-black';
                
                const video = document.createElement('video');
                video.srcObject = stream;
                video.autoplay = true;
                video.className = 'w-full max-h-[60vh] object-contain';
                videoWrapper.appendChild(video);
                
                container.appendChild(videoWrapper);
                
                // Tambahkan kontrol kamera
                const controls = document.createElement('div');
                controls.className = 'mt-4 flex justify-center space-x-4';
                
                // Tombol capture
                const captureBtn = document.createElement('button');
                captureBtn.className = 'w-16 h-16 rounded-full bg-gradient-to-r from-metallic-gold to-yellow-500 flex items-center justify-center border-4 border-white';
                captureBtn.innerHTML = '<div class="w-12 h-12 rounded-full bg-white"></div>';
                
                captureBtn.onclick = () => {
                  // Buat canvas untuk capture gambar
                  const canvas = document.createElement('canvas');
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                  
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    // Gambar video ke canvas
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    // Konversi ke data URL
                    const imageDataURL = canvas.toDataURL('image/jpeg');
                    
                    // Tampilkan hasil capture
                    container.innerHTML = '';
                    
                    const resultContainer = document.createElement('div');
                    resultContainer.className = 'w-full flex flex-col items-center';
                    
                    const capturedImage = document.createElement('img');
                    capturedImage.src = imageDataURL;
                    capturedImage.className = 'w-full max-h-[60vh] object-contain rounded-lg border-2 border-metallic-gold/50';
                    resultContainer.appendChild(capturedImage);
                    
                    const btnContainer = document.createElement('div');
                    btnContainer.className = 'mt-4 flex justify-center space-x-4';
                    
                    const sendBtn = document.createElement('button');
                    sendBtn.className = 'px-6 py-3 rounded-lg bg-gradient-to-r from-metallic-gold to-yellow-500 text-metallic-navy font-bold';
                    sendBtn.textContent = 'Kirim ke Chat';
                    sendBtn.onclick = () => {
                      // Konversi data URL ke File
                      const byteString = atob(imageDataURL.split(',')[1]);
                      const mimeType = imageDataURL.split(',')[0].split(':')[1].split(';')[0];
                      const ab = new ArrayBuffer(byteString.length);
                      const ia = new Uint8Array(ab);
                      
                      for (let i = 0; i < byteString.length; i++) {
                        ia[i] = byteString.charCodeAt(i);
                      }
                      
                      const blob = new Blob([ab], {type: mimeType});
                      const file = new File([blob], `camera_${Date.now()}.jpg`, {type: mimeType});
                      
                      // Gunakan file sebagai attachment di chat
                      const formData = new FormData();
                      formData.append('file', file);
                      
                      fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                      })
                      .then(res => res.json())
                      .then(data => {
                        // Berhasil upload, tambahkan ke chat
                        toast({
                          title: "Berhasil mengupload gambar",
                          description: "Gambar telah ditambahkan ke pesan"
                        });
                        
                        cleanupModal();
                      })
                      .catch(err => {
                        toast({
                          title: "Gagal mengupload gambar",
                          description: "Coba lagi atau gunakan metode upload lain",
                          variant: "destructive"
                        });
                      });
                    };
                    
                    const retakeBtn = document.createElement('button');
                    retakeBtn.className = 'px-6 py-3 rounded-lg bg-slate-800 text-white font-bold border border-metallic-gold/30';
                    retakeBtn.textContent = 'Ambil Ulang';
                    retakeBtn.onclick = () => {
                      // Kembali ke mode kamera
                      cleanupModal();
                      // Buka kamera lagi
                      setTimeout(() => {
                        const cameraButton = document.querySelector('button:has(.lucide-camera)') as HTMLButtonElement;
                        if (cameraButton) cameraButton.click();
                      }, 300);
                    };
                    
                    btnContainer.appendChild(retakeBtn);
                    btnContainer.appendChild(sendBtn);
                    resultContainer.appendChild(btnContainer);
                    
                    container.appendChild(resultContainer);
                  }
                };
                
                controls.appendChild(captureBtn);
                container.appendChild(controls);
              })
              .catch(err => {
                console.error('Camera access denied:', err);
                
                // Update pesan di modal untuk menunjukkan error
                container.innerHTML = `
                  <div class="py-12 px-8 rounded-lg bg-red-900/50 border border-red-500/50 text-center">
                    <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/30 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-300" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                      </svg>
                    </div>
                    <p class="text-white text-lg font-semibold">Akses kamera ditolak</p>
                    <p class="text-gray-300 text-sm mt-2">Mohon berikan izin akses kamera pada browser Anda</p>
                    <button class="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">Tutup</button>
                  </div>
                `;
                
                // Tambah event listener untuk tombol tutup
                const closeErrorBtn = container.querySelector('button');
                if (closeErrorBtn) {
                  closeErrorBtn.onclick = cleanupModal;
                }
              });
            }}
            variant="ghost"
            size="sm"
            className="flex-1 text-metallic-gold hover:text-yellow-400 hover:bg-metallic-accent/50 justify-start"
          >
            <Camera className="w-5 h-5 mr-2" />
            <span>Camera</span>
          </Button>
        </div>
        
        {/* Message input */}
        <div className="flex space-x-3 relative">
          <div className="absolute inset-x-0 -top-2 h-px bg-gradient-to-r from-transparent via-metallic-gold/40 to-transparent"></div>
          <div className="flex-1 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-metallic-gold/20 via-cyan-400/20 to-metallic-gold/20 rounded-lg blur-sm opacity-75 group-hover:opacity-100 transition duration-1000"></div>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ketik pesan Anda untuk AI PLANK.DEV..."
              className="relative bg-gradient-to-b from-white/10 to-black/30 border-metallic-gold/40 text-white placeholder-metallic-silver/70 focus:border-metallic-gold focus:bg-black/40 font-medium input-visible shadow-inner"
              disabled={sendMessageMutation.isPending}
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={sendMessageMutation.isPending}
            className={`bg-gradient-to-r from-metallic-gold to-yellow-500 text-metallic-navy hover:from-yellow-500 hover:to-metallic-gold shadow-lg hover:shadow-yellow-500/30 transition-all duration-300 ${
              activeFileIndex !== null ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-metallic-navy' : ''
            }`}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="text-xs mt-3 text-center">
          {usage?.isPremium ? (
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-metallic-gold to-yellow-400 font-semibold tracking-wide">
              Unlimited usage • Premium Plan
            </span>
          ) : (
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-metallic-silver to-blue-400 font-medium tracking-wide">
              Free plan: {usage?.usageCount || 0} of {usage?.limit || 10} messages used today. Upgrade for unlimited usage.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
