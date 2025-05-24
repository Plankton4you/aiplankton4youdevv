import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "sk-default_key"
});

export async function generateAIResponse(userMessage: string, fileContext?: string): Promise<string> {
  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API key is not available, using fallback responses");
      return getFallbackResponse(userMessage, fileContext);
    }
    
    const systemPrompt = `Kamu adalah AI PLANK.DEV, asisten AI canggih yang dibuat oleh PLANKTON4YOU.DEV. Kamu sangat membantu, berpengetahuan luas, dan dapat membantu berbagai tugas termasuk:

- Menjawab pertanyaan dan memberikan informasi
- Menganalisis file dan gambar yang diunggah
- Membuat proyek dan desain
- Bantuan coding dan pengembangan
- Pemecahan masalah umum
- Diskusi dan brainstorming ide
- Analisis data dan teks
- Memberikan saran dan rekomendasi

Jika ada file yang diupload, berikan analisis mendalam dan detail tentang file tersebut. Selalu bersikap profesional, ramah, dan berikan respons yang detail dan membantu. Jawab dalam bahasa Indonesia dengan natural dan seperti manusia. Jika ada pertanyaan dalam bahasa Inggris, jawab dalam bahasa Inggris. Selalu pertahankan identitas sebagai AI PLANK.DEV.`;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      { 
        role: "user", 
        content: fileContext ? `${userMessage}\n\nKonteks file: ${fileContext}` : userMessage 
      }
    ];

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 2000,
        temperature: 0.8,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      return response.choices[0].message.content || "Maaf, saya tidak bisa menghasilkan respons saat ini. Silakan coba lagi.";
    } catch (apiError) {
      console.error("OpenAI API request failed:", apiError);
      return getFallbackResponse(userMessage, fileContext);
    }
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "Mohon maaf, terjadi kesalahan sistem. Silakan coba lagi nanti. Tim kami sedang bekerja untuk memperbaiki masalah ini.";
  }
}

// Fallback responses when OpenAI API is not available
function getFallbackResponse(message: string, fileContext?: string): string {
  // Jika ada file yang diupload, berikan analisis fallback yang detail
  if (fileContext) {
    return `## 🔍 Analisis File - AI PLANK.DEV

Halo! Saya telah menerima file yang Anda upload dan dapat memberikan analisis dasar.

**📁 File yang diterima:** ${fileContext}

**🎯 Analisis Otomatis:**
Berdasarkan informasi file, saya dapat membantu dengan:

• **Identifikasi Format** - Mengenali jenis dan ekstensi file
• **Saran Penggunaan** - Memberikan rekomendasi cara terbaik menggunakan file
• **Analisis Konten** - Memberikan insight tentang isi file
• **Troubleshooting** - Membantu jika ada masalah dengan file

**💡 Yang bisa saya lakukan selanjutnya:**
- Memberikan penjelasan detail tentang file ini
- Menyarankan tools atau software yang cocok
- Membantu mengoptimalkan penggunaan file
- Menganalisis lebih dalam jika diperlukan

**❓ Pertanyaan untuk Anda:**
Apa yang ingin Anda ketahui tentang file ini? Saya siap memberikan analisis yang lebih spesifik!

---
*AI PLANK.DEV - Asisten AI Canggih by PLANKTON4YOU.DEV*`;
  }
  // Simple fallback responses
  const greetings = ["hello", "hi", "halo", "hai", "hey", "greetings"];
  const questionWords = ["what", "who", "where", "when", "why", "how", "can", "could", "apa", "siapa", "dimana", "kapan", "kenapa", "bagaimana", "bisakah"];
  const messageLC = message.toLowerCase();
  
  // Check if it's a greeting
  if (greetings.some(g => messageLC.includes(g))) {
    return "Halo! Saya AI PLANK.DEV, asisten AI untuk membantu Anda. Saat ini sedang ada masalah koneksi dengan server AI. Tim kami sedang bekerja untuk memperbaikinya segera. Terima kasih atas kesabaran Anda.";
  }
  
  // Check if it's a question
  if (questionWords.some(q => messageLC.startsWith(q)) || messageLC.includes("?")) {
    return "Terima kasih atas pertanyaan Anda. Saat ini layanan AI kami sedang mengalami masalah teknis. Silakan coba lagi nanti atau hubungi kami melalui WhatsApp atau Instagram jika pertanyaan Anda mendesak.";
  }
  
  // Default response
  return "Mohon maaf, saat ini layanan AI kami sedang mengalami gangguan sementara. Tim teknis kami sedang bekerja untuk memperbaikinya. Silakan coba lagi dalam beberapa saat. Terima kasih atas kesabaran dan pengertian Anda.";
}

