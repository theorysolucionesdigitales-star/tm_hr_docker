import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Constants } from "@/integrations/supabase/types";
import type { Enums } from "@/integrations/supabase/types";
import { Trash2, Pencil, UserPlus, X, Eye, EyeOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const Usuarios = () => {
  const { role: currentRole, user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<{ user_id: string; display_name: string } | null>(null);
  const [editForm, setEditForm] = useState({ display_name: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string } | null>(null);

  // States for Create User
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ email: "", password: "", display_name: "", role: "junior" as Enums<"app_role"> });
  const [creating, setCreating] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase.from("profiles").select("*");
      if (error) throw error;

      const { data: roles, error: rErr } = await supabase.from("user_roles").select("*");
      if (rErr) throw rErr;

      return profiles.map((p) => ({
        ...p,
        role: roles.find((r) => r.user_id === p.user_id)?.role ?? "junior",
        roleId: roles.find((r) => r.user_id === p.user_id)?.id,
      }));
    },
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["user_client_assignments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_client_assignments").select("*");
      if (error) throw error;
      return data;
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, roleId, newRole }: { userId: string; roleId?: string; newRole: Enums<"app_role"> }) => {
      if (roleId) {
        const { error } = await supabase.from("user_roles").update({ role: newRole }).eq("id", roleId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      toast.success("Rol actualizado");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      toast.error("No puedes eliminarte a ti mismo.");
      return;
    }
    setConfirmDelete({ id: userId });
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    const { id: userId } = confirmDelete;
    const { error } = await (supabase.rpc as any)("delete_user", { p_user_id: userId });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Usuario eliminado");
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    }
    setConfirmDelete(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      if (createForm.password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");
      
      // Secondary client to avoid hijacking current admin session
      const authClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );

      const { data, error } = await authClient.auth.signUp({
        email: createForm.email.trim(),
        password: createForm.password,
        options: {
          data: { 
            display_name: createForm.display_name.trim(),
            role: createForm.role 
          }
        }
      });

      if (error) throw error;
      
      toast.success("Usuario creado exitosamente");
      setCreateOpen(false);
      setCreateForm({ email: "", password: "", display_name: "", role: "junior" });
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleEditOpen = (u: { user_id: string; display_name: string | null }) => {
    setEditingUser({ user_id: u.user_id, display_name: u.display_name ?? "" });
    setEditForm({ display_name: u.display_name ?? "", password: "" });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (editForm.display_name.trim()) {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: editForm.display_name.trim() })
        .eq("user_id", editingUser.user_id);
      if (error) {
        toast.error(error.message);
        return;
      }
    }

    if (editForm.password.trim()) {
      if (editForm.password.length < 6) {
        toast.error("La contraseña debe tener al menos 6 caracteres");
        return;
      }
      const { error } = await supabase.auth.admin.updateUserById(editingUser.user_id, {
        password: editForm.password,
      });
      if (error) {
        // Fallback: If admin API isn't available, try updating own password
        if (editingUser.user_id === currentUser?.id) {
          const { error: selfErr } = await supabase.auth.updateUser({ password: editForm.password });
          if (selfErr) {
            toast.error("Error actualizando contraseña: " + selfErr.message);
            return;
          }
        } else {
          toast.error("No se pudo actualizar la contraseña. (Se requiere permisos de servicio)");
          return;
        }
      }
    }

    toast.success("Usuario actualizado");
    queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    setEditOpen(false);
  };

  const handleAssignClient = async (userId: string, clienteId: string) => {
    const { error } = await supabase.from("user_client_assignments").insert({
      user_id: userId,
      cliente_id: clienteId,
      assigned_by: currentUser?.id,
    });
    if (error) {
      if (error.code === "23505") {
        toast.error("Este cliente ya está asignado a este usuario");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Cliente asignado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["user_client_assignments"] });
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    const { error } = await supabase.from("user_client_assignments").delete().eq("id", assignmentId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Asignación removida");
      queryClient.invalidateQueries({ queryKey: ["user_client_assignments"] });
    }
  };

  const getAssignedClients = (userId: string) => {
    return assignments.filter((a) => a.user_id === userId);
  };

  const getAvailableClients = (userId: string) => {
    const assigned = assignments.filter((a) => a.user_id === userId).map((a) => a.cliente_id);
    return clientes.filter((c) => !assigned.includes(c.id));
  };

  if (currentRole !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground animate-fade-in">
        <h2 className="text-xl font-display font-semibold mb-2">Acceso Denegado</h2>
        <p>No tienes permisos suficientes para ver el módulo de usuarios.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-[15px] text-muted-foreground mt-1">Administración de usuarios del sistema</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <UserPlus className="w-4 h-4" /> Registrar Nuevo Usuario
        </Button>
      </div>

      <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-lg overflow-hidden">
        <div className="p-4 border-b border-slate-300 dark:border-slate-700 bg-primary dark:bg-accent text-primary-foreground">
          <h2 className="font-display text-lg font-semibold">Lista de Usuarios</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%] min-w-[150px]">Nombre Usuario</TableHead>
              <TableHead className="w-[20%] text-left">Perfil de Usuario</TableHead>
              <TableHead className="w-[35%] text-left">Clientes Asignados</TableHead>
              {currentRole === "admin" && <TableHead className="w-[15%] text-right pr-6">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-[80%] max-w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-[160px] rounded-md" /></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      <Skeleton className="h-5 w-24 rounded-full" />
                      <Skeleton className="h-5 w-32 rounded-full" />
                    </div>
                  </TableCell>
                  {currentRole === "admin" && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                         <Skeleton className="h-8 w-8 rounded-md" />
                         <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              users.map((u) => {
                const userAssignments = getAssignedClients(u.user_id);
                const availableClients = getAvailableClients(u.user_id);

                return (
                  <TableRow key={u.id} className="transition-colors even:bg-slate-200/80 hover:bg-blue-200/70 dark:even:bg-slate-800/60 dark:hover:bg-emerald-900/40">
                    <TableCell className="py-4 font-bold whitespace-normal break-words min-w-[150px] leading-tight">
                      {u.display_name}
                    </TableCell>
                    <TableCell>
                      {currentRole === "admin" ? (
                        <Select
                          value={u.role}
                          onValueChange={(v) =>
                            updateRole.mutate({ userId: u.user_id, roleId: u.roleId, newRole: v as Enums<"app_role"> })
                          }
                        >
                          <SelectTrigger className="w-[160px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Constants.public.Enums.app_role.map((r) => (
                              <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="capitalize text-muted-foreground">{u.role}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.role === "junior" ? (
                        <div className="flex flex-wrap gap-1.5">
                          {userAssignments.length === 0 ? (
                            <span className="text-xs text-muted-foreground italic">Sin clientes asignados</span>
                          ) : (
                            userAssignments.map((a) => {
                              const cliente = clientes.find((c) => c.id === a.cliente_id);
                              return (
                                <Badge key={a.id} variant="secondary" className="gap-1 pr-1">
                                  {cliente?.nombre ?? "..."}
                                  <button
                                    onClick={() => handleRemoveAssignment(a.id)}
                                    className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5 transition-colors"
                                    title="Remover asignación"
                                  >
                                    <X className="h-3 w-3 text-destructive" />
                                  </button>
                                </Badge>
                              );
                            })
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Todos (acceso completo)</span>
                      )}
                    </TableCell>
                    {currentRole === "admin" && (
                      <TableCell className="text-right space-x-1">
                        {currentUser?.id !== u.user_id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(u.user_id)}
                            title="Eliminar usuario"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditOpen(u)}
                          title="Editar usuario"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {u.role === "junior" && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Asignar cliente"
                                className="text-primary hover:text-primary"
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 p-0" align="end">
                              <div className="px-3 py-2.5 border-b">
                                <p className="text-sm font-bold tracking-tight">Asignar Cliente</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Selecciona un cliente de la lista</p>
                              </div>
                              {availableClients.length === 0 ? (
                                <p className="text-xs text-muted-foreground px-3 py-4 text-center">Todos los clientes ya están asignados</p>
                              ) : (
                                <div className="p-1.5">
                                  <div className="max-h-[180px] overflow-y-auto space-y-0.5">
                                    {availableClients.map((c) => (
                                      <button
                                        key={c.id}
                                        onClick={() => handleAssignClient(u.user_id, c.id)}
                                        className="w-full text-left px-2.5 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                                      >
                                        {c.nombre}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </PopoverContent>
                          </Popover>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={(v) => !v && setEditOpen(false)}>
        <DialogContent className="max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="font-display">Editar Usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre de Usuario</Label>
              <Input
                value={editForm.display_name}
                onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                placeholder="Nombre del usuario"
                maxLength={60}
              />
            </div>
            <div className="space-y-2">
              <Label>Nueva Contraseña <span className="text-muted-foreground text-xs">(dejar vacío para no cambiar)</span></Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="••••••"
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para Crear Usuario (Solo Admins) */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nombre de Usuario</Label>
              <Input
                value={createForm.display_name}
                onChange={(e) => setCreateForm({ ...createForm, display_name: e.target.value })}
                placeholder="Nombre completo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Correo electrónico</Label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="correo@tailormade.cl"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Contraseña provisional</Label>
              <Input
                type="text"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label>Rol Inicial</Label>
              <Select
                value={createForm.role}
                onValueChange={(val: Enums<"app_role">) => setCreateForm({ ...createForm, role: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="consultor">Consultor</SelectItem>
                  <SelectItem value="junior">Junior</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
                Cancelar
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Registrando..." : "Crear Usuario"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(v) => !v && setConfirmDelete(null)}
        onConfirm={executeDelete}
        title="¿Eliminar usuario?"
        description="Esta acción es irreversible y eliminará todos los accesos del usuario al sistema."
        confirmText="Eliminar"
        variant="destructive"
      />
    </div>
  );
};

export default Usuarios;
