import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getSupabase } from "@/lib/supabase";
import { toCamelCase } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { insertPromptSchema, type InsertPrompt, type Prompt } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, FileText, Edit, Trash2, Loader2, CheckCircle, XCircle } from "lucide-react";

export default function PromptManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  const form = useForm<InsertPrompt>({
    resolver: zodResolver(insertPromptSchema),
    defaultValues: {
      name: "",
      content: "",
      isActive: true,
    },
  });

  const { data: prompts, isLoading } = useQuery({
    queryKey: ["/api/prompts"],
    queryFn: async () => {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return toCamelCase<Prompt[]>(data);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertPrompt) => {
      return await apiRequest("POST", "/api/prompts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      toast({ title: "Prompt criado!", description: "O prompt foi adicionado com sucesso." });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível criar o prompt.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertPrompt & { id: string }) => {
      return await apiRequest("PATCH", `/api/prompts/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      toast({ title: "Prompt atualizado!", description: "As alterações foram salvas." });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível atualizar o prompt.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/prompts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      toast({ title: "Prompt excluído!", description: "O prompt foi removido." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível excluir o prompt.", variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return await apiRequest("PATCH", `/api/prompts/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
    },
  });

  function handleOpenEdit(prompt: Prompt) {
    setEditingPrompt(prompt);
    form.reset({
      name: prompt.name,
      content: prompt.content,
      isActive: prompt.isActive,
    });
    setIsDialogOpen(true);
  }

  function handleCloseDialog() {
    setIsDialogOpen(false);
    setEditingPrompt(null);
    form.reset();
  }

  function onSubmit(data: InsertPrompt) {
    if (editingPrompt) {
      updateMutation.mutate({ ...data, id: editingPrompt.id });
    } else {
      createMutation.mutate(data);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Gerenciar Prompts
              </CardTitle>
              <CardDescription>
                Configure os prompts usados na geração de imagens
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => open ? setIsDialogOpen(true) : handleCloseDialog()}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-prompt">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Prompt
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingPrompt ? "Editar Prompt" : "Novo Prompt"}
                  </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Prompt</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Prompt Principal" data-testid="input-prompt-name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conteúdo do Prompt</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Digite o prompt para geração de imagens..."
                              className="min-h-[200px] font-mono text-sm"
                              data-testid="input-prompt-content"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Use {"{user_image}"} para a foto do usuário e {"{clothing_image}"} para a roupa.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <FormLabel className="text-base">Prompt Ativo</FormLabel>
                            <FormDescription>
                              Apenas prompts ativos são usados na geração
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-prompt-active"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={handleCloseDialog} className="flex-1">
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={createMutation.isPending || updateMutation.isPending}
                        className="flex-1"
                        data-testid="button-save-prompt"
                      >
                        {createMutation.isPending || updateMutation.isPending ? (
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
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-1/3 mb-2" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : prompts?.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum prompt cadastrado</h3>
              <p className="text-muted-foreground mb-4">
                Crie um prompt para começar a gerar imagens
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {prompts?.map((prompt) => (
                <div
                  key={prompt.id}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                  data-testid={`card-prompt-${prompt.id}`}
                >
                  <div className={`p-3 rounded-lg ${prompt.isActive ? "bg-green-100 dark:bg-green-900/20" : "bg-muted"}`}>
                    {prompt.isActive ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{prompt.name}</h3>
                      <Badge variant={prompt.isActive ? "default" : "secondary"}>
                        {prompt.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 font-mono">
                      {prompt.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Atualizado em {format(new Date(prompt.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={prompt.isActive}
                      onCheckedChange={(isActive) => toggleMutation.mutate({ id: prompt.id, isActive })}
                      disabled={toggleMutation.isPending}
                    />
                    <Button size="icon" variant="ghost" onClick={() => handleOpenEdit(prompt)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir prompt?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O prompt será removido permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(prompt.id)}
                            className="bg-destructive text-destructive-foreground"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
