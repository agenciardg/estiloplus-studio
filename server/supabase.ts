import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadBase64Image(
  base64Data: string,
  bucket: string,
  path: string
): Promise<string | null> {
  try {
    const base64Match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
    if (!base64Match) {
      throw new Error("Invalid base64 data");
    }

    const mimeType = base64Match[1];
    const base64 = base64Match[2];
    const buffer = Buffer.from(base64, "base64");

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: mimeType,
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Error uploading to Supabase:", error);
      return null;
    }

    const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return publicUrl.publicUrl;
  } catch (error) {
    console.error("Error uploading base64 image:", error);
    return null;
  }
}
