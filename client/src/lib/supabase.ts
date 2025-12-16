import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let initPromise: Promise<SupabaseClient> | null = null;

async function initSupabase(): Promise<SupabaseClient> {
  const response = await fetch('/api/config');
  const config = await response.json();
  
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error('Supabase configuration not available');
  }
  
  return createClient(config.supabaseUrl, config.supabaseAnonKey);
}

export async function getSupabase(): Promise<SupabaseClient> {
  if (supabaseInstance) return supabaseInstance;
  
  if (!initPromise) {
    initPromise = initSupabase().then(client => {
      supabaseInstance = client;
      return client;
    });
  }
  
  return initPromise;
}

export async function uploadImage(file: File, bucket: string, path: string): Promise<string | null> {
  const supabase = await getSupabase();
  
  console.log('Uploading image to bucket:', bucket, 'path:', path);
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Error uploading image:', error);
    console.error('Upload error details:', JSON.stringify(error, null, 2));
    throw new Error(`Erro ao fazer upload: ${error.message}`);
  }

  console.log('Upload successful, getting public URL for path:', data.path);

  const { data: publicUrl } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  console.log('Public URL:', publicUrl.publicUrl);

  return publicUrl.publicUrl;
}

export async function deleteImage(bucket: string, path: string): Promise<boolean> {
  const supabase = await getSupabase();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  return !error;
}
