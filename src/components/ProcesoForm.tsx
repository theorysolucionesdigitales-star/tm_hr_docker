import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Constants } from "@/integrations/supabase/types";
import { Plus, X, UploadCloud, FileText as FileIcon, Trash2, Download } from "lucide-react";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { ConfirmDialog } from "./ConfirmDialog";

interface Props {
  open: boolean;
  onClose: () => void;
  editing: Tables<"procesos"> | null;
  initialClienteId?: string;
}

const ProcesoForm = ({ open, onClose, editing, initialClienteId }: Props) => {
  const { user, role } = useAuth();
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    nombre_cargo: "",
    cliente_id: "",
    tipo_contrato: "" as string,
    mision_cargo: "",
    renta_obj: "",
    renta_var_def: "0",
    benef_def: "",
  });
  const [perfiles, setPerfiles] = useState<string[]>([""]);
  const [ganttFile, setGanttFile] = useState<File | null>(null);
  const [currentGanttUrl, setCurrentGanttUrl] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeleteGantt, setConfirmDeleteGantt] = useState(false);

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
    select: (data) => [...data].sort((a, b) => a.nombre.localeCompare(b.nombre)),
  });

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          nombre_cargo: editing.nombre_cargo,
          cliente_id: editing.cliente_id,
          tipo_contrato: editing.tipo_contrato || "",
          mision_cargo: editing.mision_cargo || "",
          renta_obj: editing.renta_obj ? editing.renta_obj.toString() : "",
          renta_var_def: editing.renta_var_def !== null ? editing.renta_var_def.toString() : "0",
          benef_def: editing.benef_def || "",
        });
        supabase
          .from("perfiles_cargo")
          .select("descripcion")
          .eq("proceso_id", editing.id)
          .order("orden")
          .then(({ data, error }) => {
            if (!error && data && data.length > 0) {
              setPerfiles(data.map((d) => d.descripcion));
            } else {
              setPerfiles([""]);
            }
          });
      } else {
        setForm({ nombre_cargo: "", cliente_id: initialClienteId || "", tipo_contrato: "", mision_cargo: "", renta_obj: "", renta_var_def: "0", benef_def: "" });
        setPerfiles([""]);
      }
      setGanttFile(null);
      setCurrentGanttUrl(editing?.carta_gantt_url || null);
    }
  }, [open, editing, initialClienteId]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nombre_cargo: form.nombre_cargo.trim(),
        cliente_id: form.cliente_id,
        tipo_contrato: (form.tipo_contrato || null) as TablesInsert<"procesos">["tipo_contrato"],
        mision_cargo: form.mision_cargo.trim() || null,
        renta_obj: form.renta_obj ? parseInt(form.renta_obj.replace(/\D/g, "")) : null,
        renta_var_def: form.renta_var_def ? parseInt(form.renta_var_def.replace(/\D/g, "")) : 0,
        benef_def: form.benef_def.trim() || null,
      };

      let procesoId;

      if (editing) {
        const { error } = await supabase.from("procesos").update(payload).eq("id", editing.id);
        if (error) throw error;
        procesoId = editing.id;

        const { error: delError } = await supabase.from("perfiles_cargo").delete().eq("proceso_id", procesoId);
        if (delError) throw delError;
      } else {
        const { data, error } = await supabase
          .from("procesos")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .insert({ ...payload, created_by: user?.id } as any)
          .select()
          .single();
        if (error) throw error;
        procesoId = data.id;
      }

      if (ganttFile) {
        // Safe encode original name
        const cleanName = ganttFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const fileName = `${procesoId}/gantt_${Date.now()}_--_${cleanName}`;
        const { error: uploadError } = await supabase.storage.from("cartas_gantt").upload(fileName, ganttFile, { upsert: true });
        
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from("cartas_gantt").getPublicUrl(fileName);
        
        await supabase.from("procesos").update({ carta_gantt_url: publicUrlData.publicUrl }).eq("id", procesoId);
      }

      const validPerfiles = perfiles.filter((p) => p.trim());
      if (validPerfiles.length > 0) {
        const { error: pError } = await supabase.from("perfiles_cargo").insert(
          validPerfiles.map((desc, i) => ({
            proceso_id: procesoId,
            descripcion: desc.trim(),
            orden: i,
          }))
        );
        if (pError) throw pError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["procesos"] });
      toast.success(editing ? "Proceso actualizado" : "Proceso creado");
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre_cargo.trim() || !form.cliente_id) {
      toast.error("Nombre del cargo y cliente son obligatorios");
      return;
    }
    mutation.mutate();
  };

  const handleRestore = async () => {
    if (!editing) return;
    setConfirmRestore(true);
  };

  const executeRestore = async () => {
    const { error } = await (supabase.rpc as any)("restore_proceso", { p_id: editing!.id });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Proceso restaurado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["procesos"] });
      onClose();
    }
    setConfirmRestore(false);
  };

  const handlePermanentDelete = async () => {
    if (!editing) return;
    setConfirmDelete(true);
  };

  const executePermanentDelete = async () => {
    if (!editing) return;

    // Eliminar archivos del proceso
    const emptyFolder = async (bucket: string, folder: string) => {
      const { data } = await supabase.storage.from(bucket).list(folder);
      if (data && data.length > 0) {
        const paths = data.map(file => `${folder}/${file.name}`);
        await supabase.storage.from(bucket).remove(paths);
      }
    };
    await emptyFolder("cvs", editing.id);
    await emptyFolder("fotos", editing.id);
    await emptyFolder("cartas_gantt", editing.id);

    const { error } = await supabase.from("procesos").delete().eq("id", editing.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Proceso eliminado permanentemente");
      queryClient.invalidateQueries({ queryKey: ["procesos"] });
      onClose();
    }
    setConfirmDelete(false);
  };

  const handleDownloadGantt = async () => {
    if (!currentGanttUrl) return;
    try {
      const response = await fetch(currentGanttUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Extract original extension safely (handles potential query params)
      const extMatch = currentGanttUrl.split('?')[0].match(/\.([a-zA-Z0-9]+)$/);
      const ext = extMatch ? extMatch[1] : 'pdf';
      
      let downloadName = `Carta_Gantt_${form.nombre_cargo.replace(/[^a-zA-Z0-9]/g, "_") || "Proceso"}.${ext}`;
      
      const urlParts = currentGanttUrl.split('/');
      const lastSegment = urlParts[urlParts.length - 1].split('?')[0];
      if (lastSegment.includes('_--_')) {
        downloadName = decodeURIComponent(lastSegment.split('_--_').slice(1).join('_--_'));
      }
      
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Mostrando en pestaña...");
      window.open(currentGanttUrl, "_blank");
    }
  };

  const handleDeleteGantt = async () => {
    if (!editing || !currentGanttUrl) return;
    
    const urlParts = currentGanttUrl.split('/');
    const fileName = `${editing.id}/${urlParts[urlParts.length - 1]}`;

    await supabase.storage.from("cartas_gantt").remove([fileName]);
    
    const { error: updateError } = await supabase.from("procesos").update({ carta_gantt_url: null }).eq("id", editing.id);
    if (!updateError) {
      toast.success("Carta Gantt eliminada");
      setCurrentGanttUrl(null);
      queryClient.invalidateQueries({ queryKey: ["procesos"] });
    } else {
      toast.error("Error al eliminar Carta Gantt");
    }
  };

  const isDeleted = editing && (editing as any).deleted_at;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-display">
            {editing ? "Editar Proceso" : "Nuevo Proceso"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre Cargo *</Label>
              <Input value={form.nombre_cargo} onChange={(e) => setForm({ ...form, nombre_cargo: e.target.value })} maxLength={80} required placeholder="Ej. Gerente Comercial" />
            </div>
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select value={form.cliente_id} onValueChange={(v) => setForm({ ...form, cliente_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo Contrato</Label>
              <Select value={form.tipo_contrato} onValueChange={(v) => setForm({ ...form, tipo_contrato: v })}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.tipo_contrato.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Renta Líquida Mensual Objetivo</Label>
              <Input
                placeholder="Indique la renta líquida mensual objetivo"
                value={form.renta_obj}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, "");
                  if (val.length > 9) val = val.slice(0, 9);
                  setForm({ ...form, renta_obj: val });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Renta Variable Definida</Label>
              <Input
                placeholder="Indique la renta variable definida"
                value={form.renta_var_def}
                maxLength={9}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, "");
                  if (val.length > 9) val = val.slice(0, 9);
                  setForm({ ...form, renta_var_def: val });
                }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Beneficios Definidos (Opcional)</Label>
            <Textarea
              placeholder="Escribe los beneficios..."
              value={form.benef_def}
              maxLength={1000}
              onChange={(e) => setForm({ ...form, benef_def: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Misión del cargo</Label>
            <Textarea
              placeholder="Breve descripción del propósito principal de este cargo..."
              value={form.mision_cargo}
              onChange={(e) => setForm({ ...form, mision_cargo: e.target.value })}
              maxLength={700}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Perfil del Cargo</Label>
            {perfiles.map((p, i) => (
              <div key={i} className="flex gap-2">
                <Textarea
                  value={p}
                  onChange={(e) => {
                    const updated = [...perfiles];
                    updated[i] = e.target.value;
                    setPerfiles(updated);
                  }}
                  maxLength={100}
                  rows={2}
                  className="flex-1"
                  placeholder={`Mínimo 5 años de experiencia liderando equipos...`}
                />
                {perfiles.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => setPerfiles(perfiles.filter((_, j) => j !== i))}>
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setPerfiles([...perfiles, ""])}>
              <Plus className="h-4 w-4 mr-2" /> Agregar Perfil de Cargo
            </Button>
          </div>
          <div className="space-y-3 pt-2">
             <div className="flex flex-col gap-2 p-4 border border-dashed rounded-lg bg-slate-50 dark:bg-slate-900 absolute-positioning-parent">
               <Label className="text-sm font-semibold flex items-center gap-2">
                 <FileIcon className="h-4 w-4 text-primary" />
                 Carta Gantt
               </Label>
               {currentGanttUrl ? (
                 <div className="text-xs text-muted-foreground flex items-center justify-between gap-1 mb-1 p-2 bg-white dark:bg-slate-800 rounded border">
                   <span className="flex items-center gap-2">Ya existe un archivo guardado. 
                     <Button type="button" variant="outline" size="sm" className="h-7 text-xs font-semibold px-2 hover:bg-primary/5" onClick={handleDownloadGantt}>
                       <Download className="h-3 w-3 mr-1" />
                       Descargar
                     </Button>
                   </span>
                   <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => setConfirmDeleteGantt(true)} title="Eliminar archivo">
                     <Trash2 className="h-4 w-4" />
                   </Button>
                 </div>
               ) : (
                 <div className="flex items-center gap-2 mt-1">
                    <Input type="file" id="gantt-upload" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => e.target.files && setGanttFile(e.target.files[0])} />
                    <Button type="button" variant="secondary" onClick={() => document.getElementById('gantt-upload')?.click()} className="w-full text-sm font-medium h-10 border hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      <UploadCloud className="h-4 w-4 mr-2 text-primary" />
                      {ganttFile ? ganttFile.name : "Subir Carta Gantt"}
                    </Button>
                 </div>
               )}
             </div>
          </div>
          <div className="flex justify-between items-center pt-4">
            <div className="flex gap-2">
              {isAdmin && isDeleted && (
                <>
                  <Button type="button" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50" onClick={handleRestore}>
                    Restaurar
                  </Button>
                  <Button type="button" variant="destructive" onClick={handlePermanentDelete}>
                    Eliminar Permanente
                  </Button>
                </>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>Salir</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Guardando..." : "Aceptar"}
              </Button>
            </div>
          </div>
        </form>

        <ConfirmDialog
          open={confirmRestore}
          onOpenChange={setConfirmRestore}
          onConfirm={executeRestore}
          title="¿Restaurar proceso?"
          description="Este proceso y todos sus postulantes volverán a estar visibles para todos los usuarios."
          confirmText="Restaurar"
        />

        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          onConfirm={executePermanentDelete}
          title="¿ELIMINAR PERMANENTEMENTE?"
          description="Esta acción es IRREVERSIBLE. Se borrarán todos los datos del proceso, postulantes y perfiles de cargo de la base de datos y del servidor."
          confirmText="Eliminar Permanentemente"
          variant="destructive"
        />
      </DialogContent>
      <ConfirmDialog
        open={confirmDeleteGantt}
        onOpenChange={setConfirmDeleteGantt}
        onConfirm={() => {
          handleDeleteGantt();
          setConfirmDeleteGantt(false);
        }}
        title="¿Eliminar Carta Gantt?"
        description="Esta acción no se puede deshacer."
      />
    </Dialog>
  );
};

export default ProcesoForm;
