import {
  users,
  conversations,
  messages,
  uploadedFiles,
  payments,
  type User,
  type UpsertUser,
  type Conversation,
  type Message,
  type UploadedFile,
  type Payment,
  type InsertConversation,
  type InsertMessage,
  type InsertFile,
  type InsertPayment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Usage tracking
  incrementUserUsage(userId: string): Promise<void>;
  resetUserUsage(userId: string): Promise<void>;
  upgradeToPremium(userId: string): Promise<void>;
  
  // Conversation operations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getUserConversations(userId: string): Promise<Conversation[]>;
  getConversation(id: number): Promise<Conversation | undefined>;
  updateConversationTitle(id: number, title: string): Promise<void>;
  deleteConversation(id: number): Promise<void>;
  
  // Message operations
  addMessage(message: InsertMessage): Promise<Message>;
  getConversationMessages(conversationId: number): Promise<Message[]>;
  deleteMessage(id: number): Promise<void>;
  
  // File operations
  addUploadedFile(file: InsertFile): Promise<UploadedFile>;
  getUserFiles(userId: string): Promise<UploadedFile[]>;
  getFile(id: number): Promise<UploadedFile | undefined>;
  deleteFile(id: number): Promise<void>;
  
  // Payment operations
  addPayment(payment: InsertPayment): Promise<Payment>;
  getUserPayments(userId: string): Promise<Payment[]>;
  updatePaymentStatus(id: number, status: string, transactionId?: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Usage tracking
  async incrementUserUsage(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        usageCount: eq(users.usageCount, null) ? 1 : users.usageCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async resetUserUsage(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        usageCount: 0,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async upgradeToPremium(userId: string): Promise<void> {
    await db
      .update(users)
      .set({
        isPremium: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Conversation operations
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db
      .insert(conversations)
      .values(conversation)
      .returning();
    return newConversation;
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation;
  }

  async updateConversationTitle(id: number, title: string): Promise<void> {
    await db
      .update(conversations)
      .set({ title, updatedAt: new Date() })
      .where(eq(conversations.id, id));
  }

  async deleteConversation(id: number): Promise<void> {
    // Delete messages first
    await db.delete(messages).where(eq(messages.conversationId, id));
    // Then delete conversation
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  // Message operations
  async addMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getConversationMessages(conversationId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async deleteMessage(id: number): Promise<void> {
    await db.delete(messages).where(eq(messages.id, id));
  }

  // File operations
  async addUploadedFile(file: InsertFile): Promise<UploadedFile> {
    const [newFile] = await db
      .insert(uploadedFiles)
      .values(file)
      .returning();
    return newFile;
  }

  async getUserFiles(userId: string): Promise<UploadedFile[]> {
    return await db
      .select()
      .from(uploadedFiles)
      .where(eq(uploadedFiles.userId, userId))
      .orderBy(desc(uploadedFiles.createdAt));
  }

  async getFile(id: number): Promise<UploadedFile | undefined> {
    const [file] = await db
      .select()
      .from(uploadedFiles)
      .where(eq(uploadedFiles.id, id));
    return file;
  }

  async deleteFile(id: number): Promise<void> {
    await db.delete(uploadedFiles).where(eq(uploadedFiles.id, id));
  }

  // Payment operations
  async addPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async getUserPayments(userId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  async updatePaymentStatus(id: number, status: string, transactionId?: string): Promise<void> {
    await db
      .update(payments)
      .set({ 
        paymentStatus: status,
        ...(transactionId && { transactionId })
      })
      .where(eq(payments.id, id));
  }
}

export const storage = new DatabaseStorage();
