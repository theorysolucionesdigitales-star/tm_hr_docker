import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, ArrowLeft, ExternalLink, FileDown, Plus, Pencil, Link as LinkIcon, Trash2, Search, Copy, CheckCircle2, Share2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import PostulanteForm from "@/components/PostulanteForm";
import ObservacionesResearchForm from "@/components/ObservacionesResearchForm";
import { generateReportPDF } from "@/lib/pdfReport";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables } from "@/integrations/supabase/types";
import { Constants } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Perfila':
    case 'CO Entregada':
      return 'bg-blue-500/90 hover:bg-blue-600 text-white border-transparent shadow-sm';
    case 'Placed':
    case 'CO Aceptada':
      return 'bg-emerald-500/90 hover:bg-emerald-600 text-white border-transparent shadow-sm';
    case 'Llamar - Pendiente Contacto':
    case 'Plan B':
      return 'bg-amber-500/90 hover:bg-amber-600 text-white border-transparent shadow-sm';
    case 'No responde al perfil':
    case 'No interesado':
    case 'Excede Renta':
    case 'CO Rechazada':
      return 'bg-rose-500/90 hover:bg-rose-600 text-white border-transparent shadow-sm';
    default:
      return 'bg-slate-500/90 hover:bg-slate-600 text-white border-transparent shadow-sm';
  }
};

const statusPriority: Record<string, number> = {
  "Placed": 1,
  "CO Aceptada": 2,
  "CO Entregada": 3,
  "Perfila": 4,
  "Plan B": 5,
  "Llamar - Pendiente Contacto": 6,
  "Excede Renta": 7,
  "No interesado": 8,
  "No responde al perfil": 9,
  "CO Rechazada": 10,
};

type PostulanteSortField = "nombre" | "status" | "renta" | "empresa" | "created_at";
type PostulanteSortOrder = "asc" | "desc";
type PostulanteWithDelete = Tables<"postulantes"> & { deleted_at?: string | null };

