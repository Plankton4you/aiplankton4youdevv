var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express3 from "express";

// server/routes.ts
import express from "express";
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  conversations: () => conversations,
  insertConversationSchema: () => insertConversationSchema,
  insertFileSchema: () => insertFileSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertPaymentSchema: () => insertPaymentSchema,
  messages: () => messages,
  payments: () => payments,
  sessions: () => sessions,
  uploadedFiles: () => uploadedFiles,
  users: () => users
});
import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isPremium: boolean("is_premium").default(false),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  role: varchar("role").notNull(),
  // 'user' or 'assistant'
  content: text("content").notNull(),
  fileUrl: text("file_url"),
  // For uploaded files
  fileName: text("file_name"),
  // Original file name
  fileType: text("file_type"),
  // MIME type
  createdAt: timestamp("created_at").defaultNow()
});
var uploadedFiles = pgTable("uploaded_files", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  filePath: text("file_path").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  // Amount in rupiah
  paymentMethod: varchar("payment_method").notNull(),
  // 'dana' or 'gopay'
  paymentStatus: varchar("payment_status").notNull().default("pending"),
  // 'pending', 'completed', 'failed'
  transactionId: varchar("transaction_id"),
  createdAt: timestamp("created_at").defaultNow()
});
var insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true
});
var insertFileSchema = createInsertSchema(uploadedFiles).omit({
  id: true,
  createdAt: true
});
var insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc } from "drizzle-orm";
var DatabaseStorage = class {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  // Usage tracking
  async incrementUserUsage(userId) {
    await db.update(users).set({
      usageCount: eq(users.usageCount, null) ? 1 : users.usageCount + 1,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, userId));
  }
  async resetUserUsage(userId) {
    await db.update(users).set({
      usageCount: 0,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, userId));
  }
  async upgradeToPremium(userId) {
    await db.update(users).set({
      isPremium: true,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, userId));
  }
  // Conversation operations
  async createConversation(conversation) {
    const [newConversation] = await db.insert(conversations).values(conversation).returning();
    return newConversation;
  }
  async getUserConversations(userId) {
    return await db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt));
  }
  async getConversation(id) {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }
  async updateConversationTitle(id, title) {
    await db.update(conversations).set({ title, updatedAt: /* @__PURE__ */ new Date() }).where(eq(conversations.id, id));
  }
  async deleteConversation(id) {
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
  }
  // Message operations
  async addMessage(message) {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }
  async getConversationMessages(conversationId) {
    return await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
  }
  async deleteMessage(id) {
    await db.delete(messages).where(eq(messages.id, id));
  }
  // File operations
  async addUploadedFile(file) {
    const [newFile] = await db.insert(uploadedFiles).values(file).returning();
    return newFile;
  }
  async getUserFiles(userId) {
    return await db.select().from(uploadedFiles).where(eq(uploadedFiles.userId, userId)).orderBy(desc(uploadedFiles.createdAt));
  }
  async getFile(id) {
    const [file] = await db.select().from(uploadedFiles).where(eq(uploadedFiles.id, id));
    return file;
  }
  async deleteFile(id) {
    await db.delete(uploadedFiles).where(eq(uploadedFiles.id, id));
  }
  // Payment operations
  async addPayment(payment) {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }
  async getUserPayments(userId) {
    return await db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
  }
  async updatePaymentStatus(id, status, transactionId) {
    await db.update(payments).set({
      paymentStatus: status,
      ...transactionId && { transactionId }
    }).where(eq(payments.id, id));
  }
};
var storage = new DatabaseStorage();

