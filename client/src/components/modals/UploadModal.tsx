import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, Camera, Image, X } from "lucide-react";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onFileUploaded: (fileUrl: string, fileName: string, fileType: string) => void;
}

export default function UploadModal({ open, onClose, onFileUploaded }: UploadModalProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "File uploaded successfully",
        description: `${data.originalName} has been uploaded.`,
      });
      onFileUploaded(data.url, data.originalName, data.fileType || 'application/octet-stream');
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size must be less than 50MB.",
        variant: "destructive",
      });
      return;
    }
    
    uploadMutation.mutate(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const openCamera = () => {
    // Menampilkan pesan saat meminta akses kamera
    toast({
      title: "Meminta Akses Kamera",
      description: "Harap berikan izin untuk menggunakan kamera",
    });
    
    // Coba akses kamera dengan opsi untuk menggunakan kamera belakang di mobile
    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    })
    .then(stream => {
      // Buat modal khusus dengan desain yang lebih baik
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-[60]';
      modal.style.backdropFilter = 'blur(5px)';
      
      // Header dengan judul dan tombol close
      const header = document.createElement('div');
      header.className = 'w-full flex items-center justify-between p-4 border-b border-metallic-gold/20';
      
      const headerTitle = document.createElement('div');
      headerTitle.className = 'text-xl font-bold text-metallic-gold';
      headerTitle.textContent = 'Ambil Foto';
      header.appendChild(headerTitle);
      
      const closeBtn = document.createElement('button');
      closeBtn.className = 'rounded-full w-8 h-8 bg-red-500/20 hover:bg-red-500/80 text-white flex items-center justify-center';
      closeBtn.innerHTML = '✕';
      closeBtn.onclick = () => {
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(modal);
      };
      header.appendChild(closeBtn);
      modal.appendChild(header);
      
      // Container untuk video
      const container = document.createElement('div');
      container.className = 'w-full max-w-lg p-4 flex flex-col items-center';
      
      // Video container dengan border metalik
      const videoWrapper = document.createElement('div');
      videoWrapper.className = 'relative w-full rounded-xl overflow-hidden border-2 border-metallic-gold/50 bg-black';
      
      // Element video
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.className = 'w-full max-h-[60vh] object-contain';
      videoWrapper.appendChild(video);
      container.appendChild(videoWrapper);
      
      // Canvas untuk capture
      const canvas = document.createElement('canvas');
      
      // Tombol Controls
      const controls = document.createElement('div');
      controls.className = 'flex justify-center mt-8 space-x-4';
      
      // Tombol capture dengan styling menarik
      const captureBtn = document.createElement('button');
      captureBtn.className = 'w-16 h-16 rounded-full bg-gradient-to-r from-metallic-gold to-yellow-500 flex items-center justify-center border-4 border-white shadow-lg shadow-black/50 hover:scale-105 transition-transform';
      captureBtn.innerHTML = '<div class="w-12 h-12 rounded-full bg-white"></div>';
      
      captureBtn.onclick = () => {
        // Efek flash saat capture
        const flash = document.createElement('div');
        flash.className = 'absolute inset-0 bg-white';
        flash.style.animation = 'flash 0.5s';
        videoWrapper.appendChild(flash);
        
        // Tambahkan style untuk animasi flash
        const style = document.createElement('style');
        style.textContent = `
          @keyframes flash {
            0% { opacity: 0.8; }
            100% { opacity: 0; }
          }
        `;
        document.head.appendChild(style);
        
        // Hapus flash setelah animasi
        setTimeout(() => {
          videoWrapper.removeChild(flash);
        }, 500);
        
        // Capture gambar dari video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Captuer gambar dari video ke canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Konversi ke blob untuk upload
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
              
              // Tampilkan preview
              container.innerHTML = '';
              
              const previewTitle = document.createElement('div');
              previewTitle.className = 'w-full flex items-center space-x-2 mb-4';
              previewTitle.innerHTML = `
                <div class="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
                <span class="text-lg font-medium text-white">Foto Berhasil Diambil</span>
              `;
              container.appendChild(previewTitle);
              
              // Tampilkan image preview
              const img = document.createElement('img');
              img.src = URL.createObjectURL(blob);
              img.className = 'rounded-lg border-2 border-metallic-gold/50 max-h-[50vh] object-contain mb-6';
              container.appendChild(img);
              
              // Buat tombol actions
              const actionButtons = document.createElement('div');
              actionButtons.className = 'flex space-x-4';
              
              // Tombol ambil ulang
              const retakeBtn = document.createElement('button');
              retakeBtn.className = 'px-4 py-2 bg-slate-800 text-white rounded-lg border border-metallic-gold/30 hover:bg-slate-700';
              retakeBtn.innerHTML = '<span class="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>Ambil Ulang</span>';
              retakeBtn.onclick = () => {
                // Kembali ke mode kamera
                openCamera();
                document.body.removeChild(modal);
              };
              
              // Tombol upload
              const uploadBtn = document.createElement('button');
              uploadBtn.className = 'px-4 py-2 bg-gradient-to-r from-metallic-gold to-yellow-500 text-black font-medium rounded-lg shadow-md hover:shadow-lg hover:from-yellow-500 hover:to-metallic-gold';
              uploadBtn.innerHTML = '<span class="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>Upload Foto</span>';
              uploadBtn.onclick = () => {
                // Upload file
                uploadMutation.mutate(file);
                
                // Tutup modal
                stream.getTracks().forEach(track => track.stop());
                document.body.removeChild(modal);
              };
              
              actionButtons.appendChild(retakeBtn);
              actionButtons.appendChild(uploadBtn);
              container.appendChild(actionButtons);
            }
          }, 'image/jpeg', 0.92);
        }
      };
      
      controls.appendChild(captureBtn);
      container.appendChild(controls);
      
      modal.appendChild(container);
      document.body.appendChild(modal);
    })
    .catch(err => {
      console.error("Camera error:", err);
      
      // Tampilkan pesan error yang lebih informatif
      toast({
        title: "Akses Kamera Ditolak",
        description: "Harap aktifkan izin kamera di pengaturan browser Anda",
        variant: "destructive",
      });
    });
  };

  const openGallery = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.click();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-b from-gray-900 via-slate-900 to-black border-2 border-metallic-gold/40 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-metallic-gold to-yellow-400 bg-clip-text text-transparent">Upload Files</DialogTitle>
        </DialogHeader>
        
        {/* Decorative elements */}
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-metallic-gold/10 rounded-full blur-xl opacity-70"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-cyan-500/10 rounded-full blur-xl opacity-70"></div>
        
        <div className="space-y-5 relative">
          {/* Drag & Drop Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
              dragOver 
                ? 'border-metallic-gold bg-metallic-gold/10 shadow-lg shadow-metallic-gold/20 scale-[1.02]' 
                : 'border-metallic-gold/30 hover:border-metallic-gold/50 hover:bg-black/40 hover:shadow-lg hover:shadow-metallic-gold/10'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {/* Animated glow effect */}
            <div className="w-20 h-20 mx-auto mb-5 relative">
              <div className="absolute inset-0 rounded-full bg-metallic-gold/20 animate-pulse blur-md"></div>
              <div className="relative rounded-full bg-gradient-to-br from-metallic-gold/20 to-black/40 flex items-center justify-center w-full h-full">
                <Upload className="w-10 h-10 text-metallic-gold" />
              </div>
            </div>
            
            <p className="text-xl font-bold text-white mb-2">Drag & drop files here</p>
            <p className="text-sm text-metallic-silver mb-5">
              Supports: Images, Documents, ZIP, APK files (Max 50MB)
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.zip,.apk"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="border-metallic-gold/50 text-metallic-gold hover:bg-metallic-gold/20 hover:border-metallic-gold transition-all duration-300 px-6"
              disabled={uploadMutation.isPending}
            >
              <span className="mr-2">Choose Files</span>
              <span className="w-5 h-5 rounded-full bg-gradient-to-r from-metallic-gold to-yellow-400 flex items-center justify-center text-black font-bold text-xs">+</span>
            </Button>
          </div>
          
          {/* Quick Actions with metallic styling */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={openCamera}
              className="bg-gradient-to-r from-blue-600/80 to-blue-800/80 text-white hover:shadow-lg hover:shadow-blue-500/20 border border-blue-400/30 transition-all duration-300 h-14"
              disabled={uploadMutation.isPending}
            >
              <div className="flex flex-col items-center">
                <Camera className="w-5 h-5 mb-1" />
                <span className="text-sm">Camera</span>
              </div>
            </Button>
            
            <Button
              onClick={openGallery}
              className="bg-gradient-to-r from-purple-600/80 to-purple-800/80 text-white hover:shadow-lg hover:shadow-purple-500/20 border border-purple-400/30 transition-all duration-300 h-14"
              disabled={uploadMutation.isPending}
            >
              <div className="flex flex-col items-center">
                <Image className="w-5 h-5 mb-1" />
                <span className="text-sm">Gallery</span>
              </div>
            </Button>
          </div>
          
          {/* File Types Supported */}
          <div className="bg-black/30 border border-metallic-gold/20 rounded-lg p-3">
            <p className="text-xs text-center text-metallic-silver mb-2">Supported File Types</p>
            <div className="flex justify-center space-x-4 text-xs">
              <div className="flex items-center text-blue-300">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-1"></div>
                <span>Images</span>
              </div>
              <div className="flex items-center text-red-300">
                <div className="w-2 h-2 bg-red-400 rounded-full mr-1"></div>
                <span>Documents</span>
              </div>
              <div className="flex items-center text-green-300">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                <span>Other</span>
              </div>
            </div>
          </div>
          
          {/* Upload progress */}
          {uploadMutation.isPending && (
            <div className="flex flex-col items-center justify-center py-5 bg-metallic-gold/5 rounded-lg border border-metallic-gold/30">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-metallic-gold border-t-transparent mb-3"></div>
              <span className="text-metallic-gold font-semibold">Uploading your file...</span>
              <div className="w-full max-w-xs bg-black/40 h-2 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-metallic-gold to-yellow-500 animate-progress-bar"></div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
