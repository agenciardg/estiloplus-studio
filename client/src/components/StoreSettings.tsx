import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getSupabase, uploadImage } from "@/lib/supabase";
import { toCamelCase } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { insertStoreSchema, type InsertStore, type Store } from "@shared/schema";
import { Settings, Upload, Loader2, Store as StoreIcon, ExternalLink } from "lucide-react";

export default function StoreSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: store, isLoading } = useQuery({
    queryKey: ["/api/store", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) return null;
      return toCamelCase<Store>(data);
    },
    enabled: !!user,
  });

  const form = useForm<InsertStore>({
    resolver: zodResolver(insertStoreSchema),
    defaultValues: {
      name: store?.name || "",
      description: store?.description || "",
      websiteUrl: store?.websiteUrl || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertStore & { logoUrl?: string }) => {
      return await apiRequest("POST", "/api/stores", { ...data, userId: user?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store", user?.id] });
      toast({ title: "Loja configurada!", description: "Suas configurações foram salvas." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível salvar.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertStore & { logoUrl?: string }) => {
      return await apiRequest("PATCH", `/api/stores/${store?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store", user?.id] });
      toast({ title: "Configurações atualizadas!", description: "Suas alterações foram salvas." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível atualizar.", variant: "destructive" });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  async function onSubmit(data: InsertStore) {
    if (!user) return;

    setIsUploading(true);
    try {
      let logoUrl = store?.logoUrl || "";

      if (logoFile) {
        const path = `stores/${user.id}/logo-${Date.now()}.jpg`;
        const uploadedUrl = await uploadImage(logoFile, "images", path);
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
        }
      }

      if (store) {
        updateMutation.mutate({ ...data, logoUrl });
      } else {
        createMutation.mutate({ ...data, logoUrl });
      }
    } catch (error) {
      toast({ title: "Erro no upload", description: "Não foi possível enviar o logo.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      setLogoFile(null);
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Carregando...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Configurações da Loja
        </CardTitle>
        <CardDescription>
          {store ? "Atualize as informações da sua loja" : "Configure sua loja para começar a adicionar produtos"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center gap-6">
              <div {...getRootProps()} className="cursor-pointer">
                <input {...getInputProps()} data-testid="input-logo" />
                <Avatar className="h-24 w-24">
                  <AvatarImage src={logoPreview || store?.logoUrl} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {store?.name ? getInitials(store.name) : <StoreIcon className="h-8 w-8" />}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-1">Logo da Loja</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Clique no avatar para alterar
                </p>
                <Button type="button" variant="outline" size="sm" {...getRootProps()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar Logo
                </Button>
              </div>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Loja</FormLabel>
                  <FormControl>
                    <Input placeholder="Minha Loja Plus Size" data-testid="input-store-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva sua loja e o tipo de produtos que oferece..."
                      data-testid="input-store-description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="websiteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="https://minhaloja.com"
                        className="pl-10"
                        data-testid="input-store-website"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isUploading || createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-store"
            >
              {isUploading || createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                store ? "Atualizar Configurações" : "Criar Loja"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
