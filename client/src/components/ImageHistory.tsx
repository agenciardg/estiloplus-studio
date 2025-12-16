import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabase } from "@/lib/supabase";
import { toCamelCase } from "@/lib/utils";
import type { GeneratedImage, Product } from "@shared/schema";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, ExternalLink, History, Image as ImageIcon } from "lucide-react";

interface GeneratedImageWithProduct extends GeneratedImage {
  product?: Product;
}

export default function ImageHistory() {
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<GeneratedImageWithProduct | null>(null);

  const { data: images, isLoading } = useQuery({
    queryKey: ["/api/generated-images", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("generated_images")
        .select(`
          *,
          product:products(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return toCamelCase<GeneratedImageWithProduct[]>(data);
    },
    enabled: !!user,
  });

  function handleDownload(imageUrl: string) {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `estiloplus-${Date.now()}.png`;
    link.click();
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <Skeleton className="aspect-square rounded-t-lg" />
            <CardContent className="p-3">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!images?.length) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <History className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">Nenhuma imagem gerada</h3>
        <p className="text-muted-foreground">
          Use o provador virtual para gerar suas primeiras imagens!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image) => (
          <Card
            key={image.id}
            className="overflow-hidden cursor-pointer group hover-elevate"
            onClick={() => setSelectedImage(image)}
            data-testid={`card-history-${image.id}`}
          >
            <div className="aspect-square relative overflow-hidden bg-muted">
              <img
                src={image.generatedImageUrl}
                alt="Imagem gerada"
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
            <CardContent className="p-3">
              <p className="font-medium text-sm line-clamp-1">
                {image.product?.name || "Roupa"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(image.createdAt), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Detalhes da Imagem
            </DialogTitle>
          </DialogHeader>

          {selectedImage && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                  <img
                    src={selectedImage.originalImageUrl}
                    alt="Foto original"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">Foto Original</p>
              </div>

              <div className="space-y-4">
                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                  <img
                    src={selectedImage.generatedImageUrl}
                    alt="Imagem gerada"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">Resultado</p>
              </div>
            </div>
          )}

          {selectedImage && (
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={() => handleDownload(selectedImage.generatedImageUrl)} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Baixar Resultado
              </Button>
              {selectedImage.product?.productUrl && (
                <Button variant="outline" asChild>
                  <a href={selectedImage.product.productUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver na Loja
                  </a>
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