const TextExpandable = ({ children, fullText, className }: { children: React.ReactNode, fullText: string, className?: string }) => {
  if (!fullText || fullText === "—" || fullText === "Sin observaciones") {
    return <div className={className}>{children}</div>;
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div 
          className={cn(
            "cursor-pointer inline-block w-full transition-all duration-300 origin-left hover:text-primary hover:scale-[1.02] rounded px-1 -mx-1 relative group focus:outline-none", 
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
          {/* Pequeña capa invisible para hacerlo clickeable y un tooltip nativo opcional por si no dan click */}
          <span className="sr-only">Hacer click para expandir</span>
        </div>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="max-w-[350px] p-4 shadow-xl z-50 border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
        <p className="text-[13px] leading-relaxed break-words font-medium">{fullText}</p>
      </PopoverContent>
    </Popover>
  );
};

const RentaExpandable = ({ children, p, className }: { children: React.ReactNode, p: PostulanteWithDelete, className?: string }) => {
  const formatCurrency = (val: number | null) =>
    val ? `$${val.toLocaleString("es-CL")}` : "—";

  const hasSomething = p.pretension_renta || p.renta_actual || p.benef_act;
  if (!hasSomething) {
    return <div className={className}>{children}</div>;
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div 
          className={cn(
            "cursor-pointer inline-block w-full transition-all duration-300 origin-left hover:text-primary hover:scale-[1.02] rounded px-1 -mx-1 relative group focus:outline-none", 
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
          <span className="sr-only">Hacer click para expandir</span>
        </div>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="max-w-[320px] p-4 shadow-xl z-50 border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Pretensión de renta</p>
            <p className="text-[14px] font-semibold text-foreground">{p.pretension_renta ? formatCurrency(p.pretension_renta) : "—"}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Renta Actual</p>
            <p className="text-[14px] font-semibold text-foreground">{p.renta_actual ? formatCurrency(p.renta_actual) : "—"}</p>
          </div>
          {p.benef_act && (
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Beneficios Actuales</p>
              <p className="text-[13px] leading-relaxed break-words font-medium text-foreground mt-0.5">{p.benef_act}</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const ExperienceExpandable = ({ children, p, className }: { children: React.ReactNode, p: PostulanteWithDelete, className?: string }) => {
  const experiences = [
    { cargo: p.cargo_actual, empresa: p.empresa, inicio: p.fecha_inicio_1, fin: p.fecha_fin_1 },
    { cargo: p.cargo_2, empresa: p.empresa_2, inicio: p.fecha_inicio_2, fin: p.fecha_fin_2 },
    { cargo: p.cargo_3, empresa: p.empresa_3, inicio: p.fecha_inicio_3, fin: p.fecha_fin_3 },
    { cargo: p.cargo_4, empresa: p.empresa_4, inicio: p.fecha_inicio_4, fin: p.fecha_fin_4 },
    { cargo: p.cargo_5, empresa: p.empresa_5, inicio: p.fecha_inicio_5, fin: p.fecha_fin_5 },
    { cargo: p.cargo_6, empresa: p.empresa_6, inicio: p.fecha_inicio_6, fin: p.fecha_fin_6 },
  ].filter(e => e.cargo || e.empresa);

  if (experiences.length === 0) {
    return <div className={className}>{children}</div>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div 
          className={cn(
            "cursor-pointer inline-block w-full transition-all duration-300 origin-left hover:text-primary hover:scale-[1.02] rounded px-1 -mx-1 relative group focus:outline-none", 
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
          <span className="sr-only">Hacer click para ver más experiencias</span>
        </div>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="max-w-[400px] p-4 shadow-xl z-50 border-slate-200 dark:border-slate-800 max-h-[350px] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-3">
          {experiences.map((exp, idx) => (
            <div key={idx} className={cn("flex flex-col gap-0.5", idx !== 0 && "pt-3 border-t border-slate-100 dark:border-slate-800")}>
              {(exp.inicio || exp.fin) && (
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {exp.inicio || ""} {exp.inicio && exp.fin ? "–" : ""} {exp.fin || ""}
                </span>
              )}
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                {exp.cargo || "—"}
              </span>
              <span className="text-[12px] text-muted-foreground">
                {exp.empresa || "—"}
              </span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const CandidateExpandable = ({ children, p, className }: { children: React.ReactNode, p: PostulanteWithDelete, className?: string }) => {
  const academics = [
    { titulo: p.estudios, inst: p.institucion },
    { titulo: p.estudios_2, inst: p.institucion_2 },
    { titulo: p.estudios_3, inst: p.institucion_3 },
  ].filter(a => a.titulo || a.inst);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div 
          className={cn(
            "cursor-pointer inline-block w-full transition-all duration-300 origin-left hover:text-primary hover:scale-[1.02] rounded px-1 -mx-1 relative group focus:outline-none", 
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
          <span className="sr-only">Hacer click para ver antecedentes académicos</span>
        </div>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="max-w-[400px] p-5 shadow-xl z-50 border-slate-200 dark:border-slate-800 max-h-[450px] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Antecedentes Académicos</span>
            {academics.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">Sin antecedentes académicos registrados.</p>
            ) : (
              academics.map((acad, idx) => (
                <div key={idx} className={cn("flex flex-col gap-0.5", idx !== 0 && "pt-3 border-t border-slate-100 dark:border-slate-800")}>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-tight">
                    {acad.titulo || "Sin título"}
                  </span>
                  <span className="text-[12px] text-muted-foreground">
                    {acad.inst || "—"}
                  </span>
                </div>
              ))
            )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const ProcesoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);
  const [editingPostulante, setEditingPostulante] = useState<PostulanteWithDelete | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string } | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<{ id: string, newStatus: string } | null>(null);
  const [sortField, setSortField] = useState<PostulanteSortField>("created_at");
  const [sortOrder, setSortOrder] = useState<PostulanteSortOrder>("asc");
  const [searchPostulante, setSearchPostulante] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [obsOpen, setObsOpen] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [allCopied, setAllCopied] = useState(false);
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const { data: proceso } = useQuery({
    queryKey: ["proceso", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("procesos")
        .select("*, clientes(nombre, logo_url)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: postulantes = [] } = useQuery<PostulanteWithDelete[]>({
    queryKey: ["postulantes", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("postulantes")
        .select("*")
        .eq("proceso_id", id!)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false }); // Fallback determinista
      if (error) throw error;
      return data;
    },
  });

  const { data: perfilesCargo = [] } = useQuery({
    queryKey: ["perfiles_cargo", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("perfiles_cargo")
        .select("*")
        .eq("proceso_id", id!)
        .order("orden");
      if (error) throw error;
      return data;
    },
  });

  const { data: observaciones = [] } = useQuery({
    queryKey: ["observaciones_research", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("observaciones_research")
        .select("*")
        .eq("proceso_id", id!)
        .order("orden");
      if (error) throw error;
      return data;
    },
  });

  const sortedPostulantes = useMemo(() => {
    if (!postulantes) return [];

    let filtered = [...postulantes];

    if (searchPostulante) {
      const lowerSearch = searchPostulante.toLowerCase();
      filtered = filtered.filter(p => p.nombre.toLowerCase().includes(lowerSearch) ||
        (p.cargo_actual && p.cargo_actual.toLowerCase().includes(lowerSearch)) ||
        (p.empresa && p.empresa.toLowerCase().includes(lowerSearch))
      );
    }

    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "nombre":
          comparison = a.nombre.localeCompare(b.nombre);
          break;
        case "status":
          const valA = statusPriority[a.status] || 99;
          const valB = statusPriority[b.status] || 99;
          comparison = valA - valB;
          break;
        case "renta":
          comparison = (a.pretension_renta || 0) - (b.pretension_renta || 0);
          break;
        case "empresa":
          const empA = a.empresa || "";
          const empB = b.empresa || "";
          comparison = empA.localeCompare(empB);
          break;
        case "created_at":
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [postulantes, sortField, sortOrder, searchPostulante]);

  const handleExportPDF = async () => {
    if (!proceso) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await generateReportPDF(proceso as any, sortedPostulantes, perfilesCargo, observaciones);
      toast.success("Descargando reporte PDF...");
    } catch (err) {
      toast.error("Error generando PDF");
    }
  };

  const handleStatusChange = async (postId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("postulantes")
        .update({ status: newStatus as any })
        .eq("id", postId);
      if (error) throw error;
      toast.success("Estado actualizado con éxito");
      queryClient.invalidateQueries({ queryKey: ["postulantes", id] });
    } catch (err: any) {
      toast.error("Error al actualizar el estado");
    }
  };

  const formatCurrency = (val: number | null) =>
    val ? `$${val.toLocaleString("es-CL")}` : "—";

  const handleEditPostulante = (p: Tables<"postulantes">) => {
    setEditingPostulante(p);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingPostulante(null);
  };

  const handleDeletePostulante = async (e: React.MouseEvent, postId: string, isDeleted: boolean) => {
    e.stopPropagation();
    if (isAdmin && isDeleted) {
        toast.info("Para eliminar permanentemente, edita al postulante.");
        return;
    }

    setConfirmDelete({ id: postId });
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    const { id: postId } = confirmDelete;
    const { error } = await (supabase.rpc as any)("soft_delete_postulante", { p_id: postId });
    if (error) toast.error(error.message);
    else {
      toast.success("Postulante eliminado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["postulantes", id] });
    }
    setConfirmDelete(null);
  };

  const handleCopyCode = () => {
    if (!proceso?.sharing_code) return;
    navigator.clipboard.writeText(proceso.sharing_code);
    setCodeCopied(true);
    toast.success("Código copiado al portapapeles");
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleCopyLink = () => {
    if (!proceso?.sharing_token) return;
    const url = `${window.location.origin}/reporte/${proceso.sharing_token}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    toast.success("Enlace copiado al portapapeles");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleCopyBoth = () => {
    if (!proceso?.sharing_token || !proceso?.sharing_code) return;
    const url = `${window.location.origin}/reporte/${proceso.sharing_token}`;
    const text = `Su reporte: ${url}\nPIN de Acceso: ${proceso.sharing_code}`;
    navigator.clipboard.writeText(text);
    setAllCopied(true);
    toast.success("Enlace y PIN copiados al portapapeles");
    setTimeout(() => setAllCopied(false), 2000);
  };

  if (!proceso) return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-[300px]" />
          <Skeleton className="h-4 w-[250px]" />
        </div>
      </div>
      
      {/* Top Header Skeleten */}
      <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-lg p-6">
        <Skeleton className="h-10 w-1/4 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Skeleton className="h-[120px] rounded-xl" />
           <Skeleton className="h-[120px] rounded-xl" />
           <Skeleton className="h-[120px] rounded-xl" />
        </div>
      </div>
      
      {/* Table Skeletons */}
      <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-lg overflow-hidden">
         <div className="p-4 border-b border-slate-300 dark:border-slate-700 bg-primary dark:bg-accent">
           <Skeleton className="h-6 w-[200px]" />
         </div>
         <div className="p-4 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
               <div key={i} className="flex gap-4">
                 <Skeleton className="h-6 w-[15%]" />
                 <Skeleton className="h-6 w-[20%]" />
                 <Skeleton className="h-6 w-[20%]" />
                 <Skeleton className="h-6 w-[15%]" />
               </div>
            ))}
         </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">{proceso.nombre_cargo}</h1>
            <p className="text-[15px] text-muted-foreground mt-1">
              {(proceso.clientes as any)?.nombre} · <Badge variant="outline">{proceso.estado}</Badge>
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="secondary" onClick={() => setShareOpen(true)} className="bg-indigo-50/50 hover:bg-indigo-100/50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800">
            <LinkIcon className="mr-2 h-4 w-4" />
            Acceso para Cliente
          </Button>
          <Button variant="outline" onClick={() => setObsOpen(true)}>
            Observaciones Research
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            <FileDown className="mr-2 h-4 w-4" />
            Generar Reporte PDF
          </Button>
          <Button onClick={() => {
            if (proceso.estado === "Terminado") {
              toast.error("No puedes agregar más postulantes a un proceso terminado");
              return;
            }
            setFormOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Postulante
          </Button>
        </div>
      </div>

      {proceso.mision_cargo && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-display text-sm font-semibold mb-1">Misión del Cargo</h3>
          <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap">{proceso.mision_cargo}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full max-w-sm sm:w-[300px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar postulante..."
            value={searchPostulante}
            onChange={(e) => setSearchPostulante(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Ordenar por:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 w-[200px] justify-between bg-secondary/50 font-semibold px-3">
                {sortField === "nombre" && "Nombre"}
                {sortField === "status" && "Status"}
                {sortField === "renta" && "Pretensión Renta"}
                {sortField === "empresa" && "Empresa"}
                {sortField === "created_at" && "Fecha de creación"}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuRadioGroup value={sortField} onValueChange={(val) => setSortField(val as PostulanteSortField)}>
                <DropdownMenuRadioItem value="nombre">Nombre</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="status">Status</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="renta">Pretensión Renta</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="empresa">Empresa</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="created_at">Fecha de creación</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={sortOrder} onValueChange={(val) => setSortOrder(val as PostulanteSortOrder)}>
                <DropdownMenuRadioItem value="asc">Ascendente</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="desc">Descendente</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-lg overflow-hidden">
        <div className="p-4 border-b border-slate-300 dark:border-slate-700 bg-primary dark:bg-accent text-primary-foreground">
          <h2 className="font-display text-lg font-semibold">Research – Postulantes</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[12%] text-left">Status</TableHead>
              <TableHead className="w-[23%] min-w-[200px] text-left">Candidato</TableHead>
              <TableHead className="w-[24%] hidden md:table-cell text-left">Experiencia Laboral</TableHead>
              <TableHead className="w-[10%] hidden xl:table-cell text-left">Pretensión / Renta</TableHead>
              <TableHead className="w-[22%] hidden lg:table-cell text-left pl-16">Observaciones</TableHead>
              <TableHead className="w-[9%] text-right pr-6">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPostulantes.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Sin postulantes registrados</TableCell></TableRow>
            ) : (
              sortedPostulantes.map((p, index) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer animate-fade-up transition-colors even:bg-slate-200/80 hover:bg-blue-200/70 dark:even:bg-slate-800/60 dark:hover:bg-emerald-900/40"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => handleEditPostulante(p)}
                >
                  <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                    <Select value={p.status} onValueChange={(val) => setConfirmStatus({ id: p.id, newStatus: val })}>
                      <SelectTrigger className={cn("text-[10px] font-medium tracking-wide h-6 px-3 py-0 border-transparent shadow-sm rounded-full inline-flex w-auto max-w-[140px] text-center justify-center [&>svg]:hidden", getStatusColor(p.status))}>
                        <div className="truncate">
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {Constants.public.Enums.status_postulante.map(s => (
                          <SelectItem key={s} value={s} className="text-[11px] font-medium">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="font-bold min-w-[200px] max-w-[280px] py-3">
                    <CandidateExpandable p={p}>
                      <div className="flex flex-col gap-0.5 w-full">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="truncate max-w-[140px] xl:max-w-[200px]">{p.nombre}</span>
                            <span className="text-xs font-normal text-slate-500 whitespace-nowrap">
                              {p.edad ? `${p.edad} años` : ""}
                            </span>
                            {(p as any).deleted_at && <Badge variant="destructive" className="text-[10px] h-5 px-1.5 whitespace-nowrap shrink-0">Eliminado</Badge>}
                        </div>
                        <span className="text-[11px] font-medium text-muted-foreground/80 truncate mt-0.5">
                          {p.estudios ? p.estudios : "Sin Título"}{p.institucion ? `, ${p.institucion}` : ""}
                        </span>
                      </div>
                    </CandidateExpandable>
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-3 max-w-[220px]">
                    <ExperienceExpandable p={p}>
                      <div className="flex flex-col gap-0.5 w-full">
                        {(p.fecha_inicio_1 || p.fecha_fin_1) && (
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {p.fecha_inicio_1 || ""} {p.fecha_inicio_1 && p.fecha_fin_1 ? "–" : ""} {p.fecha_fin_1 || ""}
                          </span>
                        )}
                        <span className="font-medium text-slate-700 dark:text-slate-300 text-sm truncate">
                          {p.cargo_actual ?? "—"}
                        </span>
                        <span className="text-[12px] text-muted-foreground truncate">
                          {p.empresa ?? "—"}
                        </span>
                      </div>
                    </ExperienceExpandable>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell py-3 max-w-[150px]">
                    <RentaExpandable p={p}>
                      <div className="flex flex-col gap-0.5 w-full">
                        <span className="font-medium text-slate-700 dark:text-slate-300 text-[13px] truncate" title="Pretensión">
                          {p.pretension_renta ? formatCurrency(p.pretension_renta) : "—"}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate" title="Renta Actual">
                          Act: {p.renta_actual ? formatCurrency(p.renta_actual) : "—"}
                        </span>
                      </div>
                    </RentaExpandable>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell py-3 max-w-[220px] pl-16">
                    <TextExpandable fullText={p.observaciones || "Sin observaciones"} className="text-[12px] text-muted-foreground line-clamp-2">
                       {p.observaciones || "—"}
                    </TextExpandable>
                  </TableCell>
                  <TableCell className="text-right space-x-1 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    {p.cv_url && (
                      <Button variant="ghost" size="icon" title="Descargar CV" onClick={async (e) => {
                        e.stopPropagation();
                        const url = p.cv_url!;
                        try {
                          const response = await fetch(url);
                          const blob = await response.blob();
                          const blobUrl = URL.createObjectURL(blob);
                          const anchor = document.createElement('a');
                          anchor.href = blobUrl;
                          anchor.download = `CV_${p.nombre.replace(/\s+/g, '_')}.pdf`;
                          document.body.appendChild(anchor);
                          anchor.click();
                          document.body.removeChild(anchor);
                          URL.revokeObjectURL(blobUrl);
                        } catch {
                          window.open(url, '_blank');
                        }
                      }}>
                        <FileDown className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" title="Editar postulante" onClick={(e) => { e.stopPropagation(); handleEditPostulante(p); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Eliminar postulante" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDeletePostulante(e, p.id, !!(p as any).deleted_at); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {formOpen && (
        <PostulanteForm
          open={formOpen}
          onClose={handleCloseForm}
          procesoId={id!}
          editing={editingPostulante}
        />
      )}

      {obsOpen && (
        <ObservacionesResearchForm
          open={obsOpen}
          onClose={() => setObsOpen(false)}
          procesoId={id!}
        />
      )}

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Compartir Reporte en Vivo</DialogTitle>
            <DialogDescription>
              Envía este enlace y código al cliente para que vea los datos actualizados del proceso sin necesidad de iniciar sesión.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Enlace Seguro</label>
              <Input
                readOnly
                value={`${window.location.origin}/reporte/${proceso.sharing_token}`}
                className="bg-muted text-sm font-mono cursor-text"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Código de Acceso (PIN)</label>
              <div className="p-3 bg-secondary/50 border rounded-md text-center">
                <span className="font-mono text-2xl font-bold tracking-widest text-primary">{proceso.sharing_code}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={handleCopyLink} variant="outline" className="w-full h-11 transition-all">
                {linkCopied ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Enlace Copiado
                  </>
                ) : (
                  <>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Copiar Enlace
                  </>
                )}
              </Button>
              <Button onClick={handleCopyCode} variant="secondary" className="w-full h-11 transition-all text-primary font-medium border-primary/20 border hover:bg-primary/10 bg-secondary/50">
                {codeCopied ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Código Copiado
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar Código Solo
                  </>
                )}
              </Button>
              <Button onClick={handleCopyBoth} className="w-full h-11 transition-all mt-2 font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white border-transparent">
                {allCopied ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    ¡Mensaje Copiado Listo para Enviar!
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    Copiar Mensaje (Enlace + PIN)
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(v) => !v && setConfirmDelete(null)}
        onConfirm={executeDelete}
        title="¿Eliminar postulante?"
        description="El postulante desaparecerá de la lista táctica de este proceso."
        confirmText="Eliminar"
        variant="destructive"
      />

      <ConfirmDialog
        open={!!confirmStatus}
        onOpenChange={(v) => !v && setConfirmStatus(null)}
        onConfirm={() => {
          if (confirmStatus) handleStatusChange(confirmStatus.id, confirmStatus.newStatus);
          setConfirmStatus(null);
        }}
        title="¿Cambiar el status?"
        description={`Estás a punto de cambiar el status del candidato a "${confirmStatus?.newStatus}".`}
        confirmText="Cambiar Status"
      />
    </div>
  );
};

export default ProcesoDetail;
