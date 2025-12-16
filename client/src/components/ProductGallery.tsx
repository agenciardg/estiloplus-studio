import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getSupabase } from "@/lib/supabase";
import { toCamelCase } from "@/lib/utils";
import type { Product, Store } from "@shared/schema";
import { Search, ExternalLink, Sparkles, Filter, X } from "lucide-react";

interface ProductWithStore extends Product {
  store?: Store;
}

interface ProductGalleryProps {
  onSelectProduct?: (product: Product) => void;
  selectable?: boolean;
}

export default function ProductGallery({ onSelectProduct, selectable = false }: ProductGalleryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<ProductWithStore | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          store:stores(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return toCamelCase<ProductWithStore[]>(data);
    },
  });

  const categories = [...new Set(products?.map((p) => p.category).filter(Boolean))];

  const filteredProducts = products?.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  function handleProductClick(product: ProductWithStore) {
    if (selectable && onSelectProduct) {
      onSelectProduct(product);
    } else {
      setSelectedProduct(product);
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <Skeleton className="aspect-[3/4] rounded-t-lg" />
            <CardContent className="p-3">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Sparkles className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">Nenhum produto disponível</h3>
        <p className="text-muted-foreground">
          Em breve teremos roupas incríveis para você experimentar!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar roupas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-products"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-category">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat!}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts?.map((product) => (
          <Card
            key={product.id}
            className="overflow-hidden cursor-pointer group hover-elevate"
            onClick={() => handleProductClick(product)}
            data-testid={`card-product-${product.id}`}
          >
            <div className="aspect-[3/4] relative overflow-hidden bg-muted">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              {selectable && (
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
              )}
            </div>
            <CardContent className="p-3">
              <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
              {product.store && (
                <p className="text-xs text-muted-foreground mt-1">
                  {product.store.name}
                </p>
              )}
              <div className="flex flex-wrap gap-1 mt-2">
                {product.category && (
                  <Badge variant="secondary" className="text-xs">
                    {product.category}
                  </Badge>
                )}
                {product.size && (
                  <Badge variant="outline" className="text-xs">
                    {product.size}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-4">
                {selectedProduct.description && (
                  <p className="text-muted-foreground">{selectedProduct.description}</p>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.category && (
                    <Badge>{selectedProduct.category}</Badge>
                  )}
                  {selectedProduct.size && (
                    <Badge variant="outline">{selectedProduct.size}</Badge>
                  )}
                  {selectedProduct.color && (
                    <Badge variant="secondary">{selectedProduct.color}</Badge>
                  )}
                  {selectedProduct.style && (
                    <Badge variant="secondary">{selectedProduct.style}</Badge>
                  )}
                </div>

                {selectedProduct.store && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Vendido por:</p>
                    <p className="font-medium">{selectedProduct.store.name}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  {selectedProduct.productUrl && (
                    <Button asChild className="flex-1">
                      <a href={selectedProduct.productUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Ver na Loja
                      </a>
                    </Button>
                  )}
                  {onSelectProduct && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        onSelectProduct(selectedProduct);
                        setSelectedProduct(null);
                      }}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Experimentar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
