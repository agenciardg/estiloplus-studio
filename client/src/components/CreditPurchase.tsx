import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { Coins, Sparkles, Check } from 'lucide-react';
import type { CreditPackage } from '@shared/schema';

export function CreditPurchase() {
  const { user, refreshCredits } = useAuth();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const { data: packages, isLoading } = useQuery<CreditPackage[]>({
    queryKey: ['/api/credit-packages'],
  });

  const checkoutMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const response = await apiRequest('POST', '/api/create-checkout-session', {
        packageId,
        userId: user?.id,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Falha ao criar sessão de pagamento");
      }
      return data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao iniciar pagamento',
        variant: 'destructive',
      });
    },
  });

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  const handlePurchase = (packageId: string) => {
    setSelectedPackage(packageId);
    checkoutMutation.mutate(packageId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <Coins className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Comprar Créditos</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Coins className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Comprar Créditos</h2>
        </div>
        <Badge variant="outline" className="text-base px-3 py-1" data-testid="badge-current-credits">
          <Sparkles className="h-4 w-4 mr-1" />
          {user?.credits ?? 0} créditos
        </Badge>
      </div>

      <p className="text-muted-foreground mb-6">
        Cada prova virtual consome 1 crédito. Escolha o pacote ideal para você:
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {packages?.map((pkg) => {
          const pricePerCredit = pkg.priceInCents / pkg.credits;
          const isPopular = pkg.credits === 30;
          
          return (
            <Card 
              key={pkg.id} 
              className={`relative ${isPopular ? 'border-primary' : ''}`}
              data-testid={`card-package-${pkg.id}`}
            >
              {isPopular && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
                  Mais Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  {pkg.name}
                </CardTitle>
                <CardDescription>
                  {pkg.credits} créditos para usar no provador virtual
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-3xl font-bold">{formatPrice(pkg.priceInCents)}</span>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(pricePerCredit)} por crédito
                  </p>
                </div>
                
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    {pkg.credits} provas virtuais
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Sem validade
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Pagamento seguro
                  </li>
                </ul>

                <Button
                  className="w-full"
                  variant={isPopular ? 'default' : 'outline'}
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={checkoutMutation.isPending}
                  data-testid={`button-buy-${pkg.id}`}
                >
                  {checkoutMutation.isPending && selectedPackage === pkg.id
                    ? 'Processando...'
                    : 'Comprar'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-6">
        Pagamento processado de forma segura via Stripe. Os créditos são adicionados instantaneamente após a confirmação do pagamento.
      </p>
    </div>
  );
}