export async function analyzeImage(base64Image: string): Promise<string> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return `## 🖼️ Analisis Gambar - AI PLANK.DEV

Halo! Saya telah menerima gambar yang Anda upload.

Saat ini memerlukan konfigurasi API untuk menganalisis gambar secara mendalam. 

**📷 Yang dapat saya lakukan:**
• Memberikan analisis dasar tentang format gambar
• Membantu dengan editing atau optimisasi gambar
• Memberikan saran penggunaan gambar

Silakan berikan detail tentang gambar atau pertanyaan spesifik yang ingin Anda ketahui!`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Kamu adalah AI PLANK.DEV, asisten AI canggih untuk menganalisis gambar. Berikan analisis yang detail, mendalam, dan berguna dalam bahasa Indonesia. Jelaskan apa yang kamu lihat dalam gambar dengan sangat detail termasuk objek, warna, komposisi, dan konteks.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Tolong analisis gambar ini secara detail. Jelaskan semua yang kamu lihat dengan lengkap dan mendalam."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1500
    });

    const analysis = response.choices[0].message.content || "Maaf, tidak dapat menganalisis gambar saat ini.";
    
    return `## 🖼️ Analisis Gambar - AI PLANK.DEV

${analysis}

---
*Analisis dilakukan oleh AI PLANK.DEV - Asisten AI Canggih*`;

  } catch (error) {
    console.error("Image analysis error:", error);
    return `## 🖼️ Analisis Gambar - AI PLANK.DEV

Saya telah menerima gambar Anda dan dapat memberikan analisis dasar.

**📸 Informasi Gambar:**
• Format: JPEG/PNG
• Status: Berhasil diupload
• Ukuran: Sesuai untuk analisis

**🔍 Analisis Manual:**
Gambar berhasil diterima dan dapat diproses. Untuk analisis yang lebih detail, silakan ajukan pertanyaan spesifik tentang gambar ini.

**💡 Yang bisa saya bantu:**
• Memberikan saran editing
• Mengidentifikasi elemen dalam gambar
• Memberikan rekomendasi penggunaan

Apa yang ingin Anda ketahui tentang gambar ini?`;
  }
}

export async function generateProjectCode(description: string, technologies: string[]): Promise<string> {
  try {
    // Gunakan respons sederhana untuk sementara
    return `Halo, saya AI PLANK.DEV!

Terima kasih telah meminta saya membuat proyek menggunakan teknologi: ${technologies.join(", ")}

Deskripsi proyek Anda: "${description}"

Saat ini fitur pembuatan kode proyek sedang dalam perbaikan. Tim kami sedang bekerja untuk mengembalikan fungsi ini segera.

Mohon maaf atas ketidaknyamanan ini. Silakan coba lagi nanti atau hubungi dukungan pelanggan kami melalui WhatsApp atau Instagram untuk bantuan lebih lanjut.

Terima kasih atas kesabaran dan pengertian Anda.
--Tim PLANKTON4YOU.DEV`;
  } catch (error) {
    console.error("Project code generation error:", error);
    return "Mohon maaf, terjadi kesalahan saat mencoba membuat kode proyek. Silakan coba lagi nanti.";
  }
}
