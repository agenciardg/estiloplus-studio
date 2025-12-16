import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { insertUserSchema, type InsertUser, UserRole } from "@shared/schema";
import { Loader2, ArrowLeft, User, Store, Eye, EyeOff } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const params = new URLSearchParams(searchParams);
  const defaultType = params.get("type") === "store" ? "store" : "client";
  
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<"client" | "store">(defaultType);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      role: userType,
    },
  });

  async function onSubmit(data: InsertUser) {
    setIsLoading(true);
    const { error } = await signUp(data.email, data.password, data.name, userType);
    setIsLoading(false);

    if (error) {
      toast({
        title: "Erro ao criar conta",
        description: error,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Conta criada!",
      description: "Verifique seu email para confirmar o cadastro.",
    });
    setLocation("/login");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/">
            <span className="font-serif text-2xl font-bold text-foreground cursor-pointer">
              estilo<span className="text-primary">plus</span>.studio
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="font-serif text-2xl">Criar Conta</CardTitle>
            <CardDescription>
              Escolha o tipo de conta que deseja criar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={userType} onValueChange={(v) => setUserType(v as "client" | "store")} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="client" className="gap-2" data-testid="tab-client">
                  <User className="h-4 w-4" />
                  Cliente
                </TabsTrigger>
                <TabsTrigger value="store" className="gap-2" data-testid="tab-store">
                  <Store className="h-4 w-4" />
                  Lojista
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{userType === "store" ? "Nome da Loja" : "Seu Nome"}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={userType === "store" ? "Minha Loja Plus Size" : "Maria Silva"}
                          data-testid="input-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          data-testid="input-email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Mínimo 6 caracteres"
                            data-testid="input-password"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-register"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    `Criar conta como ${userType === "store" ? "Lojista" : "Cliente"}`
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Já tem uma conta? </span>
              <Link href="/login">
                <span className="text-primary font-medium cursor-pointer" data-testid="link-login">
                  Entrar
                </span>
              </Link>
            </div>

            <div className="mt-4 text-center">
              <Link href="/">
                <Button variant="ghost" size="sm" data-testid="link-back">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao início
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
