import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
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
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Users, Store, ShoppingBag, Sparkles, CreditCard, Trash2, Edit, Plus, Minus, Shield, LogOut } from "lucide-react";

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

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");
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

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Acesso restrito a administradores.</p>
            <Link href="/">
              <Button className="w-full mt-4">Voltar ao início</Button>
            </Link>
          </CardContent>
        </Card>
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
                  {user?.name ? getInitials(user.name) : "A"}
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
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="font-serif text-3xl font-bold text-foreground">Painel Administrativo</h1>
          </div>
          <p className="text-muted-foreground">Gerencie usuários, lojas, produtos, prompts e pacotes de créditos</p>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Usuários</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.clientCount} clientes, {stats.storeCount} lojas, {stats.adminCount} admins
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
                  <span className="text-sm text-muted-foreground">Créditos em circulação</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalCreditsInCirculation}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="h-4 w-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="stores" data-testid="tab-stores">
              <Store className="h-4 w-4 mr-2" />
              Lojas
            </TabsTrigger>
            <TabsTrigger value="products" data-testid="tab-products">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="prompts" data-testid="tab-prompts">
              <Sparkles className="h-4 w-4 mr-2" />
              Prompts IA
            </TabsTrigger>
            <TabsTrigger value="packages" data-testid="tab-packages">
              <CreditCard className="h-4 w-4 mr-2" />
              Pacotes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <p className="text-muted-foreground">Carregando...</p>
                ) : (
                  <div className="space-y-2">
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

          <TabsContent value="stores" className="space-y-4">
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

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Gerenciar Produtos</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((p) => (
                    <Card key={p.id} data-testid={`product-card-${p.id}`}>
                      <CardContent className="pt-4">
                        <div className="aspect-square mb-2 overflow-hidden rounded-md">
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <h3 className="font-medium truncate">{p.name}</h3>
                        <p className="text-sm text-muted-foreground">Loja: {p.store?.name || "Desconhecida"}</p>
                        <Button size="sm" variant="destructive" className="mt-2 w-full" onClick={() => setDeleteConfirm({ type: "product", id: p.id, name: p.name })} data-testid={`button-delete-product-${p.id}`}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {products.length === 0 && <p className="text-muted-foreground text-center py-4">Nenhum produto cadastrado</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prompts" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Gerenciar Prompts da IA</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {prompts.map((p) => (
                    <Card key={p.id} data-testid={`prompt-card-${p.id}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium">{p.name}</h3>
                              <Badge variant={p.isActive ? "default" : "secondary"}>{p.isActive ? "Ativo" : "Inativo"}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{p.description}</p>
                            <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-32">{p.content}</pre>
                          </div>
                          <Button size="icon" variant="outline" onClick={() => setEditingPrompt(p)} data-testid={`button-edit-prompt-${p.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="packages" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Gerenciar Pacotes de Créditos</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {packages.map((pkg) => (
                    <Card key={pkg.id} data-testid={`package-card-${pkg.id}`}>
                      <CardContent className="pt-4">
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

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
              <Minus className="h-4 w-4 mr-2" />
              Remover
            </Button>
            <Button onClick={() => { if (selectedUser && creditAmount) adjustCreditsMutation.mutate({ id: selectedUser.id, amount: Math.abs(parseInt(creditAmount)) }); }} disabled={!creditAmount || adjustCreditsMutation.isPending} data-testid="button-add-credits">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
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
                <Label>Preço (em centavos)</Label>
                <Input type="number" value={editingPackage.priceInCents} onChange={(e) => setEditingPackage({ ...editingPackage, priceInCents: parseInt(e.target.value) || 0 })} data-testid="input-package-price" />
                <p className="text-sm text-muted-foreground">Valor: {formatPrice(editingPackage.priceInCents)}</p>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={editingPackage.description || ""} onChange={(e) => setEditingPackage({ ...editingPackage, description: e.target.value })} data-testid="input-package-description" />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editingPackage.isActive} onCheckedChange={(checked) => setEditingPackage({ ...editingPackage, isActive: checked })} data-testid="switch-package-active" />
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
                <Input value={editingPrompt.name} onChange={(e) => setEditingPrompt({ ...editingPrompt, name: e.target.value })} data-testid="input-prompt-name" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={editingPrompt.description || ""} onChange={(e) => setEditingPrompt({ ...editingPrompt, description: e.target.value })} data-testid="input-prompt-description" />
              </div>
              <div className="space-y-2">
                <Label>Conteúdo do Prompt</Label>
                <Textarea value={editingPrompt.content} onChange={(e) => setEditingPrompt({ ...editingPrompt, content: e.target.value })} rows={8} data-testid="textarea-prompt-content" />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editingPrompt.isActive} onCheckedChange={(checked) => setEditingPrompt({ ...editingPrompt, isActive: checked })} data-testid="switch-prompt-active" />
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
