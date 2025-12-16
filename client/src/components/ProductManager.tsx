import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getSupabase, uploadImage } from "@/lib/supabase";
import { toCamelCase } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { insertProductSchema, type InsertProduct, type Product } from "@shared/schema";
import { Plus, Package, Upload, Edit, Trash2, Loader2, ExternalLink, Image as ImageIcon } from "lucide-react";

const CATEGORIES = ["Vestido", "Blusa", "Calça", "Saia", "Conjunto", "Macacão", "Blazer", "Cardigan", "Outro"];
const SIZES = ["P", "M", "G", "GG", "XG", "XXG", "XXXG", "48", "50", "52", "54", "56", "58", "60"];
const COLORS = ["Preto", "Branco", "Azul", "Vermelho", "Verde", "Rosa", "Amarelo", "Marrom", "Bege", "Cinza", "Estampado", "Outro"];
const STYLES = ["Casual", "Social", "Festa", "Praia", "Esportivo", "Elegante", "Boho", "Outro"];

export default function ProductManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      description: "",
      productUrl: "",
      category: "",
      size: "",
      color: "",
      style: "",
    },
  });

  const { data: store } = useQuery({
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
      return toCamelCase<{ id: string; name: string }>(data);
    },
    enabled: !!user,
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products", store?.id],
    queryFn: async () => {
      if (!store) return [];
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return toCamelCase<Product[]>(data);
    },
    enabled: !!store,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertProduct & { imageUrl: string }) => {
      const response = await apiRequest("POST", "/api/products", {
        ...data,
        storeId: store?.id,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", store?.id] });
      toast({ title: "Produto criado!", description: "O produto foi adicionado ao catálogo." });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Erro ao criar", description: "Não foi possível criar o produto.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertProduct & { id: string; imageUrl?: string }) => {
      const response = await apiRequest("PATCH", `/api/products/${data.id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", store?.id] });
      toast({ title: "Produto atualizado!", description: "As alterações foram salvas." });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar", description: "Não foi possível atualizar o produto.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", store?.id] });
      toast({ title: "Produto excluído!", description: "O produto foi removido do catálogo." });
    },
    onError: () => {
      toast({ title: "Erro ao excluir", description: "Não foi possível excluir o produto.", variant: "destructive" });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  function handleOpenEdit(product: Product) {
    setEditingProduct(product);
    setImagePreview(product.imageUrl);
    form.reset({
      name: product.name,
      description: product.description || "",
      productUrl: product.productUrl || "",
      category: product.category || "",
      size: product.size || "",
      color: product.color || "",
      style: product.style || "",
    });
    setIsDialogOpen(true);
  }

  function handleCloseDialog() {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview(null);
    form.reset();
  }

  async function onSubmit(data: InsertProduct) {
    if (!store) return;

    setIsUploading(true);
    try {
      let imageUrl = editingProduct?.imageUrl || "";

      if (imageFile) {
        const path = `products/${store.id}/${Date.now()}.jpg`;
        const uploadedUrl = await uploadImage(imageFile, "images", path);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          throw new Error("Falha no upload");
        }
      }

      if (!imageUrl && !editingProduct) {
        toast({ title: "Imagem obrigatória", description: "Envie uma foto do produto.", variant: "destructive" });
        return;
      }

      if (editingProduct) {
        updateMutation.mutate({ ...data, id: editingProduct.id, imageUrl });
      } else {
        createMutation.mutate({ ...data, imageUrl });
      }
    } catch (error) {
      toast({ title: "Erro no upload", description: "Não foi possível enviar a imagem.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  }

  if (!store) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Configure sua Loja
          </CardTitle>
          <CardDescription>
            Complete as configurações da loja antes de adicionar produtos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Acesse a aba "Configurações" para configurar sua loja.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Seus Produtos</h2>
          <p className="text-sm text-muted-foreground">
            {products?.length || 0} produto(s) cadastrado(s)
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => open ? setIsDialogOpen(true) : handleCloseDialog()}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-product">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                  }`}
                >
                  <input {...getInputProps()} data-testid="input-product-image" />
                  {imagePreview ? (
                    <div className="aspect-[3/4] max-h-48 mx-auto overflow-hidden rounded-lg">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="py-8">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Arraste uma foto ou clique para selecionar
                      </p>
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Produto</FormLabel>
                      <FormControl>
                        <Input placeholder="Vestido Floral Plus Size" data-testid="input-product-name" {...field} />
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
                        <Textarea placeholder="Descreva o produto..." data-testid="input-product-description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tamanho</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-size">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SIZES.map((size) => (
                              <SelectItem key={size} value={size}>{size}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-color">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COLORS.map((color) => (
                              <SelectItem key={color} value={color}>{color}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="style"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estilo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-style">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STYLES.map((style) => (
                              <SelectItem key={style} value={style}>{style}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="productUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link do Produto (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://sualoja.com/produto" data-testid="input-product-url" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseDialog} className="flex-1">
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUploading || createMutation.isPending || updateMutation.isPending}
                    className="flex-1"
                    data-testid="button-save-product"
                  >
                    {isUploading || createMutation.isPending || updateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="aspect-[3/4] rounded-t-lg" />
              <CardContent className="p-3">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum produto cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Adicione seus produtos para que clientes possam experimentá-los
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products?.map((product) => (
            <Card key={product.id} className="overflow-hidden" data-testid={`card-product-${product.id}`}>
              <div className="aspect-[3/4] relative overflow-hidden bg-muted">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-3 space-y-2">
                <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
                <div className="flex flex-wrap gap-1">
                  {product.category && <Badge variant="secondary" className="text-xs">{product.category}</Badge>}
                  {product.size && <Badge variant="outline" className="text-xs">{product.size}</Badge>}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleOpenEdit(product)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  {product.productUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={product.productUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. O produto será removido permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(product.id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
