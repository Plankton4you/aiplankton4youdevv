import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Sparkles, Zap, Shield, Cpu, FileText, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loginWithGoogle } from "@/lib/firebase";

export default function Landing() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = () => {
    window.location.href = "/api/login";
  };
  
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithGoogle();
      // Login successful - Firebase auth state change will trigger redirect
    } catch (error) {
      console.error("Google login failed:", error);
      toast({
        title: "Login gagal",
        description: "Gagal login dengan Google. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-12 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Hero Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <img 
              src="https://files.catbox.moe/98ma2n.jpg" 
              alt="AI Plank Logo" 
              className="w-20 h-20 rounded-full object-cover border-4 border-metallic-gold"
            />
            <div>
              <h1 className="font-orbitron font-black text-5xl md:text-6xl bg-gradient-to-r from-metallic-gold via-metallic-silver to-metallic-gold bg-clip-text text-transparent">
                AI PLANK.DEV
              </h1>
              <p className="text-metallic-silver text-xl font-medium">
                Advanced AI Assistant by PLANKTON4YOU.DEV
              </p>
            </div>
          </div>

          <p className="text-lg text-metallic-silver max-w-2xl mx-auto leading-relaxed">
            Experience the future of AI assistance with our advanced platform. 
            Upload files, analyze images, generate code, and get intelligent responses 
            to all your questions with our cutting-edge AI technology.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 my-12">
          <Card className="bg-gradient-to-b from-metallic-navy to-metallic-blue border-metallic-gold/30 hover:border-metallic-gold/50 transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <Cpu className="w-12 h-12 text-metallic-gold mx-auto mb-4" />
              <h3 className="text-xl font-bold text-metallic-gold mb-2">Smart AI</h3>
              <p className="text-metallic-silver">Powered by GPT-4o for intelligent conversations and problem-solving</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-metallic-navy to-metallic-blue border-metallic-gold/30 hover:border-metallic-gold/50 transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <FileText className="w-12 h-12 text-metallic-gold mx-auto mb-4" />
              <h3 className="text-xl font-bold text-metallic-gold mb-2">File Analysis</h3>
              <p className="text-metallic-silver">Upload and analyze images, documents, ZIP files, and APK files</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-metallic-navy to-metallic-blue border-metallic-gold/30 hover:border-metallic-gold/50 transition-all duration-300 hover:scale-105">
            <CardContent className="p-6 text-center">
              <Zap className="w-12 h-12 text-metallic-gold mx-auto mb-4" />
              <h3 className="text-xl font-bold text-metallic-gold mb-2">Code Generation</h3>
              <p className="text-metallic-silver">Create projects, design applications, and generate code</p>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <Card className="bg-gradient-to-b from-metallic-blue to-metallic-accent border-metallic-silver/30">
            <CardContent className="p-6 text-center">
              <Sparkles className="w-8 h-8 text-metallic-silver mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-metallic-silver mb-2">Free Plan</h3>
              <div className="text-3xl font-black text-metallic-silver mb-4">Rp 0</div>
              <ul className="text-sm text-metallic-silver/80 space-y-2 mb-6">
                <li>• 10 AI conversations per day</li>
                <li>• Basic file upload support</li>
                <li>• Standard response speed</li>
                <li>• Community support</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-metallic-gold to-yellow-500 border-metallic-gold relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-metallic-navy text-metallic-gold px-3 py-1 text-xs font-bold">
              RECOMMENDED
            </div>
            <CardContent className="p-6 text-center">
              <Crown className="w-8 h-8 text-metallic-navy mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-metallic-navy mb-2">Pro Plan</h3>
              <div className="text-3xl font-black text-metallic-navy mb-4">Rp 25.000</div>
              <ul className="text-sm text-metallic-navy/80 space-y-2 mb-6">
                <li>• Unlimited AI conversations</li>
                <li>• Advanced file analysis</li>
                <li>• Priority response speed</li>
                <li>• Premium support</li>
                <li>• No daily limits</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 justify-center">
            <Button
              onClick={handleGoogleLogin}
              size="lg"
              disabled={isLoading}
              className="bg-white text-metallic-navy hover:bg-gray-100 font-bold text-lg px-8 py-4 h-auto rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
            >
              <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Masuk dengan Google
            </Button>
            
            <Button
              onClick={handleLogin}
              size="lg"
              disabled={isLoading}
              className="bg-gradient-to-r from-metallic-gold to-yellow-500 text-metallic-navy hover:from-yellow-500 hover:to-metallic-gold font-bold text-lg px-8 py-4 h-auto rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Shield className="w-6 h-6 mr-2" />
              Masuk dengan Replit
            </Button>
          </div>
          
          <p className="text-sm text-metallic-silver/70">
            Pilih opsi login yang Anda inginkan. Tidak diperlukan kartu kredit untuk paket gratis.
          </p>
        </div>

        {/* Contact Info */}
        <div className="mt-12 pt-8 border-t border-metallic-gold/30">
          <h4 className="text-metallic-gold font-bold mb-4">Connect with us</h4>
          <div className="flex justify-center space-x-6">
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
        </div>
      </div>
    </div>
  );
}