// server/replitAuth.ts
import * as client from "openid-client";
import { Strategy } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}
var getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID
    );
  },
  { maxAge: 3600 * 1e3 }
);
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions"
  });
  return session({
    secret: process.env.SESSION_SECRET || "plank-dev-secret-key-2024",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      // Changed to false for development
      maxAge: sessionTtl
    }
  });
}
function updateUserSession(user, tokens) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}
async function upsertUser(claims) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"]
  });
}
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  const config = await getOidcConfig();
  const verify = async (tokens, verified) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };
  for (const domain of process.env.REPLIT_DOMAINS.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`
      },
      verify
    );
    passport.use(strategy);
  }
  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));
  app2.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"]
    })(req, res, next);
  });
  app2.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login"
    })(req, res, next);
  });
  app2.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`
        }).href
      );
    });
  });
}
var isAuthenticated = async (req, res, next) => {
  const user = req.user;
  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const now = Math.floor(Date.now() / 1e3);
  if (now <= user.expires_at) {
    return next();
  }
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    return res.redirect("/api/login");
  }
  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    return res.redirect("/api/login");
  }
};

// server/openai.ts
import OpenAI from "openai";
var openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "sk-default_key"
});
async function generateAIResponse(userMessage, fileContext) {
  try {
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
    const messages2 = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: fileContext ? `${userMessage}

Konteks file: ${fileContext}` : userMessage
      }
    ];
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages2,
        max_tokens: 2e3,
        temperature: 0.8,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
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
function getFallbackResponse(message, fileContext) {
  if (fileContext) {
    return `## \u{1F50D} Analisis File - AI PLANK.DEV

Halo! Saya telah menerima file yang Anda upload dan dapat memberikan analisis dasar.

**\u{1F4C1} File yang diterima:** ${fileContext}

**\u{1F3AF} Analisis Otomatis:**
Berdasarkan informasi file, saya dapat membantu dengan:

\u2022 **Identifikasi Format** - Mengenali jenis dan ekstensi file
\u2022 **Saran Penggunaan** - Memberikan rekomendasi cara terbaik menggunakan file
\u2022 **Analisis Konten** - Memberikan insight tentang isi file
\u2022 **Troubleshooting** - Membantu jika ada masalah dengan file

**\u{1F4A1} Yang bisa saya lakukan selanjutnya:**
- Memberikan penjelasan detail tentang file ini
- Menyarankan tools atau software yang cocok
- Membantu mengoptimalkan penggunaan file
- Menganalisis lebih dalam jika diperlukan

**\u2753 Pertanyaan untuk Anda:**
Apa yang ingin Anda ketahui tentang file ini? Saya siap memberikan analisis yang lebih spesifik!

---
*AI PLANK.DEV - Asisten AI Canggih by PLANKTON4YOU.DEV*`;
  }
  const greetings = ["hello", "hi", "halo", "hai", "hey", "greetings"];
  const questionWords = ["what", "who", "where", "when", "why", "how", "can", "could", "apa", "siapa", "dimana", "kapan", "kenapa", "bagaimana", "bisakah"];
  const messageLC = message.toLowerCase();
  if (greetings.some((g) => messageLC.includes(g))) {
    return "Halo! Saya AI PLANK.DEV, asisten AI untuk membantu Anda. Saat ini sedang ada masalah koneksi dengan server AI. Tim kami sedang bekerja untuk memperbaikinya segera. Terima kasih atas kesabaran Anda.";
  }
  if (questionWords.some((q) => messageLC.startsWith(q)) || messageLC.includes("?")) {
    return "Terima kasih atas pertanyaan Anda. Saat ini layanan AI kami sedang mengalami masalah teknis. Silakan coba lagi nanti atau hubungi kami melalui WhatsApp atau Instagram jika pertanyaan Anda mendesak.";
  }
  return "Mohon maaf, saat ini layanan AI kami sedang mengalami gangguan sementara. Tim teknis kami sedang bekerja untuk memperbaikinya. Silakan coba lagi dalam beberapa saat. Terima kasih atas kesabaran dan pengertian Anda.";
}
async function analyzeImage(base64Image) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return `## \u{1F5BC}\uFE0F Analisis Gambar - AI PLANK.DEV

Halo! Saya telah menerima gambar yang Anda upload.

Saat ini memerlukan konfigurasi API untuk menganalisis gambar secara mendalam. 

**\u{1F4F7} Yang dapat saya lakukan:**
\u2022 Memberikan analisis dasar tentang format gambar
\u2022 Membantu dengan editing atau optimisasi gambar
\u2022 Memberikan saran penggunaan gambar

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
    return `## \u{1F5BC}\uFE0F Analisis Gambar - AI PLANK.DEV

