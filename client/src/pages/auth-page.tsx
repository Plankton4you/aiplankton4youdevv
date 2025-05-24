import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Bot, Sparkles } from "lucide-react";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({ 
    username: "", 
    password: "", 
    email: "",
    firstName: "",
    lastName: ""
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      // Simulasi berhasil untuk demo - nanti bisa diubah ke real auth
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        id: `user_${Date.now()}`,
        email: `${credentials.username}@demo.com`,
        firstName: credentials.username,
        lastName: ""
      };
    },
    onSuccess: (user) => {
      // Simpan user data ke localStorage untuk demo
      localStorage.setItem('currentUser', JSON.stringify(user));
      toast({
        title: "Login Berhasil!",
        description: `Selamat datang ${user.firstName}! AI PLANK.DEV siap membantu Anda.`,
      });
      // Force reload untuk memastikan auth state terupdate
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Login Gagal",
        description: "Coba lagi dalam beberapa saat",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      // Simulasi berhasil untuk demo - nanti bisa diubah ke real auth
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        id: `user_${Date.now()}`,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName
      };
    },
    onSuccess: (user) => {
      // Simpan user data ke localStorage untuk demo
      localStorage.setItem('currentUser', JSON.stringify(user));
      toast({
        title: "Registrasi Berhasil!",
        description: `Selamat datang ${user.firstName}! AI PLANK.DEV siap membantu Anda.`,
      });
      // Force reload untuk memastikan auth state terupdate
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Registrasi Gagal",
        description: "Coba lagi dalam beberapa saat",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.username || !loginData.password) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Mohon isi username dan password",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerData.username || !registerData.password || !registerData.email) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Mohon isi semua field yang wajib",
        variant: "destructive",
      });
      return;
    }
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Advanced Metallic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 via-transparent to-purple-900/20"></div>
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-radial from-cyan-400/30 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-radial from-purple-400/30 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-radial from-yellow-400/20 to-transparent rounded-full blur-2xl transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>
      
      {/* Metallic Grid Pattern */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `
          linear-gradient(rgba(255,215,0,0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,215,0,0.1) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px'
      }}></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 items-center min-h-screen">
          {/* Hero Section */}
          <div className="space-y-6 text-white">
            <div className="flex items-center space-x-4 p-6 rounded-2xl bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl border border-yellow-400/30 shadow-2xl">
              <div className="relative">
                <img 
                  src="https://files.catbox.moe/98ma2n.jpg" 
                  alt="AI Plank Logo" 
                  className="w-20 h-20 rounded-full object-cover border-3 border-yellow-400 shadow-lg shadow-yellow-400/30"
                />
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-yellow-400 to-cyan-400 opacity-20 blur animate-pulse"></div>
              </div>
              <div>
                <h1 className="font-orbitron font-black text-5xl bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent drop-shadow-2xl">
                  AI PLANK.DEV
                </h1>
                <p className="text-cyan-300 text-xl font-semibold drop-shadow-lg">Advanced AI Assistant</p>
              </div>
            </div>
            
            <div className="space-y-6 p-6 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-cyan-400/20">
              <h2 className="text-4xl font-black bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-400 bg-clip-text text-transparent drop-shadow-2xl">
                Selamat Datang di Masa Depan AI
              </h2>
              <p className="text-2xl text-slate-200 font-medium drop-shadow-lg">
                Asisten AI canggih yang siap membantu Anda dengan berbagai tugas:
              </p>
              
              <div className="grid gap-6 mt-8">
                <div className="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 backdrop-blur-sm">
                  <Bot className="w-8 h-8 text-yellow-400 drop-shadow-lg" />
                  <span className="text-xl font-semibold text-white drop-shadow-lg">Chat cerdas seperti ChatGPT</span>
                </div>
                <div className="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 backdrop-blur-sm">
                  <Sparkles className="w-8 h-8 text-cyan-400 drop-shadow-lg" />
                  <span className="text-xl font-semibold text-white drop-shadow-lg">Analisis file dan gambar</span>
                </div>
                <div className="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 backdrop-blur-sm">
                  <Bot className="w-8 h-8 text-purple-400 drop-shadow-lg" />
                  <span className="text-xl font-semibold text-white drop-shadow-lg">Bantuan coding dan pengembangan</span>
                </div>
                <div className="flex items-center space-x-4 p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 backdrop-blur-sm">
                  <Sparkles className="w-8 h-8 text-green-400 drop-shadow-lg" />
                  <span className="text-xl font-semibold text-white drop-shadow-lg">Pemecahan masalah kompleks</span>
                </div>
              </div>
            </div>
          </div>

          {/* Auth Form */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-2 border-yellow-400/40 backdrop-blur-xl shadow-2xl shadow-yellow-400/20">
              <CardHeader className="text-center p-8">
                <CardTitle className="text-3xl font-orbitron font-black bg-gradient-to-r from-yellow-400 via-yellow-300 to-orange-400 bg-clip-text text-transparent drop-shadow-2xl">
                  Masuk ke AI PLANK.DEV
                </CardTitle>
                <CardDescription className="text-cyan-300 text-lg font-semibold drop-shadow-lg mt-2">
                  Akses asisten AI canggih Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <Tabs defaultValue="login" className="space-y-8">
                  <TabsList className="grid w-full grid-cols-2 bg-slate-700/80 border border-yellow-400/30 p-1">
                    <TabsTrigger value="login" className="font-bold text-slate-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-400 data-[state=active]:to-orange-400 data-[state=active]:text-slate-900 data-[state=active]:shadow-lg">
                      Masuk
                    </TabsTrigger>
                    <TabsTrigger value="register" className="font-bold text-slate-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-400 data-[state=active]:to-blue-400 data-[state=active]:text-slate-900 data-[state=active]:shadow-lg">
                      Daftar
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="login-username" className="text-slate-200 font-semibold text-lg">Username</Label>
                        <Input
                          id="login-username"
                          type="text"
                          value={loginData.username}
                          onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                          className="bg-slate-700/70 border-2 border-yellow-400/40 text-white placeholder-slate-400 focus:border-yellow-400 focus:bg-slate-600/70 input-visible text-lg p-4 rounded-xl backdrop-blur-sm shadow-lg"
                          placeholder="Masukkan username"
                          disabled={loginMutation.isPending}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="login-password" className="text-slate-200 font-semibold text-lg">Password</Label>
                        <Input
                          id="login-password"
                          type="password"
                          value={loginData.password}
                          onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                          className="bg-slate-700/70 border-2 border-yellow-400/40 text-white placeholder-slate-400 focus:border-yellow-400 focus:bg-slate-600/70 input-visible text-lg p-4 rounded-xl backdrop-blur-sm shadow-lg"
                          placeholder="Masukkan password"
                          disabled={loginMutation.isPending}
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-slate-900 hover:from-yellow-500 hover:to-orange-600 font-bold text-lg p-4 rounded-xl shadow-2xl hover:shadow-yellow-400/30 transition-all duration-300 hover:scale-105"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Memproses...
                          </>
                        ) : (
                          "Masuk"
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="register">
                    <form onSubmit={handleRegister} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <Label htmlFor="register-firstname" className="text-slate-200 font-semibold">Nama Depan</Label>
                          <Input
                            id="register-firstname"
                            type="text"
                            value={registerData.firstName}
                            onChange={(e) => setRegisterData({...registerData, firstName: e.target.value})}
                            className="bg-slate-700/70 border-2 border-cyan-400/40 text-white placeholder-slate-400 focus:border-cyan-400 focus:bg-slate-600/70 input-visible p-3 rounded-xl backdrop-blur-sm shadow-lg"
                            placeholder="Nama depan"
                            disabled={registerMutation.isPending}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="register-lastname" className="text-slate-200 font-semibold">Nama Belakang</Label>
                          <Input
                            id="register-lastname"
                            type="text"
                            value={registerData.lastName}
                            onChange={(e) => setRegisterData({...registerData, lastName: e.target.value})}
                            className="bg-slate-700/70 border-2 border-cyan-400/40 text-white placeholder-slate-400 focus:border-cyan-400 focus:bg-slate-600/70 input-visible p-3 rounded-xl backdrop-blur-sm shadow-lg"
                            placeholder="Nama belakang"
                            disabled={registerMutation.isPending}
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="register-email" className="text-slate-200 font-semibold">Email *</Label>
                        <Input
                          id="register-email"
                          type="email"
                          value={registerData.email}
                          onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                          className="bg-slate-700/70 border-2 border-cyan-400/40 text-white placeholder-slate-400 focus:border-cyan-400 focus:bg-slate-600/70 input-visible p-3 rounded-xl backdrop-blur-sm shadow-lg"
                          placeholder="email@example.com"
                          disabled={registerMutation.isPending}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="register-username" className="text-slate-200 font-semibold">Username *</Label>
                        <Input
                          id="register-username"
                          type="text"
                          value={registerData.username}
                          onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                          className="bg-slate-700/70 border-2 border-cyan-400/40 text-white placeholder-slate-400 focus:border-cyan-400 focus:bg-slate-600/70 input-visible p-3 rounded-xl backdrop-blur-sm shadow-lg"
                          placeholder="Pilih username"
                          disabled={registerMutation.isPending}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="register-password" className="text-slate-200 font-semibold">Password *</Label>
                        <Input
                          id="register-password"
                          type="password"
                          value={registerData.password}
                          onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                          className="bg-slate-700/70 border-2 border-cyan-400/40 text-white placeholder-slate-400 focus:border-cyan-400 focus:bg-slate-600/70 input-visible p-3 rounded-xl backdrop-blur-sm shadow-lg"
                          placeholder="Buat password aman"
                          disabled={registerMutation.isPending}
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 text-white hover:from-cyan-500 hover:to-purple-600 font-bold text-lg p-4 rounded-xl shadow-2xl hover:shadow-cyan-400/30 transition-all duration-300 hover:scale-105"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Mendaftar...
                          </>
                        ) : (
                          "Daftar Sekarang"
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}