import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token de autenticação não fornecido" });
    }

    const token = authHeader.split(" ")[1];
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return res.status(401).json({ error: "Token inválido ou expirado" });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    req.userId = user.id;
    req.userRole = userData?.role || "client";

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ error: "Falha na autenticação" });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    await requireAuth(req, res, () => {
      if (!req.userRole || !allowedRoles.includes(req.userRole)) {
        return res.status(403).json({ error: "Acesso não autorizado" });
      }
      next();
    });
  };
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  return requireRole("admin")(req, res, next);
}

export function requireStoreOwner(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  return requireRole("store", "admin")(req, res, next);
}