${analysis}

---
*Analisis dilakukan oleh AI PLANK.DEV - Asisten AI Canggih*`;
  } catch (error) {
    console.error("Image analysis error:", error);
    return `## \u{1F5BC}\uFE0F Analisis Gambar - AI PLANK.DEV

Saya telah menerima gambar Anda dan dapat memberikan analisis dasar.

**\u{1F4F8} Informasi Gambar:**
\u2022 Format: JPEG/PNG
\u2022 Status: Berhasil diupload
\u2022 Ukuran: Sesuai untuk analisis

**\u{1F50D} Analisis Manual:**
Gambar berhasil diterima dan dapat diproses. Untuk analisis yang lebih detail, silakan ajukan pertanyaan spesifik tentang gambar ini.

**\u{1F4A1} Yang bisa saya bantu:**
\u2022 Memberikan saran editing
\u2022 Mengidentifikasi elemen dalam gambar
\u2022 Memberikan rekomendasi penggunaan

Apa yang ingin Anda ketahui tentang gambar ini?`;
  }
}

// server/routes.ts
import multer from "multer";
import path from "path";
import fs from "fs";
var uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
var upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 50 * 1024 * 1024
    // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip",
      "application/x-zip-compressed",
      "application/vnd.android.package-archive"
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});
var FREE_USAGE_LIMIT = 10;
async function registerRoutes(app2) {
  await setupAuth(app2);
  app2.use("/uploads", express.static(uploadDir));
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.post("/api/register", async (req, res) => {
    try {
      const { username, email, password, firstName, lastName } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email, dan password wajib diisi" });
      }
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const user = await storage.upsertUser({
        id: userId,
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        profileImageUrl: null,
        isPremium: false,
        usageCount: 0
      });
      if (req.session) {
        req.session.userId = userId;
        req.session.email = email;
        req.session.username = username;
      }
      res.json(user);
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Gagal mendaftar. Silakan coba lagi." });
    }
  });
  app2.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username dan password wajib diisi" });
      }
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      let user = await storage.getUser(userId);
      if (!user) {
        user = await storage.upsertUser({
          id: userId,
          email: `${username}@demo.com`,
          firstName: username,
          lastName: null,
          profileImageUrl: null,
          isPremium: false,
          usageCount: 0
        });
      }
      if (req.session) {
        req.session.userId = userId;
        req.session.email = user.email;
        req.session.username = username;
      }
      res.json(user);
    } catch (error) {
      console.error("Error logging in user:", error);
      res.status(500).json({ message: "Gagal login. Silakan coba lagi." });
    }
  });
  app2.post("/api/logout", async (req, res) => {
    try {
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).json({ message: "Gagal logout" });
          }
          res.json({ message: "Logout berhasil" });
        });
      } else {
        res.json({ message: "Logout berhasil" });
      }
    } catch (error) {
      console.error("Error logging out:", error);
      res.status(500).json({ message: "Gagal logout" });
    }
  });
  app2.get("/api/user", async (req, res) => {
    try {
      const session2 = req.session;
      if (!session2 || !session2.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(session2.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.post("/api/auth/firebase", async (req, res) => {
    try {
      const { id, email, firstName, lastName, profileImageUrl } = req.body;
      if (!id) {
        return res.status(400).json({ message: "User ID is required" });
      }
      console.log("Registering Firebase user:", { id, email });
      const user = await storage.upsertUser({
        id,
        email,
        firstName,
        lastName,
        profileImageUrl,
        isPremium: false,
        usageCount: 0
      });
      if (req.session) {
        req.session.userId = id;
        req.session.email = email;
      }
      res.json(user);
    } catch (error) {
      console.error("Error registering Firebase user via direct API:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });
  app2.get("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations2 = await storage.getUserConversations(userId);
      res.json(conversations2);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });
  app2.post("/api/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title } = insertConversationSchema.parse({ ...req.body, userId });
      const conversation = await storage.createConversation({ userId, title });
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });
  app2.get("/api/conversations/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages2 = await storage.getConversationMessages(conversationId);
      res.json(messages2);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  app2.delete("/api/conversations/:id", isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      await storage.deleteConversation(conversationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });
  app2.post("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!user.isPremium && (user.usageCount || 0) >= FREE_USAGE_LIMIT) {
        return res.status(403).json({
          message: "Usage limit exceeded. Please upgrade to premium for unlimited access.",
          upgradeRequired: true
        });
      }
      const { conversationId, content, fileUrl, fileName, fileType } = insertMessageSchema.parse(req.body);
      const userMessage = await storage.addMessage({
        conversationId,
        role: "user",
        content,
        fileUrl,
        fileName,
        fileType
      });
      let aiResponse;
      if (fileUrl && fileName) {
        console.log(`Analyzing uploaded file: ${fileName}, type: ${fileType}`);
        try {
          if (fileType?.startsWith("image/")) {
            const base64Image = fs.readFileSync(path.join(uploadDir, path.basename(fileUrl)), "base64");
            aiResponse = await analyzeImage(base64Image);
            console.log("Image analysis completed successfully");
          } else if (fileType?.includes("pdf")) {
            aiResponse = `## Analisis PDF: ${fileName}

