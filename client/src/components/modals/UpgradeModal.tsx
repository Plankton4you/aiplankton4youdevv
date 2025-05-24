import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Crown, Wallet, Smartphone, Check, X } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

type PaymentMethod = 'dana' | 'gopay';
type PaymentStatus = 'pending' | 'completed' | 'failed' | null;

interface PaymentDetails {
  paymentUrl: string;
  method: PaymentMethod;
  paymentId: number;
}

export default function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Define app store URLs
  const appStoreUrls = {
    dana: "https://play.google.com/store/apps/details?id=id.dana",
    gopay: "https://play.google.com/store/apps/details?id=com.gojek.app"
  };

  // Effect to check payment status
  useEffect(() => {
    let statusCheckInterval: NodeJS.Timeout | null = null;
    
    if (paymentDetails && paymentStatus === 'pending') {
      // Setelah redirect ke aplikasi e-wallet, kita perlu menunggu
      // user menyelesaikan pembayaran di aplikasi e-wallet mereka
      
      // Simpan waktu mulai untuk simulasi waktu tunggu realistis
      const startTime = Date.now();
      const minimumWaitTime = 20000; // Minimal 20 detik untuk simulasi waktu proses di e-wallet
      
      // Tampilkan pesan informasi
      toast({
        title: `Proses Pembayaran ${selectedMethod?.toUpperCase()}`,
        description: "Silakan selesaikan pembayaran di aplikasi e-wallet Anda",
      });
      
      // Dalam kondisi nyata, ini akan polling ke API untuk cek status pembayaran
      statusCheckInterval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        
        // Simulasi user melakukan pembayaran di aplikasi e-wallet
        // dengan waktu tunggu yang lebih realistis
        // Pada implementasi nyata, backend akan menerima callback dari payment gateway
        
        // Jika sudah cukup waktu, anggap pembayaran berhasil (simulasi)
        if (elapsedTime >= minimumWaitTime) {
          // Random success/failure untuk demo yang lebih realistis
          // Dalam implementasi nyata, ini akan berdasarkan status dari payment gateway
          const isSuccessful = Math.random() > 0.3; // 70% kemungkinan sukses
          
          if (isSuccessful) {
            setPaymentStatus('completed');
            
            // Konfirmasi pembayaran ke server
            confirmPaymentMutation.mutate(paymentDetails.paymentId);
            
            toast({
              title: "Pembayaran Terdeteksi",
              description: "Sistem berhasil mendeteksi pembayaran Anda. Mengaktifkan fitur premium...",
            });
          } else {
            setPaymentStatus('failed');
            
            toast({
              title: "Pembayaran Gagal",
              description: "Sistem tidak dapat mendeteksi pembayaran. Silakan coba lagi.",
              variant: "destructive",
            });
          }
          
          if (statusCheckInterval) clearInterval(statusCheckInterval);
        }
      }, 3000); // Cek setiap 3 detik
    }
    
    return () => {
      if (statusCheckInterval) clearInterval(statusCheckInterval);
    };
  }, [paymentDetails, paymentStatus, selectedMethod]);

  // Demo handlers untuk test UI
  const handleTestSuccess = () => {
    if (paymentDetails) {
      setPaymentStatus('completed');
      confirmPaymentMutation.mutate(paymentDetails.paymentId);
    }
  };
  
  const handleTestFail = () => {
    setPaymentStatus('failed');
  };

  const paymentMutation = useMutation({
    mutationFn: async (paymentMethod: PaymentMethod) => {
      // Untuk demo, kita simulasikan respons dari server
      // Dalam implementasi nyata, ini akan memanggil API pembayaran
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        payment: { 
          id: Date.now(), 
          paymentMethod: paymentMethod,
          amount: 25000,
          status: 'pending'
        },
        paymentUrl: paymentMethod === 'dana' 
          ? 'dana://pay?amount=25000&to=08881382817&reference=123456' 
          : 'gojek://gopay/pay?amount=25000&to=083824299082&reference=123456'
      };
    },
    onSuccess: (data) => {
      setPaymentStatus('pending');
      setPaymentDetails({
        paymentUrl: data.paymentUrl,
        method: data.payment.paymentMethod,
        paymentId: data.payment.id
      });
      
      // Try to open the payment app (simulasi)
      // Note: Ini tidak akan bekerja di browser desktop, hanya di perangkat mobile dengan aplikasi terpasang
      // window.location.href = data.paymentUrl;
      
      // Untuk pengujian UI, kita biarkan di halaman ini
      toast({
        title: `Membuka aplikasi ${data.payment.paymentMethod.toUpperCase()}`,
        description: "Silakan selesaikan pembayaran di aplikasi.",
      });
    },
    onError: () => {
      setPaymentStatus('failed');
      toast({
        title: "Pembayaran Gagal",
        description: "Gagal memproses pembayaran. Silakan coba lagi.",
        variant: "destructive",
      });
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      // Simulasi konfirmasi pembayaran
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return { 
        success: true,
        premium: true
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
      
      toast({
        title: "Upgrade Berhasil!",
        description: "Selamat! Akun Anda sekarang AI PLANK.DEV Pro dengan akses unlimited!",
      });
      
      // Tutup modal dan refresh halaman untuk update status (jangan refresh untuk demo)
      setTimeout(() => {
        onClose();
        // window.location.reload();
      }, 2000);
    },
    onError: () => {
      setPaymentStatus('failed');
      toast({
        title: "Konfirmasi Upgrade Gagal",
        description: "Terjadi masalah saat mengupgrade akun Anda. Tim kami akan segera menghubungi Anda.",
        variant: "destructive",
      });
    }
  });

  const handlePayment = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setPaymentStatus(null);
    setPaymentDetails(null);
    
    // Mulai proses pembayaran
    paymentMutation.mutate(method);
    
    // Buka aplikasi e-wallet otomatis berdasarkan metode yang dipilih
    setTimeout(() => {
      if (method === 'dana') {
        // Untuk versi live, gunakan:
        window.location.href = 'dana://pay?amount=25000&to=08881382817&reference=123456';
        // Alternatif link untuk app store jika aplikasi tidak terinstall
        window.open(appStoreUrls.dana, '_blank');
      } else if (method === 'gopay') {
        // Untuk versi live, gunakan:
        window.location.href = 'gojek://gopay/pay?amount=25000&to=083824299082&reference=123456';
        // Alternatif link untuk app store jika aplikasi tidak terinstall
        window.open(appStoreUrls.gopay, '_blank');
      }
    }, 1000);
  };
  
  const handleOpenAppStore = () => {
    if (paymentDetails?.method) {
      // Untuk demo, kita hanya tampilkan toast
      toast({
        title: `Membuka Play Store untuk ${paymentDetails.method.toUpperCase()}`,
        description: "Silakan install aplikasi dan kembali untuk menyelesaikan pembayaran."
      });
      // window.open(appStoreUrls[paymentDetails.method], '_blank');
    }
  };
  
  const handleRetryPayment = () => {
    if (selectedMethod) {
      paymentMutation.mutate(selectedMethod);
    }
  };

  const features = [
    "Unlimited AI conversations",
    "Advanced file analysis",
    "Priority response speed", 
    "Premium support",
    "No daily limits",
    "Access to latest features"
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-black border-2 border-yellow-400 text-white max-w-md shadow-2xl shadow-yellow-400/20">
        <DialogTitle className="sr-only">Upgrade ke AI PLANK.DEV Pro</DialogTitle>
        <DialogDescription className="sr-only">Akses unlimited AI dengan fitur premium eksklusif</DialogDescription>
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-black rounded-lg"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 via-transparent to-cyan-400/5 rounded-lg"></div>
        
        <div className="relative z-10 text-center p-2">
          <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-cyan-400 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg shadow-yellow-400/30">
            <Crown className="w-10 h-10 text-black" />
          </div>
          
          <h3 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-cyan-400 bg-clip-text text-transparent mb-3">
            Upgrade ke AI PLANK.DEV Pro
          </h3>
          <p className="text-gray-300 mb-6 text-lg">
            Akses unlimited AI dengan fitur premium eksklusif
          </p>
          
          {/* Payment Status Notifications */}
          {paymentStatus === 'completed' && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
              <div className="bg-gradient-to-r from-emerald-900/80 to-green-900/80 border-2 border-green-400 rounded-xl p-8 max-w-sm w-full text-center">
                <div className="w-20 h-20 bg-green-500/30 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-green-400">
                  <Check className="w-12 h-12 text-green-400" />
                </div>
                <h4 className="text-2xl font-bold text-green-400 mb-2">Pembayaran Success!</h4>
                <p className="text-green-200 mb-6">Akun Anda telah berhasil diupgrade ke versi Pro. Nikmati fitur premium tanpa batas!</p>
                <button
                  onClick={onClose}
                  className="w-full p-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold hover:from-green-700 hover:to-green-800 transition-all duration-200"
                >
                  Lanjutkan ke Aplikasi
                </button>
              </div>
            </div>
          )}
          
          {paymentStatus === 'failed' && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
              <div className="bg-gradient-to-r from-red-900/80 to-rose-900/80 border-2 border-red-400 rounded-xl p-8 max-w-sm w-full text-center">
                <div className="w-20 h-20 bg-red-500/30 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-red-400">
                  <X className="w-12 h-12 text-red-400" />
                </div>
                <h4 className="text-2xl font-bold text-red-400 mb-2">Pembayaran Gagal!</h4>
                <p className="text-red-200 mb-6">Transaksi tidak dapat diselesaikan. Silakan coba kembali atau pilih metode pembayaran lain.</p>
                <div className="flex flex-col space-y-3">
                  <button
                    onClick={handleRetryPayment}
                    className="w-full p-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-bold hover:from-red-700 hover:to-red-800 transition-all duration-200"
                  >
                    Coba Lagi
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full p-3 border border-red-400/50 text-red-200 rounded-lg font-bold hover:bg-red-900/30 transition-all duration-200"
                  >
                    Kembali
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Pricing */}
          <div className="bg-gradient-to-r from-yellow-900/30 to-cyan-900/30 border border-yellow-400/30 rounded-xl p-6 mb-6 backdrop-blur-sm">
            <div className="text-4xl font-bold text-yellow-400 mb-2">Rp 25,000</div>
            <div className="text-cyan-400 font-semibold">Pembayaran sekali - Akses selamanya!</div>
          </div>
          
          {/* Features */}
          <div className="text-left mb-6 bg-slate-900/50 border border-gray-700 rounded-xl p-5">
            <h4 className="text-yellow-400 font-bold mb-4 text-lg text-center">✨ Fitur Pro Eksklusif:</h4>
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-white font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Payment Methods */}
          {!paymentStatus && !paymentDetails && (
            <div className="space-y-4 mb-6">
              <button
                onClick={() => handlePayment('dana')}
                disabled={paymentMutation.isPending || confirmPaymentMutation.isPending}
                className="w-full p-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl flex items-center justify-between transition-all duration-200 shadow-lg shadow-blue-600/25 border border-blue-400/30 active:scale-95"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center p-1">
                    <img 
                      src="https://assets.grab.com/wp-content/uploads/sites/9/2020/09/18152740/Dana-Logo-Blue.png" 
                      alt="DANA" 
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold">Pay with DANA</div>
                    <div className="text-blue-200 text-sm">Otomatis membuka aplikasi DANA Anda</div>
                  </div>
                </div>
                <div className="text-blue-200 font-mono text-sm">08881382917</div>
                {selectedMethod === 'dana' && paymentMutation.isPending && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                )}
              </button>
              
              <button
                onClick={() => handlePayment('gopay')}
                disabled={paymentMutation.isPending || confirmPaymentMutation.isPending}
                className="w-full p-5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-xl flex items-center justify-between transition-all duration-200 shadow-lg shadow-green-600/25 border border-green-400/30 active:scale-95"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center p-1">
                    <img 
                      src="https://lelogama.go-jek.com/post_featured_image/gopay-feature.jpg" 
                      alt="GoPay" 
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold">Pay with GoPay</div>
                    <div className="text-green-200 text-sm">Otomatis membuka aplikasi Gojek Anda</div>
                  </div>
                </div>
                <div className="text-green-200 font-mono text-sm">083624299682</div>
                {selectedMethod === 'gopay' && paymentMutation.isPending && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
                )}
              </button>
            </div>
          )}
          
          {/* Payment in Progress */}
          {paymentStatus === 'pending' && paymentDetails && (
            <div className="space-y-5 mb-6">
              <div className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-400/50 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    {/* Pulsing glow effect */}
                    <div className="absolute inset-0 rounded-full bg-yellow-400/30 animate-pulse blur-md"></div>
                    
                    {/* Spinner with metallic styling */}
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent relative"></div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-yellow-400 font-semibold text-lg mb-1">
                      Menunggu pembayaran...
                    </p>
                    <p className="text-yellow-200/70 text-sm">
                      Silakan selesaikan transaksi di aplikasi {selectedMethod?.toUpperCase()}
                    </p>
                  </div>
                  
                  {/* Countdown timer untuk menunjukkan proses */}
                  <div className="w-full bg-black/50 h-2 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 animate-progress-bar"></div>
                  </div>
                </div>
              </div>
              
              {/* Informasi tambahan untuk pengguna */}
              <div className="mt-4 text-center text-sm text-metallic-silver">
                <p>Jika aplikasi {selectedMethod?.toUpperCase()} tidak terbuka secara otomatis, silakan buka manual dan kirim pembayaran ke nomor yang tertera.</p>
              </div>
              
              <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-5 text-left">
                <h4 className="font-semibold text-white mb-3">Status Pembayaran:</h4>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Metode</span>
                    <span className="text-white font-medium">{paymentDetails.method.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total</span>
                    <span className="text-white font-medium">Rp 25,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className="text-yellow-400 font-medium">Menunggu Pembayaran</span>
                  </div>
                </div>

                {/* Demo buttons - for testing only */}
                <div className="space-y-3 mb-4">
                  <button 
                    onClick={handleTestSuccess}
                    className="w-full p-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold mb-3 hover:from-green-700 hover:to-green-800 transition-all duration-200"
                  >
                    Simulasi Pembayaran Berhasil
                  </button>
                  <button 
                    onClick={handleTestFail}
                    className="w-full p-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-bold mb-3 hover:from-red-700 hover:to-red-800 transition-all duration-200"
                  >
                    Simulasi Pembayaran Gagal
                  </button>
                </div>
                
                <button
                  onClick={() => window.location.href = paymentDetails.paymentUrl}
                  className="w-full p-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold mb-3 hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                >
                  Buka Aplikasi {paymentDetails.method.toUpperCase()} Lagi
                </button>
                
                <button
                  onClick={handleOpenAppStore}
                  className="w-full p-3 border border-blue-500/30 text-blue-400 rounded-lg font-semibold hover:bg-blue-900/20 transition-all duration-200"
                >
                  Buka Play Store
                </button>
              </div>
            </div>
          )}
          
          {/* Loading State */}
          {(paymentMutation.isPending || confirmPaymentMutation.isPending) && !paymentStatus && (
            <div className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-400/50 rounded-xl p-4 mb-6 backdrop-blur-sm">
              <div className="flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-400"></div>
                <p className="text-yellow-400 font-semibold">
                  {paymentMutation.isPending 
                    ? "Memproses pembayaran..." 
                    : "Mengkonfirmasi pembayaran & upgrade akun..."
                  }
                </p>
              </div>
            </div>
          )}
          
          {!paymentStatus && !paymentDetails && (
            <button
              onClick={onClose}
              className="w-full p-3 border-2 border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white rounded-xl font-semibold transition-all duration-200"
              disabled={paymentMutation.isPending || confirmPaymentMutation.isPending}
            >
              Nanti Dulu
            </button>
          )}
          
          <p className="text-center text-xs text-gray-500 mt-4">
            🔒 Pembayaran 100% aman & terenkripsi. Upgrade otomatis setelah pembayaran berhasil.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
