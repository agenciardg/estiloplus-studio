import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sparkles, Store, Camera, Heart, ArrowRight, CheckCircle } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/">
            <span className="font-serif text-2xl font-bold text-foreground cursor-pointer" data-testid="link-logo">
              estilo<span className="text-primary">plus</span>.studio
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" data-testid="link-login">Entrar</Button>
            </Link>
            <Link href="/register">
              <Button data-testid="link-register">Criar Conta</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
              Experimente roupas <span className="text-primary">virtualmente</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Descubra como cada peça fica em você antes de comprar. 
              Nosso provador virtual com IA transforma sua experiência de compra plus size.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="text-lg px-8" data-testid="button-start">
                  Começar Agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/register?type=store">
                <Button size="lg" variant="outline" className="text-lg px-8" data-testid="button-store">
                  Sou Lojista
                  <Store className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              Como Funciona
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Em poucos passos, veja como cada roupa fica em você
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="relative overflow-visible">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Camera className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">1. Envie sua foto</h3>
                <p className="text-muted-foreground">
                  Faça upload de uma foto sua de corpo inteiro para começar
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-visible">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">2. Escolha a roupa</h3>
                <p className="text-muted-foreground">
                  Navegue pelo catálogo de roupas das melhores lojas plus size
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-visible">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">3. Veja o resultado</h3>
                <p className="text-muted-foreground">
                  Nossa IA gera uma imagem sua vestindo a roupa escolhida
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
                Para Lojistas
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Aumente suas vendas permitindo que clientes experimentem suas roupas virtualmente. 
                Cadastre seus produtos e alcance mais clientes plus size.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "Cadastre produtos com facilidade",
                  "Link direto para sua loja",
                  "Aumente a conversão de vendas",
                  "Reduza devoluções",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register?type=store">
                <Button size="lg" data-testid="button-store-cta">
                  Cadastrar minha loja
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8 aspect-square flex items-center justify-center">
              <Store className="h-32 w-32 text-primary/30" />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="font-serif text-xl font-bold text-foreground">
              estilo<span className="text-primary">plus</span>.studio
            </span>
            <p className="text-sm text-muted-foreground">
              Provador virtual para moda plus size
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