Saya telah menerima dokumen PDF Anda. Berikut adalah hasil analisis:

\u2022 Jenis file: PDF Document
\u2022 Nama file: ${fileName}
\u2022 Ukuran: ${fs.statSync(path.join(uploadDir, path.basename(fileUrl))).size / 1024} KB

Dokumen ini tampaknya berisi informasi penting. Saya dapat membantu Anda mengekstrak informasi tertentu atau menjawab pertanyaan tentang kontennya. Silakan beri tahu saya apa yang ingin Anda ketahui dari dokumen ini.`;
          } else if (fileType?.includes("word") || fileName.endsWith(".doc") || fileName.endsWith(".docx")) {
            aiResponse = `## Analisis Dokumen Word: ${fileName}

Saya telah menerima dokumen Word Anda. Berikut adalah hasil analisis:

\u2022 Jenis file: Microsoft Word Document
\u2022 Nama file: ${fileName}
\u2022 Ukuran: ${fs.statSync(path.join(uploadDir, path.basename(fileUrl))).size / 1024} KB

Dokumen ini kemungkinan berisi teks terstruktur dan mungkin juga gambar atau tabel. Saya dapat membantu Anda memahami konten atau menjawab pertanyaan spesifik tentang dokumen ini.`;
          } else if (fileType?.includes("zip") || fileName.endsWith(".zip") || fileName.endsWith(".rar")) {
            aiResponse = `## Analisis File Terkompresi: ${fileName}

Saya telah menerima file terkompresi Anda. Berikut adalah hasil analisis:

\u2022 Jenis file: Compressed Archive (ZIP/RAR)
\u2022 Nama file: ${fileName}
\u2022 Ukuran: ${fs.statSync(path.join(uploadDir, path.basename(fileUrl))).size / 1024} KB

File terkompresi ini mungkin berisi beberapa file atau folder. Jika Anda ingin, saya dapat membantu menganalisis konten spesifik dari file ini jika Anda mengekstraknya terlebih dahulu.`;
          } else if (fileType?.includes("android") || fileName.endsWith(".apk")) {
            aiResponse = `## Analisis APK: ${fileName}

Saya telah menerima file APK Android Anda. Berikut adalah hasil analisis:

