export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  isPremium?: boolean;
  usageCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Conversation {
  id: number;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Message {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant';
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  createdAt: string;
}

export interface UploadedFile {
  id: number;
  userId: string;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  url?: string;
  createdAt: string;
}

export interface Payment {
  id: number;
  userId: string;
  amount: number;
  paymentMethod: 'dana' | 'gopay';
  paymentStatus: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  createdAt: string;
}

export interface Usage {
  usageCount: number;
  limit: number | null;
  isPremium: boolean;
}
