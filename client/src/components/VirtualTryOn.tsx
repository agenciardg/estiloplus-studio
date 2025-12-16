import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ProductGallery from "./ProductGallery";
import ProfileUpload from "./ProfileUpload";
import { apiRequest } from "@/lib/queryClient";
import { uploadImage } from "@/lib/supabase";
import type { Product } from "@shared/schema";
import { Sparkles, Camera, ShoppingBag, Download, RotateCcw, ExternalLink, Loader2, ArrowRight, Coins, Upload } from "lucide-react";

interface LocalClothing {
  name: string;
  imageUrl: string;
  id: string;
}

export default function VirtualTryOn() {
  const { user, refreshCredits } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedLocalClothing, setSelectedLocalClothing] = useState<LocalClothing | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showClothingOptions, setShowClothingOptions] = useState(false);
  const [isUploadingClothing, setIsUploadingClothing] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  const onDropClothing = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !user) return;

    setIsUploadingClothing(true);
    try {
      const path = `clothing/${user.id}/${Date.now()}.jpg`;
      const imageUrl = await uploadImage(file, "images", path);
      
      if (imageUrl) {
        setSelectedLocalClothing({
          name: file.name.replace(/\.[^/.]+$/, ""),
          imageUrl,
          id: `local-${Date.now()}`,
        });
        setShowClothingOptions(false);
        toast({
          title: "Roupa carregada!",
          description: "Agora você pode experimentar esta roupa.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar",
        description: error?.message || "Não foi possível carregar a roupa.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingClothing(false);
    }
  }, [user, toast]);

  const { getRootProps: getClothingRootProps, getInputProps: getClothingInputProps, isDragActive: isClothingDragActive } = useDropzone({
    onDrop: onDropClothing,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const generateMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await apiRequest("POST", "/api/generate-try-on", { 
        productId,
        userId: user?.id,
        userImageUrl: user?.profileImageUrl,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Falha ao gerar imagem");
      }
      return data as { imageUrl: string; creditsRemaining: number };
    },
    onSuccess: (data) => {
      setGeneratedImageUrl(data.imageUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/generated-images"] });
      refreshCredits();
      toast({
        title: "Imagem gerada!",
        description: `Veja como você fica com essa roupa. Créditos restantes: ${data.creditsRemaining}`,
      });
    },
    onError: (error: any) => {
      const message = error?.message || "Não foi possível gerar a imagem. Tente novamente.";
      const isNoCredits = message.includes("insuficientes");
      toast({
        title: isNoCredits ? "Créditos insuficientes" : "Erro ao gerar imagem",
        description: message,
        variant: "destructive",
      });
    },
  });

  const generateLocalMutation = useMutation({
    mutationFn: async (clothingImageUrl: string) => {
      const response = await apiRequest("POST", "/api/generate-try-on-local", { 
        clothingImageUrl,
        userId: user?.id,
        userImageUrl: user?.profileImageUrl,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Falha ao gerar imagem");
      }
      return data as { imageUrl: string; creditsRemaining: number };
    },
    onSuccess: (data) => {
      setGeneratedImageUrl(data.imageUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/generated-images"] });
      refreshCredits();
      toast({
        title: "Imagem gerada!",
        description: `Veja como você fica com essa roupa. Créditos restantes: ${data.creditsRemaining}`,
      });
    },
    onError: (error: any) => {
      const message = error?.message || "Não foi possível gerar a imagem. Tente novamente.";
      const isNoCredits = message.includes("insuficientes");
      toast({
        title: isNoCredits ? "Créditos insuficientes" : "Erro ao gerar imagem",
        description: message,
        variant: "destructive",
      });
    },
  });

  function handleSelectProduct(product: Product) {
    setSelectedProduct(product);
    setSelectedLocalClothing(null);
    setGeneratedImageUrl(null);
    setShowGallery(false);
  }

  function handleGenerate() {
    if (selectedProduct) {
      generateMutation.mutate(selectedProduct.id);
    } else if (selectedLocalClothing) {
      generateLocalMutation.mutate(selectedLocalClothing.imageUrl);
    }
  }

  function handleReset() {
    setSelectedProduct(null);
    setSelectedLocalClothing(null);
    setGeneratedImageUrl(null);
  }

  function handleDownload() {
    if (!generatedImageUrl) return;
    const link = document.createElement("a");
    link.href = generatedImageUrl;
    link.download = `estiloplus-${Date.now()}.png`;
    link.click();
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user?.profileImageUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Configure seu Perfil
          </CardTitle>
          <CardDescription>
            Envie uma foto de corpo inteiro para usar o provador virtual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Camera className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">
              Você precisa enviar uma foto de perfil antes de experimentar roupas
            </p>
            <Button variant="outline" onClick={() => {
              const profileTab = document.querySelector('[data-testid="tab-profile"]') as HTMLElement;
              profileTab?.click();
            }}>
              Ir para Perfil
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showGallery) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                Escolha uma Roupa
              </CardTitle>
              <CardDescription>
                Clique em uma roupa para experimentar
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => setShowGallery(false)}>
              Cancelar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ProductGallery onSelectProduct={handleSelectProduct} selectable />
        </CardContent>
      </Card>
    );
  }

  const hasCredits = (user?.credits ?? 0) > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Provador Virtual
              </CardTitle>
              <CardDescription>
                Experimente roupas virtualmente usando IA
              </CardDescription>
            </div>
            <Badge 
              variant={hasCredits ? "secondary" : "destructive"} 
              className="text-sm px-3 py-1"
              data-testid="badge-credits"
            >
              <Coins className="h-4 w-4 mr-1" />
              {user?.credits ?? 0} créditos
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-5 gap-6">
            <div className="md:col-span-3 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium text-sm text-muted-foreground">Sua Foto</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowUploadDialog(true)}
                  data-testid="button-change-photo"
                >
                  <Camera className="h-4 w-4 mr-1" />
                  {imageLoadError ? 'Enviar Foto' : 'Trocar'}
                </Button>
              </div>
              <div className="aspect-[3/4] max-h-[600px] rounded-lg overflow-hidden bg-muted relative mx-auto">
                {user.profileImageUrl && !imageLoadError ? (
                  <img
                    src={user.profileImageUrl}
                    alt="Sua foto"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Erro ao carregar imagem do perfil:', user.profileImageUrl);
                      setImageLoadError(true);
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center p-4">
                      <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        {imageLoadError ? 'Imagem não carregou' : 'Foto não encontrada'}
                      </p>
                      <Button onClick={() => setShowUploadDialog(true)}>
                        <Camera className="mr-2 h-4 w-4" />
                        Enviar Foto
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">
                {generatedImageUrl ? "Resultado" : "Roupa Selecionada"}
              </h3>
              
              {generatedImageUrl ? (
                <div className="space-y-4">
                  <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                    <img
                      src={generatedImageUrl}
                      alt="Resultado do provador"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleDownload} className="flex-1">
                      <Download className="mr-2 h-4 w-4" />
                      Baixar
                    </Button>
                    <Button variant="outline" onClick={handleReset}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Nova
                    </Button>
                  </div>
                  {selectedProduct?.productUrl && (
                    <Button variant="secondary" className="w-full" asChild>
                      <a href={selectedProduct.productUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Comprar na Loja
                      </a>
                    </Button>
                  )}
                </div>
              ) : selectedProduct ? (
                <div className="space-y-4">
                  <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted relative">
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                    {generateMutation.isPending && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                          <p className="text-sm font-medium">Gerando imagem...</p>
                          <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">{selectedProduct.name}</h4>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedProduct.category && (
                        <Badge variant="secondary">{selectedProduct.category}</Badge>
                      )}
                      {selectedProduct.size && (
                        <Badge variant="outline">{selectedProduct.size}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleGenerate}
                      disabled={generateMutation.isPending || !hasCredits}
                      className="flex-1"
                      data-testid="button-generate"
                    >
                      {generateMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Experimentar (1 crédito)
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleReset}>
                      Trocar
                    </Button>
                  </div>
                  {!hasCredits && (
                    <p className="text-sm text-destructive text-center">
                      Você não tem créditos. Compre mais créditos para continuar experimentando.
                    </p>
                  )}
                </div>
              ) : selectedLocalClothing ? (
                <div className="space-y-4">
                  <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted relative">
                    <img
                      src={selectedLocalClothing.imageUrl}
                      alt={selectedLocalClothing.name}
                      className="w-full h-full object-cover"
                    />
                    {generateLocalMutation.isPending && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                          <p className="text-sm font-medium">Gerando imagem...</p>
                          <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium">{selectedLocalClothing.name}</h4>
                    <Badge variant="outline" className="mt-2">Roupa Própria</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleGenerate}
                      disabled={generateLocalMutation.isPending || !hasCredits}
                      className="flex-1"
                      data-testid="button-generate-local"
                    >
                      {generateLocalMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Experimentar (1 crédito)
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleReset}>
                      Trocar
                    </Button>
                  </div>
                  {!hasCredits && (
                    <p className="text-sm text-destructive text-center">
                      Você não tem créditos. Compre mais créditos para continuar experimentando.
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border-2 border-dashed p-6">
                  <div className="text-center">
                    <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Escolha uma roupa
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" onClick={() => setShowGallery(true)} data-testid="button-browse-catalog">
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Ver Catálogo
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowClothingOptions(true)} data-testid="button-upload-clothing">
                        <Upload className="mr-2 h-4 w-4" />
                        Enviar Minha Roupa
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Enviar Foto de Perfil
            </DialogTitle>
          </DialogHeader>
          <ProfileUpload 
            onUploadSuccess={() => {
              setShowUploadDialog(false);
              setImageLoadError(false);
              window.location.reload();
            }} 
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showClothingOptions} onOpenChange={setShowClothingOptions}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Enviar Roupa
            </DialogTitle>
            <DialogDescription>
              Envie uma imagem de uma roupa para experimentar virtualmente
            </DialogDescription>
          </DialogHeader>
          <div
            {...getClothingRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isClothingDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            }`}
            data-testid="dropzone-clothing"
          >
            <input {...getClothingInputProps()} />
            {isUploadingClothing ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Carregando...</p>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">
                  {isClothingDragActive ? "Solte a imagem aqui" : "Arraste uma imagem ou clique para selecionar"}
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG ou WebP (máx. 10MB)
                </p>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Para melhores resultados, use imagens de roupas com fundo branco ou neutro
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
