import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, Plus, FileText, Pencil, Trash2, Search, FileDown } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import ProcesoForm from "@/components/ProcesoForm";
import { Constants } from "@/integrations/supabase/types";
import type { Enums, Tables } from "@/integrations/supabase/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type ProcesoSortField = "created_at" | "nombre" | "cliente" | "estado";
type ProcesoSortOrder = "asc" | "desc";

type ProcesoWithDelete = Tables<"procesos"> & { deleted_at?: string | null, clientes: { nombre: string } | null };

const Procesos = () => {
   const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProcesoWithDelete | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string } | null>(null);

  const { role, user } = useAuth();
  const isAdmin = role === "admin";

  const { data: procesos = [], isLoading } = useQuery<ProcesoWithDelete[]>({
    queryKey: ["procesos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("procesos")
        .select("*, clientes(nombre)")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false }); // Fallback determinista
      if (error) throw error;
      return data;
    },
  });

  const [searchProceso, setSearchProceso] = useState("");
  const [showTerminados, setShowTerminados] = useState(false);
  const [sortField, setSortField] = useState<ProcesoSortField>("created_at");
  const [sortOrder, setSortOrder] = useState<ProcesoSortOrder>("asc");
  const queryClient = useQueryClient();

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

  const sortedProcesses = useMemo(() => {
    let result = showTerminados
      ? [...procesos]
      : procesos.filter((p) => p.estado !== "Terminado");

    // Junior users only see processes belonging to their assigned clients
    if (role === "junior") {
      const assignedIds = myAssignments.map((a) => a.cliente_id);
      result = result.filter((p) => assignedIds.includes(p.cliente_id));
    }

    if (searchProceso) {
      result = result.filter(p => p.nombre_cargo.toLowerCase().includes(searchProceso.toLowerCase()));
    }

    return result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "nombre":
          comparison = a.nombre_cargo.localeCompare(b.nombre_cargo);
          break;
        case "cliente":
          const clienteA = a.clientes?.nombre || "";
          const clienteB = b.clientes?.nombre || "";
          comparison = clienteA.localeCompare(clienteB);
          break;
        case "estado": {
          const orderIndices = Constants.public.Enums.estado_proceso;
          const indexA = orderIndices.indexOf(a.estado);
          const indexB = orderIndices.indexOf(b.estado);
          comparison = indexA - indexB;
          break;
        }
        case "created_at":
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [procesos, sortField, sortOrder, searchProceso, showTerminados, role, myAssignments]);

  const handleStatusChange = async (id: string, estado: Enums<"estado_proceso">) => {
    const { error } = await supabase.from("procesos").update({ estado }).eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Estado actualizado");
      queryClient.invalidateQueries({ queryKey: ["procesos"] });
    }
  };

  const handleDownloadGantt = async (e: React.MouseEvent, url: string, nombreCargo: string) => {
    e.stopPropagation();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      const extMatch = url.split('?')[0].match(/\.([a-zA-Z0-9]+)$/);
      const ext = extMatch ? extMatch[1] : 'pdf';
      anchor.download = `Carta_Gantt_${nombreCargo.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const handleDelete = async (id: string, isDeleted: boolean) => {
    if (!isAdmin) return;
    setConfirmDelete({ id });
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    const { error } = await (supabase.rpc as any)("soft_delete_proceso", { p_id: id });
    if (error) toast.error(error.message);
    else {
      toast.success("Proceso eliminado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["procesos"] });
    }
    setConfirmDelete(null);
  };

  const prefetchProcesoDetail = useCallback((procesoId: string) => {
    queryClient.prefetchQuery({
      queryKey: ["proceso", procesoId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("procesos")
          .select("*, clientes(nombre, logo_url)")
          .eq("id", procesoId)
          .single();
        if (error) throw error;
        return data;
      },
    });
    queryClient.prefetchQuery({
      queryKey: ["postulantes", procesoId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("postulantes")
          .select("*")
          .eq("proceso_id", procesoId)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false });
        if (error) throw error;
        return data;
      },
    });
    queryClient.prefetchQuery({
      queryKey: ["perfiles_cargo", procesoId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("perfiles_cargo")
          .select("*")
          .eq("proceso_id", procesoId)
          .order("orden");
        if (error) throw error;
        return data;
      },
    });
  }, [queryClient]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Procesos</h1>
          <p className="text-[15px] text-muted-foreground mt-1">Procesos activos de búsqueda</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="transition-all duration-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-primary/25">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Proceso
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full max-w-sm sm:w-[300px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar proceso..."
            value={searchProceso}
            onChange={(e) => setSearchProceso(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Ordenar por:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 w-[180px] justify-between bg-secondary/50 font-semibold px-3">
                {sortField === "created_at" && "Fecha de creación"}
                {sortField === "nombre" && "Nombre"}
                {sortField === "cliente" && "Cliente"}
                {sortField === "estado" && "Estado"}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuRadioGroup value={sortField} onValueChange={(val) => setSortField(val as ProcesoSortField)}>
                <DropdownMenuRadioItem value="nombre">Nombre</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="cliente">Cliente</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="created_at">Fecha de creación</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="estado">Estado</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={sortOrder} onValueChange={(val) => setSortOrder(val as ProcesoSortOrder)}>
                <DropdownMenuRadioItem value="asc">Ascendente</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="desc">Descendente</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-lg overflow-hidden">
        <div className="p-4 border-b border-slate-300 dark:border-slate-700 flex items-center justify-between bg-primary dark:bg-accent text-primary-foreground">
          <h2 className="font-display text-lg font-semibold">{showTerminados ? "Todos los Procesos" : "Procesos Activos"}</h2>
          <div className="flex items-center gap-2">
            <Checkbox
              id="showTerminados"
              checked={showTerminados}
              onCheckedChange={(checked) => setShowTerminados(checked === true)}
              className="border-primary-foreground/50 data-[state=checked]:bg-primary-foreground data-[state=checked]:text-primary dark:data-[state=checked]:text-accent"
            />
            <label htmlFor="showTerminados" className="text-sm text-primary-foreground/90 cursor-pointer select-none">
              Mostrar procesos terminados
            </label>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%] min-w-[200px]">Nombre Cargo</TableHead>
              <TableHead className="w-[20%] hidden md:table-cell text-left">Cliente</TableHead>
              <TableHead className="w-[15%] hidden sm:table-cell text-left">Fecha Creación</TableHead>
              <TableHead className="w-[15%] text-left">Estado</TableHead>
              <TableHead className="w-[20%] text-right pr-6">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-[80%] max-w-[200px]" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[60%]" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-[40%]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       <Skeleton className="h-8 w-8 rounded-md" />
                       <Skeleton className="h-8 w-8 rounded-md" />
                       <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : sortedProcesses.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No hay procesos activos</TableCell></TableRow>
            ) : (
              sortedProcesses.map((p) => (
                <TableRow key={p.id} className="cursor-default transition-colors even:bg-slate-200/80 hover:bg-blue-200/70 dark:even:bg-slate-800/60 dark:hover:bg-emerald-900/40">
                  <TableCell className="py-4 whitespace-normal break-words min-w-[200px]">
                    <div className="flex items-center gap-2">
                        <Link to={`/procesos/${p.id}`} className="font-bold text-[15px] hover:text-primary inline-block leading-tight transition-transform hover:scale-105 origin-left cursor-pointer" onMouseEnter={() => prefetchProcesoDetail(p.id)}>
                          {p.nombre_cargo}
                        </Link>
                        {(p as any).deleted_at && <Badge variant="destructive" className="text-[10px] h-5 px-1.5 whitespace-nowrap">Eliminado</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-foreground/80">
                    {(p.clientes as any)?.nombre ?? "—"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-foreground/80">
                    {new Date(p.created_at).toLocaleDateString("es-CL")}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={p.estado}
                      onValueChange={(v) => handleStatusChange(p.id, v as Enums<"estado_proceso">)}
                    >
                      <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Constants.public.Enums.estado_proceso.map((e) => (
                          <SelectItem key={e} value={e}>{e}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right space-x-1 pr-4 whitespace-nowrap">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id, !!(p as any).deleted_at)} title="Eliminar" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(p as ProcesoWithDelete); setFormOpen(true); }} title="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {p.carta_gantt_url && (
                      <Button variant="ghost" size="icon" onClick={(e) => handleDownloadGantt(e, p.carta_gantt_url!, p.nombre_cargo)} title="Descargar Carta Gantt">
                        <FileDown className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" asChild title="Ver Reporte">
                      <Link to={`/procesos/${p.id}`}>
                        <FileText className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ProcesoForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} editing={editing} />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(v) => !v && setConfirmDelete(null)}
        onConfirm={executeDelete}
        title="¿Eliminar proceso?"
        description="El proceso desaparecerá de tu vista junto con todos sus postulantes asociados."
        confirmText="Eliminar"
        variant="destructive"
      />
    </div>
  );
};

export default Procesos;