\u2022 Jenis file: Android Application Package (APK)
\u2022 Nama file: ${fileName}
\u2022 Ukuran: ${fs.statSync(path.join(uploadDir, path.basename(fileUrl))).size / 1024} KB

File APK ini adalah paket aplikasi Android. Saya dapat membantu Anda menganalisis informasi dasar tentang aplikasi ini, seperti memeriksa apakah file ini aman atau melihat perkiraan fitur-fiturnya.`;
          } else if (fileType?.includes("audio") || fileName.match(/\.(mp3|wav|ogg|m4a)$/i)) {
            aiResponse = `## Analisis File Audio: ${fileName}

Saya telah menerima file audio Anda. Berikut adalah hasil analisis:

\u2022 Jenis file: Audio File (${fileType})
\u2022 Nama file: ${fileName}
\u2022 Ukuran: ${fs.statSync(path.join(uploadDir, path.basename(fileUrl))).size / 1024} KB

Ini adalah file audio yang dapat berisi musik, podcast, atau rekaman suara. Jika Anda ingin saya menganalisis kontennya lebih lanjut, silakan beri tahu saya detailnya.`;
          } else if (fileType?.includes("video") || fileName.match(/\.(mp4|mov|avi|mkv)$/i)) {
            aiResponse = `## Analisis File Video: ${fileName}

Saya telah menerima file video Anda. Berikut adalah hasil analisis:

\u2022 Jenis file: Video File (${fileType})
\u2022 Nama file: ${fileName}
\u2022 Ukuran: ${fs.statSync(path.join(uploadDir, path.basename(fileUrl))).size / 1024} KB

Ini adalah file video yang dapat berisi rekaman, film, atau konten visual lainnya. Untuk analisis lebih mendalam, saya memerlukan informasi tambahan tentang konten videonya.`;
          } else if (fileType?.includes("text") || fileName.match(/\.(txt|csv|json|xml|html|css|js|py|java|php)$/i)) {
            const fileContent = fs.readFileSync(path.join(uploadDir, path.basename(fileUrl)), "utf8");
            const previewContent = fileContent.length > 500 ? fileContent.substring(0, 500) + "..." : fileContent;
            aiResponse = `## Analisis File Teks/Kode: ${fileName}

Saya telah menerima file teks Anda. Berikut adalah hasil analisis:

\u2022 Jenis file: Text/Code File (${fileType})
\u2022 Nama file: ${fileName}
\u2022 Ukuran: ${fs.statSync(path.join(uploadDir, path.basename(fileUrl))).size / 1024} KB
\u2022 Jumlah karakter: ${fileContent.length}

### Preview konten:

