import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2, Eye, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import ClienteForm from "@/components/ClienteForm";
import type { Tables } from "@/integrations/supabase/types";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";

type ClienteSortField = "created_at" | "nombre" | "industria" | "ciudad";
type ClienteSortOrder = "asc" | "desc";

type ClienteWithDelete = Tables<"clientes"> & { deleted_at?: string | null };

const Clientes = () => {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
   const [editing, setEditing] = useState<ClienteWithDelete | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string } | null>(null);
  const queryClient = useQueryClient();
  const { role, user } = useAuth();
  const isAdmin = role === "admin";

  const { data: clientes = [], isLoading } = useQuery<ClienteWithDelete[]>({
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

  const { data: myAssignments = [] } = useQuery({
    queryKey: ["user_client_assignments", "mine"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_client_assignments")
        .select("cliente_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: role === "junior" && !!user,
  });

  const [sortField, setSortField] = useState<ClienteSortField>("created_at");
  const [sortOrder, setSortOrder] = useState<ClienteSortOrder>("asc");

  const filtered = useMemo(() => {
    let result = clientes;

    if (role === "junior") {
      const assignedIds = myAssignments.map((a) => a.cliente_id);
      result = result.filter((c) => assignedIds.includes(c.id));
    }

    result = result.filter((c) =>
      c.nombre.toLowerCase().includes(search.toLowerCase())
    );

    return result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "nombre":
          comparison = a.nombre.localeCompare(b.nombre);
          break;
        case "industria":
          if (!a.industria && !b.industria) comparison = 0;
          else if (!a.industria) comparison = 1;
          else if (!b.industria) comparison = -1;
          else comparison = a.industria.localeCompare(b.industria);
          break;
        case "ciudad":
          if (!a.ciudad && !b.ciudad) comparison = 0;
          else if (!a.ciudad) comparison = 1;
          else if (!b.ciudad) comparison = -1;
          else comparison = a.ciudad.localeCompare(b.ciudad);
          break;
        case "created_at":
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [clientes, search, sortField, sortOrder, role, myAssignments]);

  const handleEdit = (cliente: Tables<"clientes">) => {
    setEditing(cliente);
    setFormOpen(true);
  };

  const handleClose = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleDelete = async (id: string, isDeleted: boolean) => {
    if (isAdmin && isDeleted) {
        toast.info("Para eliminar permanentemente, edita el cliente.");
        return;
    }
    
    setConfirmDelete({ id });
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    const { error } = await (supabase.rpc as any)("soft_delete_cliente", { p_id: id });
    if (error) toast.error(error.message);
    else {
        toast.success("Cliente eliminado exitosamente");
        queryClient.invalidateQueries({ queryKey: ["clientes"] });
    }
    setConfirmDelete(null);
  };

  const prefetchClienteDetail = useCallback((clienteId: string) => {
    queryClient.prefetchQuery({
      queryKey: ["clientes", clienteId],
      queryFn: async () => {
        const { data, error } = await supabase.from("clientes").select("*").eq("id", clienteId).single();
        if (error) throw error;
        return data;
      },
    });
    queryClient.prefetchQuery({
      queryKey: ["procesos", "cliente", clienteId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("procesos")
          .select("*")
          .eq("cliente_id", clienteId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data;
      },
    });
  }, [queryClient]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-[15px] text-muted-foreground mt-1">Gestiona los clientes registrados</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="transition-all duration-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-primary/25">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            maxLength={80}
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Ordenar por:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 w-[180px] justify-between bg-secondary/50 font-semibold px-3">
                {sortField === "created_at" && "Fecha de creación"}
                {sortField === "nombre" && "Nombre"}
                {sortField === "industria" && "Industria"}
                {sortField === "ciudad" && "Ciudad"}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuRadioGroup value={sortField} onValueChange={(val) => setSortField(val as ClienteSortField)}>
                <DropdownMenuRadioItem value="nombre">Nombre</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="industria">Industria</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="ciudad">Ciudad</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="created_at">Fecha de creación</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={sortOrder} onValueChange={(val) => setSortOrder(val as ClienteSortOrder)}>
                <DropdownMenuRadioItem value="asc">Ascendente</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="desc">Descendente</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-lg overflow-hidden">
        <div className="p-4 border-b border-slate-300 dark:border-slate-700 bg-primary dark:bg-accent text-primary-foreground">
          <h2 className="font-display text-lg font-semibold">Lista de Clientes</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[35%] min-w-[200px]">Nombre Cliente</TableHead>
              <TableHead className="w-[15%] hidden md:table-cell text-left">RUT</TableHead>
              <TableHead className="w-[20%] hidden md:table-cell text-left">Industria</TableHead>
              <TableHead className="w-[15%] hidden sm:table-cell text-left">Ciudad</TableHead>
              <TableHead className="w-[15%] text-right pr-6">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-[80%] max-w-[200px]" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[60%]" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[70%]" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-[50%]" /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       <Skeleton className="h-8 w-8 rounded-md" />
                       <Skeleton className="h-8 w-8 rounded-md" />
                       <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No se encontraron clientes</TableCell></TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id} className="transition-colors even:bg-slate-200/80 hover:bg-blue-200/70 dark:even:bg-slate-800/60 dark:hover:bg-emerald-900/40">
                  <TableCell className="py-4 whitespace-normal break-words min-w-[200px]">
                    <div className="flex items-center gap-2">
                        <Link to={`/clientes/${c.id}`} className="font-bold text-[15px] hover:text-primary inline-block leading-tight transition-transform hover:scale-105 origin-left cursor-pointer" onMouseEnter={() => prefetchClienteDetail(c.id)}>
                          {c.nombre}
                        </Link>
                        {/* Soft Delete Badge */}
                        {(c as any).deleted_at && <Badge variant="destructive" className="text-[10px] h-5 px-1.5">Eliminado</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-foreground/80">{c.rut ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell text-foreground/80">{c.industria ?? "—"}</TableCell>
                  <TableCell className="hidden sm:table-cell text-foreground/80">{c.ciudad ?? "—"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id, !!(c as any).deleted_at)} title="Eliminar" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(c)} title="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" asChild title="Ver Procesos">
                      <Link to={`/clientes/${c.id}`} onMouseEnter={() => prefetchClienteDetail(c.id)}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ClienteForm
        open={formOpen}
        onClose={handleClose}
        editing={editing}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(v) => !v && setConfirmDelete(null)}
        onConfirm={executeDelete}
        title="¿Eliminar cliente?"
        description="El cliente desaparecerá de tu vista junto con todos sus procesos asociados."
        confirmText="Eliminar"
        variant="destructive"
      />
    </div>
  );
};

export default Clientes;
