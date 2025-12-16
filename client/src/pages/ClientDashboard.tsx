import { useState, useEffect, useRef } from "react";
import { Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ProductGallery from "@/components/ProductGallery";
import VirtualTryOn from "@/components/VirtualTryOn";
import ImageHistory from "@/components/ImageHistory";
import ProfileUpload from "@/components/ProfileUpload";
import { CreditPurchase } from "@/components/CreditPurchase";
import AdminPanel from "@/components/AdminPanel";
import { Sparkles, History, User, LogOut, Camera, ShoppingBag, Coins, Shield, Upload, Share2 } from "lucide-react";

export default function ClientDashboard() {
  const { user, signOut, refreshCredits } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("provador");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const searchString = useSearch();

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const payment = params.get("payment");
    
    if (payment === "success") {
      refreshCredits();
      toast({
        title: "Pagamento confirmado!",
        description: "Seus créditos foram adicionados com sucesso.",
      });
      window.history.replaceState({}, "", "/dashboard");
    } else if (payment === "cancelled") {
      toast({
        title: "Pagamento cancelado",
        description: "O pagamento foi cancelado. Você pode tentar novamente.",
        variant: "destructive",
      });
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [searchString, refreshCredits, toast]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const hasProfilePhoto = !!user?.profileImageUrl;

  if (!hasProfilePhoto) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b bg-background/95 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
            <Link href="/">
              <span className="font-serif text-xl font-bold text-foreground cursor-pointer">
                estilo<span className="text-primary">plus</span>.studio
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="flex items-center gap-3 pl-2 border-l">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profileImageUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {user?.name ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:block">{user?.name}</span>
                <Button variant="ghost" size="icon" onClick={signOut} data-testid="button-logout">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div className="space-y-6">
              <div>
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-2">
                  Estilo <span className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-3xl md:text-4xl">+</span>
                </h1>
                <p className="text-muted-foreground text-lg">A Nova Você</p>
              </div>

              <p className="text-foreground text-lg leading-relaxed">
                Envie uma foto sua de corpo inteiro para iniciar sua sessão de prova de roupas virtual.
              </p>

              <div className="border-t pt-6">
                <ProfileUpload onUploadSuccess={() => window.location.reload()} />
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Para melhores resultados, use uma foto de corpo inteiro, nítida e bem iluminada.</p>
                <p>Ao enviar, você concorda com nossos termos de serviço.</p>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="relative">
                <div className="grid grid-cols-2 gap-2">
                  <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center p-4">
                        <Camera className="h-12 w-12 text-primary/50 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Sua foto aqui</p>
                      </div>
                    </div>
                  </div>
                  <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gradient-to-br from-primary/30 to-primary/10">
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center p-4">
                        <Sparkles className="h-12 w-12 text-primary/50 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Resultado IA</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="border-t py-4">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="font-medium text-primary cursor-pointer">Provador</span>
              <span className="cursor-pointer hover:text-foreground transition-colors">Catálogo</span>
              <span className="cursor-pointer hover:text-foreground transition-colors">Transformação</span>
              <span className="cursor-pointer hover:text-foreground transition-colors">Mídia Social</span>
            </nav>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/">
            <span className="font-serif text-xl font-bold text-foreground cursor-pointer">
              estilo<span className="text-primary">plus</span>.studio
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="flex items-center gap-3 pl-2 border-l">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profileImageUrl} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {user?.name ? getInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:block">{user?.name}</span>
              <Button variant="ghost" size="icon" onClick={signOut} data-testid="button-logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">
            Olá, {user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground">
            Experimente roupas virtualmente e descubra seu estilo
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full max-w-2xl ${user?.role === "admin" ? "grid-cols-6" : "grid-cols-5"}`}>
            <TabsTrigger value="provador" className="gap-2" data-testid="tab-try-on">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Provador</span>
            </TabsTrigger>
            <TabsTrigger value="catalogo" className="gap-2" data-testid="tab-gallery">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Catálogo</span>
            </TabsTrigger>
            <TabsTrigger value="creditos" className="gap-2" data-testid="tab-credits">
              <Coins className="h-4 w-4" />
              <span className="hidden sm:inline">Créditos</span>
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-2" data-testid="tab-history">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Histórico</span>
            </TabsTrigger>
            <TabsTrigger value="perfil" className="gap-2" data-testid="tab-profile">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            {user?.role === "admin" && (
              <TabsTrigger value="admin" className="gap-2" data-testid="tab-admin">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="provador" className="space-y-6">
            <VirtualTryOn />
          </TabsContent>

          <TabsContent value="catalogo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  Catálogo de Roupas
                </CardTitle>
                <CardDescription>
                  Explore roupas das melhores lojas plus size
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductGallery />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="creditos" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <CreditPurchase />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historico" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Histórico de Imagens
                </CardTitle>
                <CardDescription>
                  Veja todas as imagens geradas pelo provador virtual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageHistory />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="perfil" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" />
                  Foto de Perfil
                </CardTitle>
                <CardDescription>
                  Envie uma foto sua de corpo inteiro para usar no provador virtual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileUpload />
              </CardContent>
            </Card>
          </TabsContent>

          {user?.role === "admin" && (
            <TabsContent value="admin" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Painel Administrativo
                  </CardTitle>
                  <CardDescription>
                    Gerencie usuários, lojas, produtos, prompts e pacotes de créditos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminPanel />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
