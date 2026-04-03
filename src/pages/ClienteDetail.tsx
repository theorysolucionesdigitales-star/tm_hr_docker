import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2, Pencil, FileText, Plus, FileDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import ProcesoForm from "@/components/ProcesoForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Constants } from "@/integrations/supabase/types";
import type { Enums, Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";

type ProcesoWithDelete = Tables<"procesos"> & { deleted_at?: string | null, clientes?: { nombre: string } | null };


const ClienteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProcesoWithDelete | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string } | null>(null);

  const { data: cliente } = useQuery({
    queryKey: ["clientes", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("clientes").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: procesos = [] } = useQuery({
    queryKey: ["procesos", "cliente", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("procesos")
        .select("*, clientes(nombre)")
        .eq("cliente_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

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

  const handleStatusChange = async (procesoId: string, estado: Enums<"estado_proceso">) => {
    const { error } = await supabase.from("procesos").update({ estado }).eq("id", procesoId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Estado actualizado");
      queryClient.invalidateQueries({ queryKey: ["procesos", "cliente", id] });
    }
  };

  const handleDelete = async (procesoId: string, isDeleted: boolean) => {
    if (isAdmin && isDeleted) {
        toast.info("Para eliminar permanentemente, edita el proceso.");
        return;
    }
    setConfirmDelete({ id: procesoId });
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

  const executeDelete = async () => {
    if (!confirmDelete) return;
    const { id: procesoId } = confirmDelete;
    const { error } = await (supabase.rpc as any)("soft_delete_proceso", { p_id: procesoId });
    if (error) toast.error(error.message);
    else {
      toast.success("Proceso eliminado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["procesos", "cliente", id] });
    }
    setConfirmDelete(null);
  };

  if (!cliente) return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
      <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-lg overflow-hidden">
         <div className="p-4 border-b border-slate-300 dark:border-slate-700 bg-primary dark:bg-accent">
           <Skeleton className="h-6 w-[200px]" />
         </div>
         <div className="p-4 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
               <div key={i} className="flex gap-4">
                 <Skeleton className="h-6 w-1/3" />
                 <Skeleton className="h-6 w-1/3" />
                 <Skeleton className="h-6 w-1/4 rounded-full" />
               </div>
            ))}
         </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/clientes"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">{cliente.nombre}</h1>
            <p className="text-[15px] text-muted-foreground mt-1">{cliente.industria ?? "Sin industria"} · {cliente.ciudad}, {cliente.pais}</p>
          </div>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} className="transition-all duration-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-primary/25">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Proceso
        </Button>
      </div>

      <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-lg overflow-hidden">
        <div className="p-4 border-b border-slate-300 dark:border-slate-700 bg-primary dark:bg-accent text-primary-foreground">
          <h2 className="font-display text-lg font-semibold">Procesos del Cliente</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%] min-w-[200px]">Nombre Proceso</TableHead>
              <TableHead className="w-[15%] hidden sm:table-cell text-left">Fecha Creación</TableHead>
              <TableHead className="w-[15%] text-left">Estado</TableHead>
              <TableHead className="w-[20%] text-right pr-6">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {procesos.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Sin procesos</TableCell></TableRow>
            ) : (
              procesos.map((p) => (
                <TableRow key={p.id} className="cursor-default transition-colors even:bg-slate-200/80 hover:bg-blue-200/70 dark:even:bg-slate-800/60 dark:hover:bg-emerald-900/40">
                  <TableCell className="py-4 whitespace-normal break-words min-w-[200px]">
                    <div className="flex items-center gap-2">
                        <Link to={`/procesos/${p.id}`} className="font-bold text-[15px] hover:text-primary inline-block leading-tight transition-transform hover:scale-105 origin-left cursor-pointer" onMouseEnter={() => prefetchProcesoDetail(p.id)}>
                          {p.nombre_cargo}
                        </Link>
                        {(p as any).deleted_at && <Badge variant="destructive" className="text-[10px] h-5 px-1.5 whitespace-nowrap">Eliminado</Badge>}
                    </div>
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

      <ProcesoForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} editing={editing} initialClienteId={cliente.id} />

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

export default ClienteDetail;
