import type { Express } from "express";
import { createServer, type Server } from "http";
import { supabase, uploadBase64Image } from "./supabase";
import { generateTryOnImage } from "./gemini";
import { toCamelCase } from "./utils";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { requireAuth, requireRole, type AuthenticatedRequest } from "./authMiddleware";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

function sanitizeString(str: string | undefined, maxLength: number = 500): string {
  if (!str) return "";
  return str.trim().slice(0, maxLength);
}

function sanitizeUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return url.slice(0, 2000);
  } catch {
    return null;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/config", (req, res) => {
    res.json({
      supabaseUrl: process.env.SUPABASE_URL || "",
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
    });
  });

  app.get("/api/products", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`*, store:stores(*)`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      res.json(toCamelCase(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const { storeId, name, description, imageUrl, productUrl, category, size, color, style } = req.body;

      if (!storeId || !isValidUUID(storeId)) {
        return res.status(400).json({ error: "ID de loja inválido" });
      }
      if (!name || name.trim().length < 2) {
        return res.status(400).json({ error: "Nome do produto é obrigatório" });
      }
      if (!imageUrl) {
        return res.status(400).json({ error: "Imagem do produto é obrigatória" });
      }

      const { data, error } = await supabase
        .from("products")
        .insert({
          store_id: storeId,
          name: sanitizeString(name, 200),
          description: sanitizeString(description, 1000),
          image_url: imageUrl,
          product_url: sanitizeUrl(productUrl),
          category: sanitizeString(category, 100),
          size: sanitizeString(size, 50),
          color: sanitizeString(color, 50),
          style: sanitizeString(style, 100),
        })
        .select()
        .single();

      if (error) throw error;
      res.json(toCamelCase(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.patch("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, imageUrl, productUrl, category, size, color, style } = req.body;

      const updateData: Record<string, unknown> = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (imageUrl) updateData.image_url = imageUrl;
      if (productUrl !== undefined) updateData.product_url = productUrl;
      if (category !== undefined) updateData.category = category;
      if (size !== undefined) updateData.size = size;
      if (color !== undefined) updateData.color = color;
      if (style !== undefined) updateData.style = style;

      const { data, error } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      res.json(toCamelCase(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const { error } = await supabase.from("products").delete().eq("id", id);

      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  app.post("/api/upload-profile-photo", async (req, res) => {
    try {
      const { userId, imageUrl } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      if (!imageUrl) {
        return res.status(400).json({ error: "URL da imagem é obrigatória" });
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("credits")
        .eq("id", userId)
        .single();

      if (userError || !userData) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const PROFILE_PHOTO_COST = 5;

      if (userData.credits < PROFILE_PHOTO_COST) {
        return res.status(402).json({ 
          error: `Créditos insuficientes. Você precisa de ${PROFILE_PHOTO_COST} créditos para enviar uma foto de perfil.`,
          required: PROFILE_PHOTO_COST,
          current: userData.credits
        });
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({ 
          profile_image_url: imageUrl,
          credits: userData.credits - PROFILE_PHOTO_COST 
        })
        .eq("id", userId);

      if (updateError) {
        throw updateError;
      }

      res.json({ 
        success: true, 
        creditsRemaining: userData.credits - PROFILE_PHOTO_COST,
        profileImageUrl: imageUrl
      });
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      res.status(500).json({ error: "Falha ao salvar foto de perfil" });
    }
  });

  app.post("/api/stores", async (req, res) => {
    try {
      const { userId, name, description, logoUrl, websiteUrl } = req.body;

      const { data, error } = await supabase
        .from("stores")
        .insert({
          user_id: userId,
          name,
          description,
          logo_url: logoUrl,
          website_url: websiteUrl,
        })
        .select()
        .single();

      if (error) throw error;
      res.json(toCamelCase(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to create store" });
    }
  });

  app.patch("/api/stores/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, logoUrl, websiteUrl } = req.body;

      const updateData: Record<string, unknown> = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (logoUrl) updateData.logo_url = logoUrl;
      if (websiteUrl !== undefined) updateData.website_url = websiteUrl;

      const { data, error } = await supabase
        .from("stores")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      res.json(toCamelCase(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to update store" });
    }
  });

  app.get("/api/prompts", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      res.json(toCamelCase(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prompts" });
    }
  });

  app.post("/api/prompts", async (req, res) => {
    try {
      const { name, content, isActive } = req.body;

      const { data, error } = await supabase
        .from("prompts")
        .insert({
          name,
          content,
          is_active: isActive ?? false,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating prompt:", error);
        throw error;
      }
      res.json(toCamelCase(data));
    } catch (error) {
      console.error("Failed to create prompt:", error);
      res.status(500).json({ error: "Failed to create prompt" });
    }
  });

  app.patch("/api/prompts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, content, isActive } = req.body;

      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (name !== undefined) updateData.name = name;
      if (content !== undefined) updateData.content = content;
      if (isActive !== undefined) updateData.is_active = isActive;

      const { data, error } = await supabase
        .from("prompts")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      res.json(toCamelCase(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to update prompt" });
    }
  });

  app.delete("/api/prompts/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const { error } = await supabase.from("prompts").delete().eq("id", id);

      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete prompt" });
    }
  });

  app.post("/api/generate-try-on", async (req, res) => {
    try {
      const { productId, userId, userImageUrl } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("credits")
        .eq("id", userId)
        .single();

      if (userError || !userData) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      if (userData.credits < 1) {
        return res.status(402).json({ error: "Créditos insuficientes. Compre mais créditos para continuar." });
      }

      const { data: product, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (productError || !product) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      const { data: promptData } = await supabase
        .from("prompts")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const defaultPrompt = `Generate a realistic image of the person in the first image wearing the clothing shown in the second image. 
Keep the person's face, body shape, and pose consistent. 
The clothing should fit naturally on the person's body.
Maintain the same background and lighting from the original photo.
The result should look like a real photograph, not a composite.`;

      const prompt = promptData?.content || defaultPrompt;

      const generatedBase64 = await generateTryOnImage(
        userImageUrl,
        product.image_url,
        prompt
      );

      const imagePath = `generated/${userId}/${Date.now()}.png`;
      const imageUrl = await uploadBase64Image(generatedBase64, "images", imagePath);

      if (!imageUrl) {
        throw new Error("Failed to upload generated image");
      }

      await supabase
        .from("users")
        .update({ credits: userData.credits - 1 })
        .eq("id", userId);

      await supabase.from("generated_images").insert({
        user_id: userId,
        product_id: productId,
        original_image_url: userImageUrl,
        generated_image_url: imageUrl,
        prompt_used: prompt,
      });

      res.json({ imageUrl, creditsRemaining: userData.credits - 1 });
    } catch (error) {
      console.error("Error generating try-on:", error);
      res.status(500).json({ error: "Falha ao gerar imagem" });
    }
  });

  app.post("/api/generate-try-on-local", async (req, res) => {
    try {
      const { clothingImageUrl, userId, userImageUrl } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      if (!clothingImageUrl) {
        return res.status(400).json({ error: "URL da roupa é obrigatória" });
      }

      if (!userImageUrl) {
        return res.status(400).json({ error: "URL da foto de perfil é obrigatória" });
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("credits")
        .eq("id", userId)
        .single();

      if (userError || !userData) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      if (userData.credits < 1) {
        return res.status(402).json({ error: "Créditos insuficientes. Compre mais créditos para continuar." });
      }

      const { data: promptData } = await supabase
        .from("prompts")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const defaultPrompt = `Generate a realistic image of the person in the first image wearing the clothing shown in the second image. 
Keep the person's face, body shape, and pose consistent. 
The clothing should fit naturally on the person's body.
Maintain the same background and lighting from the original photo.
The result should look like a real photograph, not a composite.`;

      const prompt = promptData?.content || defaultPrompt;

      const generatedBase64 = await generateTryOnImage(
        userImageUrl,
        clothingImageUrl,
        prompt
      );

      const imagePath = `generated/${userId}/${Date.now()}.png`;
      const imageUrl = await uploadBase64Image(generatedBase64, "images", imagePath);

      if (!imageUrl) {
        throw new Error("Failed to upload generated image");
      }

      await supabase
        .from("users")
        .update({ credits: userData.credits - 1 })
        .eq("id", userId);

      await supabase.from("generated_images").insert({
        user_id: userId,
        product_id: null,
        original_image_url: userImageUrl,
        generated_image_url: imageUrl,
        prompt_used: prompt,
      });

      res.json({ imageUrl, creditsRemaining: userData.credits - 1 });
    } catch (error) {
      console.error("Error generating try-on (local):", error);
      res.status(500).json({ error: "Falha ao gerar imagem" });
    }
  });

  app.get("/api/generated-images/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      const { data, error } = await supabase
        .from("generated_images")
        .select(`*, product:products(*)`)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      res.json(toCamelCase(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch generated images" });
    }
  });

  app.get("/api/credit-packages", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("credit_packages")
        .select("*")
        .eq("is_active", true)
        .order("price_in_cents", { ascending: true });

      if (error) throw error;
      res.json(toCamelCase(data));
    } catch (error) {
      res.status(500).json({ error: "Falha ao buscar pacotes de créditos" });
    }
  });

  app.get("/api/user-credits/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      const { data, error } = await supabase
        .from("users")
        .select("credits")
        .eq("id", userId)
        .single();

      if (error) throw error;
      res.json({ credits: data?.credits || 0 });
    } catch (error) {
      res.status(500).json({ error: "Falha ao buscar créditos" });
    }
  });

  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error getting Stripe publishable key:", error);
      res.status(500).json({ error: "Stripe não configurado" });
    }
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { packageId, userId } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { data: pkg, error: pkgError } = await supabase
        .from("credit_packages")
        .select("*")
        .eq("id", packageId)
        .single();

      if (pkgError || !pkg) {
        return res.status(404).json({ error: "Pacote não encontrado" });
      }

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("email, stripe_customer_id")
        .eq("id", userId)
        .single();

      if (userError || !user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const stripe = await getUncachableStripeClient();

      let customerId = user.stripe_customer_id;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId },
        });
        customerId = customer.id;

        await supabase
          .from("users")
          .update({ stripe_customer_id: customerId })
          .eq("id", userId);
      }

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "brl",
              product_data: {
                name: pkg.name,
                description: `${pkg.credits} créditos para o provador virtual`,
              },
              unit_amount: pkg.price_in_cents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${baseUrl}/client?payment=success`,
        cancel_url: `${baseUrl}/client?payment=cancelled`,
        metadata: {
          userId,
          packageId,
          credits: pkg.credits.toString(),
        },
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Falha ao criar sessão de pagamento" });
    }
  });

  app.get("/api/purchase-history/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      const { data, error } = await supabase
        .from("credit_purchases")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      res.json(toCamelCase(data));
    } catch (error) {
      res.status(500).json({ error: "Falha ao buscar histórico de compras" });
    }
  });

  // ============================================
  // ROTAS DE ADMIN
  // ============================================

  // Listar todos os usuários (admin only)
  app.get("/api/admin/users", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      res.json(toCamelCase(data));
    } catch (error) {
      res.status(500).json({ error: "Falha ao buscar usuários" });
    }
  });

  // Atualizar usuário (admin only)
  app.patch("/api/admin/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!isValidUUID(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const { name, role, credits } = req.body;
      const updateData: Record<string, unknown> = {};
      
      if (name !== undefined) updateData.name = sanitizeString(name, 200);
      if (role !== undefined && ["client", "store", "admin"].includes(role)) {
        updateData.role = role;
      }
      if (credits !== undefined && typeof credits === "number" && credits >= 0) {
        updateData.credits = credits;
      }

      const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      res.json(toCamelCase(data));
    } catch (error) {
      res.status(500).json({ error: "Falha ao atualizar usuário" });
    }
  });

  // Deletar usuário (admin only)
  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!isValidUUID(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", id);

      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Falha ao deletar usuário" });
    }
  });

  // Ajustar créditos de usuário (admin only)
  app.post("/api/admin/users/:id/credits", async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, reason } = req.body;

      if (!isValidUUID(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      if (typeof amount !== "number") {
        return res.status(400).json({ error: "Quantidade inválida" });
      }

      // Buscar usuário atual
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("credits")
        .eq("id", id)
        .single();

      if (userError || !user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const newCredits = Math.max(0, user.credits + amount);

      // Atualizar créditos
      const { data, error } = await supabase
        .from("users")
        .update({ credits: newCredits })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Registrar a ação (se for adição manual, criar registro de compra)
      if (amount > 0) {
        await supabase.from("credit_purchases").insert({
          user_id: id,
          credits: amount,
          amount_paid: 0,
          status: "completed",
          stripe_session_id: `manual_${Date.now()}`,
        });
      }

      res.json(toCamelCase(data));
    } catch (error) {
      res.status(500).json({ error: "Falha ao ajustar créditos" });
    }
  });

  // Listar todas as lojas (admin only)
  app.get("/api/admin/stores", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("*, user:users(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      res.json(toCamelCase(data));
    } catch (error) {
      res.status(500).json({ error: "Falha ao buscar lojas" });
    }
  });

  // Deletar loja (admin only)
  app.delete("/api/admin/stores/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!isValidUUID(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const { error } = await supabase
        .from("stores")
        .delete()
        .eq("id", id);

      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Falha ao deletar loja" });
    }
  });

  // Listar todos os produtos (admin only)
  app.get("/api/admin/products", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*, store:stores(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      res.json(toCamelCase(data));
    } catch (error) {
      res.status(500).json({ error: "Falha ao buscar produtos" });
    }
  });

  // Deletar produto (admin only)
  app.delete("/api/admin/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!isValidUUID(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Falha ao deletar produto" });
    }
  });

  // Atualizar pacote de créditos (admin only)
  app.patch("/api/admin/credit-packages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!isValidUUID(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const { name, credits, priceInCents, description, isActive } = req.body;
      const updateData: Record<string, unknown> = {};
      
      if (name !== undefined) updateData.name = sanitizeString(name, 200);
      if (credits !== undefined && typeof credits === "number" && credits > 0) {
        updateData.credits = credits;
      }
      if (priceInCents !== undefined && typeof priceInCents === "number" && priceInCents > 0) {
        updateData.price_in_cents = priceInCents;
      }
      if (description !== undefined) updateData.description = sanitizeString(description, 500);
      if (isActive !== undefined) updateData.is_active = isActive;

      const { data, error } = await supabase
        .from("credit_packages")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      res.json(toCamelCase(data));
    } catch (error) {
      res.status(500).json({ error: "Falha ao atualizar pacote" });
    }
  });

  // Criar novo pacote de créditos (admin only)
  app.post("/api/admin/credit-packages", async (req, res) => {
    try {
      const { name, credits, priceInCents, description } = req.body;

      if (!name || !credits || !priceInCents) {
        return res.status(400).json({ error: "Nome, créditos e preço são obrigatórios" });
      }

      const { data, error } = await supabase
        .from("credit_packages")
        .insert({
          name: sanitizeString(name, 200),
          credits,
          price_in_cents: priceInCents,
          description: sanitizeString(description, 500),
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      res.json(toCamelCase(data));
    } catch (error) {
      res.status(500).json({ error: "Falha ao criar pacote" });
    }
  });

  // Deletar pacote de créditos (admin only)
  app.delete("/api/admin/credit-packages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!isValidUUID(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const { error } = await supabase
        .from("credit_packages")
        .delete()
        .eq("id", id);

      if (error) throw error;
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Falha ao deletar pacote" });
    }
  });

  // Estatísticas gerais (admin only)
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const [usersResult, storesResult, productsResult, imagesResult] = await Promise.all([
        supabase.from("users").select("id, credits, role", { count: "exact" }),
        supabase.from("stores").select("id", { count: "exact" }),
        supabase.from("products").select("id", { count: "exact" }),
        supabase.from("generated_images").select("id", { count: "exact" }),
      ]);

      const users = usersResult.data || [];
      const totalCredits = users.reduce((sum, u) => sum + (u.credits || 0), 0);
      const clientCount = users.filter(u => u.role === "client").length;
      const storeCount = users.filter(u => u.role === "store").length;
      const adminCount = users.filter(u => u.role === "admin").length;

      res.json({
        totalUsers: usersResult.count || 0,
        clientCount,
        storeCount,
        adminCount,
        totalStores: storesResult.count || 0,
        totalProducts: productsResult.count || 0,
        totalGeneratedImages: imagesResult.count || 0,
        totalCreditsInCirculation: totalCredits,
      });
    } catch (error) {
      res.status(500).json({ error: "Falha ao buscar estatísticas" });
    }
  });

  return httpServer;
}
