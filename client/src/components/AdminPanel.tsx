import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Users, Store, ShoppingBag, Sparkles, CreditCard, Trash2, Edit, Plus, Minus, BarChart3, Eye } from "lucide-react";
import { Link } from "wouter";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  credits: number;
  profileImageUrl?: string;
  createdAt: string;
}

interface StoreData {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  user: User;
}

interface Product {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  store: { name: string };
}

interface Prompt {
  id: string;
  name: string;
  content: string;
  description: string;
  isActive: boolean;
}

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceInCents: number;
  description: string;
  isActive: boolean;
}

interface Stats {
  totalUsers: number;
  clientCount: number;
  storeCount: number;
  adminCount: number;
  totalStores: number;
  totalProducts: number;
  totalGeneratedImages: number;
  totalCreditsInCirculation: number;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [adminTab, setAdminTab] = useState("stats");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [editingPackage, setEditingPackage] = useState<CreditPackage | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string; name: string } | null>(null);

  const getInitials = (name: string) => {
    return name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
  };

  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: stores = [] } = useQuery<StoreData[]>({
    queryKey: ["/api/admin/stores"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/admin/products"],
  });

  const { data: prompts = [] } = useQuery<Prompt[]>({
    queryKey: ["/api/prompts"],
  });

  const { data: packages = [] } = useQuery<CreditPackage[]>({
    queryKey: ["/api/credit-packages"],
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      return apiRequest("PATCH", `/api/admin/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Usuário atualizado com sucesso" });
    },
  });

  const adjustCreditsMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      return apiRequest("POST", `/api/admin/users/${id}/credits`, { amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setSelectedUser(null);
      setCreditAmount("");
      toast({ title: "Créditos ajustados com sucesso" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setDeleteConfirm(null);
      toast({ title: "Usuário excluído com sucesso" });
    },
  });

  const deleteStoreMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/stores/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setDeleteConfirm(null);
      toast({ title: "Loja excluída com sucesso" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setDeleteConfirm(null);
      toast({ title: "Produto excluído com sucesso" });
    },
  });

  const updatePromptMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Prompt> }) => {
      return apiRequest("PATCH", `/api/prompts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      setEditingPrompt(null);
      toast({ title: "Prompt atualizado com sucesso" });
    },
  });

  const updatePackageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreditPackage> }) => {
      return apiRequest("PATCH", `/api/admin/credit-packages/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credit-packages"] });
      setEditingPackage(null);
      toast({ title: "Pacote atualizado com sucesso" });
    },
  });

  const handleDelete = () => {
    if (!deleteConfirm) return;
    switch (deleteConfirm.type) {
      case "user":
        deleteUserMutation.mutate(deleteConfirm.id);
        break;
      case "store":
        deleteStoreMutation.mutate(deleteConfirm.id);
        break;
      case "product":
        deleteProductMutation.mutate(deleteConfirm.id);
        break;
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin": return <Badge variant="destructive">Admin</Badge>;
      case "store": return <Badge variant="secondary">Loja</Badge>;
      default: return <Badge variant="outline">Cliente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Usuários</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
              <p className="text-xs text-muted-foreground">
                {stats.clientCount} clientes, {stats.storeCount} lojas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Lojas</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalStores}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Produtos</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalProducts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Créditos</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalCreditsInCirculation}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sub-tabs de admin */}
      <Tabs value={adminTab} onValueChange={setAdminTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="stats" data-testid="admin-tab-stats">
            <BarChart3 className="h-4 w-4 mr-1" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="admin-tab-users">
            <Users className="h-4 w-4 mr-1" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="stores" data-testid="admin-tab-stores">
            <Store className="h-4 w-4 mr-1" />
            Lojas
          </TabsTrigger>
          <TabsTrigger value="products" data-testid="admin-tab-products">
            <ShoppingBag className="h-4 w-4 mr-1" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="prompts" data-testid="admin-tab-prompts">
            <Sparkles className="h-4 w-4 mr-1" />
            Prompts
          </TabsTrigger>
          <TabsTrigger value="packages" data-testid="admin-tab-packages">
            <CreditCard className="h-4 w-4 mr-1" />
            Pacotes
          </TabsTrigger>
          <TabsTrigger value="preview" data-testid="admin-tab-preview">
            <Eye className="h-4 w-4 mr-1" />
            Visualizar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <Card>
            <CardHeader><CardTitle>Resumo da Plataforma</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">Total de imagens geradas</p>
                  <p className="text-3xl font-bold">{stats?.totalGeneratedImages || 0}</p>
                </div>
                <div className="p-4 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">Administradores</p>
                  <p className="text-3xl font-bold">{stats?.adminCount || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader><CardTitle>Gerenciar Usuários</CardTitle></CardHeader>
            <CardContent>
              {usersLoading ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-auto">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between gap-4 p-3 border rounded-md flex-wrap" data-testid={`user-row-${u.id}`}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={u.profileImageUrl} />
                          <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium truncate">{u.name}</span>
                            {getRoleBadge(u.role)}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">{u.credits} créditos</Badge>
                        <Select value={u.role} onValueChange={(value) => updateUserMutation.mutate({ id: u.id, data: { role: value } })}>
                          <SelectTrigger className="w-28" data-testid={`select-role-${u.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="client">Cliente</SelectItem>
                            <SelectItem value="store">Loja</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="icon" variant="outline" onClick={() => setSelectedUser(u)} data-testid={`button-edit-credits-${u.id}`}>
                          <CreditCard className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="destructive" onClick={() => setDeleteConfirm({ type: "user", id: u.id, name: u.name })} disabled={u.id === user?.id} data-testid={`button-delete-user-${u.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stores">
          <Card>
            <CardHeader><CardTitle>Gerenciar Lojas</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stores.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-4 p-3 border rounded-md flex-wrap" data-testid={`store-row-${s.id}`}>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{s.name}</span>
                      <p className="text-sm text-muted-foreground">Dono: {s.user?.name || "Desconhecido"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={s.isActive ? "default" : "secondary"}>{s.isActive ? "Ativa" : "Inativa"}</Badge>
                      <Button size="icon" variant="destructive" onClick={() => setDeleteConfirm({ type: "store", id: s.id, name: s.name })} data-testid={`button-delete-store-${s.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {stores.length === 0 && <p className="text-muted-foreground text-center py-4">Nenhuma loja cadastrada</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader><CardTitle>Gerenciar Produtos</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-auto">
                {products.map((p) => (
                  <div key={p.id} className="border rounded-md p-3" data-testid={`product-item-${p.id}`}>
                    <div className="aspect-square mb-2 overflow-hidden rounded-md">
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-medium truncate">{p.name}</h3>
                    <p className="text-sm text-muted-foreground">Loja: {p.store?.name || "?"}</p>
                    <Button size="sm" variant="destructive" className="mt-2 w-full" onClick={() => setDeleteConfirm({ type: "product", id: p.id, name: p.name })} data-testid={`button-delete-product-${p.id}`}>
                      <Trash2 className="h-4 w-4 mr-2" />Excluir
                    </Button>
                  </div>
                ))}
              </div>
              {products.length === 0 && <p className="text-muted-foreground text-center py-4">Nenhum produto cadastrado</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts">
          <Card>
            <CardHeader><CardTitle>Gerenciar Prompts da IA</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {prompts.map((p) => (
                  <div key={p.id} className="border rounded-md p-4" data-testid={`prompt-item-${p.id}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{p.name}</h3>
                          <Badge variant={p.isActive ? "default" : "secondary"}>{p.isActive ? "Ativo" : "Inativo"}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{p.description}</p>
                        <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-24">{p.content}</pre>
                      </div>
                      <Button size="icon" variant="outline" onClick={() => setEditingPrompt(p)} data-testid={`button-edit-prompt-${p.id}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packages">
          <Card>
            <CardHeader><CardTitle>Gerenciar Pacotes de Créditos</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="border rounded-md p-4" data-testid={`package-item-${pkg.id}`}>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium">{pkg.name}</h3>
                      <Button size="icon" variant="ghost" onClick={() => setEditingPackage(pkg)} data-testid={`button-edit-package-${pkg.id}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-2xl font-bold text-primary">{pkg.credits} créditos</p>
                    <p className="text-lg">{formatPrice(pkg.priceInCents)}</p>
                    <p className="text-sm text-muted-foreground mt-2">{pkg.description}</p>
                    <Badge variant={pkg.isActive ? "default" : "secondary"} className="mt-2">{pkg.isActive ? "Ativo" : "Inativo"}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Visualizar como Diferentes Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Teste a visualização da plataforma como diferentes tipos de usuários. 
                Os links abaixo abrem as páginas em uma nova aba para você ver exatamente 
                o que cada tipo de usuário visualiza.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-md p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Visão do Cliente</h3>
                      <p className="text-sm text-muted-foreground">
                        Provador virtual, catálogo de roupas, créditos
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    O cliente pode fazer upload de foto de perfil, navegar pelo catálogo 
                    de produtos das lojas, experimentar roupas virtualmente e comprar créditos.
                  </p>
                  <Link href="/client">
                    <Button className="w-full" data-testid="button-preview-client">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Dashboard do Cliente
                    </Button>
                  </Link>
                </div>

                <div className="border rounded-md p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Store className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Visão do Lojista</h3>
                      <p className="text-sm text-muted-foreground">
                        Gerenciamento de produtos e configurações
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    O lojista pode cadastrar e gerenciar produtos da sua loja, 
                    configurar informações da loja e ver estatísticas de uso.
                  </p>
                  <Link href="/store">
                    <Button className="w-full" data-testid="button-preview-store">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Dashboard da Loja
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">
                  <strong>Nota:</strong> Como você é um administrador, você tem acesso a todas as 
                  visualizações. Usuários normais só vêem a tela correspondente ao seu tipo de conta.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de ajuste de créditos */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Créditos</DialogTitle>
            <DialogDescription>Usuário: {selectedUser?.name} ({selectedUser?.email})</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Créditos atuais</p>
              <p className="text-2xl font-bold">{selectedUser?.credits}</p>
            </div>
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input type="number" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} placeholder="Ex: 10" data-testid="input-credit-amount" />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => { if (selectedUser && creditAmount) adjustCreditsMutation.mutate({ id: selectedUser.id, amount: -Math.abs(parseInt(creditAmount)) }); }} disabled={!creditAmount || adjustCreditsMutation.isPending} data-testid="button-remove-credits">
              <Minus className="h-4 w-4 mr-2" />Remover
            </Button>
            <Button onClick={() => { if (selectedUser && creditAmount) adjustCreditsMutation.mutate({ id: selectedUser.id, amount: Math.abs(parseInt(creditAmount)) }); }} disabled={!creditAmount || adjustCreditsMutation.isPending} data-testid="button-add-credits">
              <Plus className="h-4 w-4 mr-2" />Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de edição de pacote */}
      <Dialog open={!!editingPackage} onOpenChange={() => setEditingPackage(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Pacote</DialogTitle></DialogHeader>
          {editingPackage && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={editingPackage.name} onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })} data-testid="input-package-name" />
              </div>
              <div className="space-y-2">
                <Label>Créditos</Label>
                <Input type="number" value={editingPackage.credits} onChange={(e) => setEditingPackage({ ...editingPackage, credits: parseInt(e.target.value) || 0 })} data-testid="input-package-credits" />
              </div>
              <div className="space-y-2">
                <Label>Preço (centavos)</Label>
                <Input type="number" value={editingPackage.priceInCents} onChange={(e) => setEditingPackage({ ...editingPackage, priceInCents: parseInt(e.target.value) || 0 })} data-testid="input-package-price" />
                <p className="text-sm text-muted-foreground">Valor: {formatPrice(editingPackage.priceInCents)}</p>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={editingPackage.description || ""} onChange={(e) => setEditingPackage({ ...editingPackage, description: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editingPackage.isActive} onCheckedChange={(checked) => setEditingPackage({ ...editingPackage, isActive: checked })} />
                <Label>Pacote ativo</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => { if (editingPackage) updatePackageMutation.mutate({ id: editingPackage.id, data: editingPackage }); }} disabled={updatePackageMutation.isPending} data-testid="button-save-package">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de edição de prompt */}
      <Dialog open={!!editingPrompt} onOpenChange={() => setEditingPrompt(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Editar Prompt</DialogTitle></DialogHeader>
          {editingPrompt && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={editingPrompt.name} onChange={(e) => setEditingPrompt({ ...editingPrompt, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={editingPrompt.description || ""} onChange={(e) => setEditingPrompt({ ...editingPrompt, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Conteúdo do Prompt</Label>
                <Textarea value={editingPrompt.content} onChange={(e) => setEditingPrompt({ ...editingPrompt, content: e.target.value })} rows={8} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editingPrompt.isActive} onCheckedChange={(checked) => setEditingPrompt({ ...editingPrompt, isActive: checked })} />
                <Label>Prompt ativo</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => { if (editingPrompt) updatePromptMutation.mutate({ id: editingPrompt.id, data: editingPrompt }); }} disabled={updatePromptMutation.isPending} data-testid="button-save-prompt">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de exclusão */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir "{deleteConfirm?.name}"? Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} data-testid="button-confirm-delete">Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