\`\`\`
${previewContent}
\`\`\`

Saya dapat membantu Anda memahami konten file ini atau menjawab pertanyaan spesifik tentangnya.`;
          } else {
            aiResponse = `## Analisis File: ${fileName}

Saya telah menerima file Anda. Berikut adalah informasi dasarnya:

\u2022 Jenis file: ${fileType || "Unknown"}
\u2022 Nama file: ${fileName}
\u2022 Ukuran: ${fs.statSync(path.join(uploadDir, path.basename(fileUrl))).size / 1024} KB

Saya tidak dapat menganalisis isi file ini secara detail karena format atau jenisnya. Namun, jika Anda memiliki pertanyaan spesifik tentang file ini, silakan beri tahu saya.`;
          }
        } catch (analysisError) {
          console.error("Error analyzing file:", analysisError);
          aiResponse = `Saya menerima file Anda (${fileName}), tetapi tidak dapat menganalisisnya secara mendetail. Silakan ajukan pertanyaan spesifik tentang file ini jika Anda membutuhkan bantuan.`;
        }
      } else {
        aiResponse = await generateAIResponse(content);
      }
      const aiMessage = await storage.addMessage({
        conversationId,
        role: "assistant",
        content: aiResponse
      });
      if (!user.isPremium) {
        await storage.incrementUserUsage(userId);
      }
      res.json({ userMessage, aiMessage });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });
  app2.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      let userId = "demo-user";
      try {
        if (req.user && req.user.claims && req.user.claims.sub) {
          userId = req.user.claims.sub;
        }
      } catch (error) {
        console.log("Using demo user for upload");
      }
      const { filename, originalname, mimetype, size, path: filePath } = req.file;
      console.log("File uploaded successfully:", {
        filename,
        originalname,
        mimetype,
        size
      });
      let uploadedFile;
      try {
        uploadedFile = await storage.addUploadedFile({
          userId,
          fileName: filename,
          originalName: originalname,
          fileType: mimetype,
          fileSize: size,
          filePath
        });
      } catch (dbError) {
        console.error("Database error during upload, using demo data:", dbError);
        uploadedFile = {
          id: Math.floor(Math.random() * 1e4),
          userId,
          fileName: filename,
          originalName: originalname,
          fileType: mimetype,
          fileSize: size,
          filePath,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      res.json({
        id: uploadedFile.id,
        fileName: uploadedFile.fileName,
        originalName: uploadedFile.originalName,
        fileType: uploadedFile.fileType,
        fileSize: uploadedFile.fileSize,
        url: `/uploads/${filename}`
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file", error: error.message });
    }
  });
  app2.get("/api/files", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const files = await storage.getUserFiles(userId);
      const filesWithUrls = files.map((file) => ({
        ...file,
        url: `/uploads/${file.fileName}`
      }));
      res.json(filesWithUrls);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });
  app2.post("/api/payments", async (req, res) => {
    try {
      let userId = "demo-user";
      try {
        if (req.user && req.user.claims && req.user.claims.sub) {
          userId = req.user.claims.sub;
        }
      } catch (error) {
        console.log("Using demo user for payment");
      }
      const { amount, paymentMethod } = req.body;
      if (!amount || !paymentMethod) {
        return res.status(400).json({ message: "Amount and payment method are required" });
      }
      let payment;
      try {
        payment = await storage.addPayment({
          userId,
          amount,
          paymentMethod,
          paymentStatus: "pending"
        });
      } catch (dbError) {
        console.error("Database error during payment creation, using demo data:", dbError);
        payment = {
          id: Math.floor(Math.random() * 1e4),
          userId,
          amount,
          paymentMethod,
          paymentStatus: "pending",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      let paymentUrl = "";
      if (paymentMethod === "dana") {
        paymentUrl = `dana://pay?amount=${amount}&to=08881382817&reference=${payment.id}`;
      } else if (paymentMethod === "gopay") {
        paymentUrl = `gojek://gopay/pay?amount=${amount}&to=083824299082&reference=${payment.id}`;
      }
      console.log(`Payment created: ${paymentMethod} payment for ${amount}, ID: ${payment.id}`);
      console.log(`Payment URL generated: ${paymentUrl}`);
      res.json({
        payment,
        paymentUrl,
        // Also provide app store links as fallback
        appStoreUrl: paymentMethod === "dana" ? "https://play.google.com/store/apps/details?id=id.dana" : "https://play.google.com/store/apps/details?id=com.gojek.app"
      });
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Failed to create payment", error: error.message });
    }
  });
  app2.post("/api/payments/:id/confirm", async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const { transactionId } = req.body;
      let userId = "demo-user";
      try {
        if (req.user && req.user.claims && req.user.claims.sub) {
          userId = req.user.claims.sub;
        }
      } catch (error) {
        console.log("Using demo user for payment confirmation");
      }
      try {
        await storage.updatePaymentStatus(paymentId, "completed", transactionId);
        const payments2 = await storage.getUserPayments(userId);
        const payment = payments2.find((p) => p.id === paymentId);
        if (payment) {
          await storage.upgradeToPremium(payment.userId);
        }
      } catch (dbError) {
        console.error("Database error during payment confirmation:", dbError);
      }
      res.json({
        success: true,
        message: "Pembayaran berhasil dikonfirmasi",
        premium: true,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({
        message: "Failed to confirm payment",
        error: error.message || "Unknown error"
      });
    }
  });
  app2.get("/api/payments/:id/status", async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      let userId = "demo-user";
      try {
        if (req.user && req.user.claims && req.user.claims.sub) {
          userId = req.user.claims.sub;
        }
      } catch (error) {
        console.log("Using demo user for payment status check");
      }
      let payment;
      try {
        const payments2 = await storage.getUserPayments(userId);
        payment = payments2.find((p) => p.id === paymentId);
      } catch (dbError) {
        console.error("Database error during payment status check:", dbError);
        payment = {
          id: paymentId,
          userId,
          amount: 25e3,
          paymentMethod: "dana",
          // Default to dana
          paymentStatus: "pending",
          createdAt: new Date(Date.now() - 6e4).toISOString()
          // 1 minute ago
        };
      }
      if (!payment) {
        payment = {
          id: paymentId,
          userId,
          amount: 25e3,
          paymentMethod: "dana",
          paymentStatus: "pending",
          createdAt: new Date(Date.now() - 6e4).toISOString()
        };
      }
      const secsSinceCreation = Math.floor(
        ((/* @__PURE__ */ new Date()).getTime() - new Date(payment.createdAt || /* @__PURE__ */ new Date()).getTime()) / 1e3
      );
      let status = payment.paymentStatus;
      if (secsSinceCreation < 10) {
        status = "pending";
      } else if (secsSinceCreation < 20) {
        status = "processing";
      } else {
        const shouldSucceed = paymentId % 10 <= 6;
        status = shouldSucceed ? "completed" : "failed";
        try {
          await storage.updatePaymentStatus(paymentId, status);
          if (status === "completed") {
            await storage.upgradeToPremium(userId);
          }
        } catch (updateError) {
          console.error("Error updating payment status in DB:", updateError);
        }
      }
      res.json({
        status,
        paymentId: payment.id,
        paymentMethod: payment.paymentMethod,
        amount: payment.amount,
        elapsed: secsSinceCreation,
        statusDetails: getStatusDetails(status),
        transactionReference: `PLANKDEV-${payment.id}-${Date.now().toString().substr(-6)}`
      });
    } catch (error) {
      console.error("Error checking payment status:", error);
      res.status(500).json({
        message: "Failed to check payment status",
        error: error.message || "Unknown error"
      });
    }
  });
  function getStatusDetails(status) {
    switch (status) {
      case "pending":
        return {
          message: "Menunggu pembayaran dari pengguna",
          description: "Silakan selesaikan pembayaran di aplikasi e-wallet"
        };
      case "processing":
        return {
          message: "Memproses pembayaran",
          description: "Transaksi Anda sedang diproses, mohon tunggu sebentar"
        };
      case "completed":
        return {
          message: "Pembayaran berhasil",
          description: "Akun Anda telah diupgrade ke versi Pro"
        };
      case "failed":
        return {
          message: "Pembayaran gagal",
          description: "Terjadi kesalahan dalam proses pembayaran. Silakan coba lagi"
        };
      default:
        return {
          message: "Status tidak diketahui",
          description: "Silakan hubungi dukungan jika masalah berlanjut"
        };
    }
  }
  app2.get("/api/payments", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const payments2 = await storage.getUserPayments(userId);
      res.json(payments2);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });
  app2.get("/api/usage", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        usageCount: user.usageCount || 0,
        limit: user.isPremium ? null : FREE_USAGE_LIMIT,
        isPremium: user.isPremium
      });
    } catch (error) {
      console.error("Error fetching usage:", error);
      res.status(500).json({ message: "Failed to fetch usage" });
    }
  });
  app2.post("/api/ai/chat", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
      const aiResponse = await generateAIResponse(message);
      res.json({ response: aiResponse });
    } catch (error) {
      console.error("AI Chat error:", error);
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = "plank-dev-secret-key-2024-super-secure";
}
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
