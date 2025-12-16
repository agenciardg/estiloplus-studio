import { z } from "zod";

export const UserRole = {
  CLIENT: "client",
  STORE: "store",
  ADMIN: "admin",
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRoleType;
  profileImageUrl?: string;
  credits: number;
  stripeCustomerId?: string;
  createdAt: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceInCents: number;
  stripePriceId?: string;
  isActive: boolean;
}

export interface CreditPurchase {
  id: string;
  userId: string;
  credits: number;
  amountPaid: number;
  stripePaymentIntentId: string;
  createdAt: string;
}

export interface Store {
  id: string;
  userId: string;
  name: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  imageUrl: string;
  productUrl?: string;
  category?: string;
  size?: string;
  color?: string;
  style?: string;
  createdAt: string;
}

export interface GeneratedImage {
  id: string;
  userId: string;
  productId: string;
  originalImageUrl: string;
  generatedImageUrl: string;
  promptUsed: string;
  createdAt: string;
}

export interface Prompt {
  id: string;
  name: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const insertUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  role: z.enum(["client", "store", "admin"]).default("client"),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const insertStoreSchema = z.object({
  name: z.string().min(2, "Nome da loja deve ter no mínimo 2 caracteres"),
  description: z.string().optional(),
  websiteUrl: z.string().url("URL inválida").optional().or(z.literal("")),
});

export const insertProductSchema = z.object({
  name: z.string().min(2, "Nome do produto deve ter no mínimo 2 caracteres"),
  description: z.string().optional(),
  productUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  category: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  style: z.string().optional(),
});

export const insertPromptSchema = z.object({
  name: z.string().min(2, "Nome do prompt deve ter no mínimo 2 caracteres"),
  content: z.string().min(10, "Conteúdo deve ter no mínimo 10 caracteres"),
  isActive: z.boolean().default(true),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertPrompt = z.infer<typeof insertPromptSchema>;
