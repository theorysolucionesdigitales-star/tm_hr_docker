import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Upload, FileCheck, Trash2, X } from "lucide-react";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { ImageCropperModal } from "./ImageCropperModal";
import { ConfirmDialog } from "./ConfirmDialog";

const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const currentYear = new Date().getFullYear();
// Generamos los años dinámicamente. Sumamos +1 al año actual para permitir 
// fechas de término proyectadas al futuro cercano.
const años = Array.from({length: 42}, (_, i) => (currentYear + 1 - i).toString());

const MonthYearSelector = ({ value, onChange, isHasta = false }: { value: string, onChange: (val: string) => void, isHasta?: boolean, placeholder?: string }) => {
  const isActual = isHasta && (value.toLowerCase().includes("actual") || value.toLowerCase().includes("presente"));
  const parts = value.trim().split(" ");
  const currentAño = isActual ? "" : (años.find(a => parts.includes(a)) || "");
  const currentMes = isActual ? "" : (meses.find(m => parts.includes(m)) || "");

  return (
    <div className="flex gap-2 w-full">
      <Select 
        value={isActual ? "Actualidad" : currentMes} 
        onValueChange={(val) => {
          if (val === "Actualidad") {
            onChange("Actualidad");
          } else {
            onChange(val + " " + (currentAño || currentYear.toString()));
          }
        }}
      >
        <SelectTrigger className={!isActual ? "w-1/2" : "w-full"}>
          <SelectValue placeholder="Mes" />
        </SelectTrigger>
        <SelectContent>
          {isHasta && <SelectItem value="Actualidad">Actualidad</SelectItem>}
          {meses.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
        </SelectContent>
      </Select>

      {!isActual && (
        <Select 
          value={currentAño} 
          onValueChange={(val) => {
             onChange((currentMes || meses[0]) + " " + val);
          }}
        >
          <SelectTrigger className="w-1/2">
            <SelectValue placeholder="Año" />
          </SelectTrigger>
          <SelectContent>
            {años.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

interface Props {
  open: boolean;
  onClose: () => void;
  procesoId: string;
  editing: Tables<"postulantes"> | null;
}

const PostulanteForm = ({ open, onClose, procesoId, editing }: Props) => {
  const { user, role } = useAuth();
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
  const [expCount, setExpCount] = useState(1);
  const [eduCount, setEduCount] = useState(1);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    status: "LinkedIn" as string,
    estado_proceso_postulante: "Research" as string,
    telefono: "",
    email: "",
    linkedin: "",
    cargo_actual: "",
    empresa: "",
    cargo_2: "",
    empresa_2: "",
    cargo_3: "",
    empresa_3: "",
    cargo_4: "",
    empresa_4: "",
    cargo_5: "",
    empresa_5: "",
    cargo_6: "",
    empresa_6: "",
    edad: "",
    genero: "" as string,
    estudios: "",
    institucion: "",
    estudios_2: "",
    institucion_2: "",
    estudios_3: "",
    institucion_3: "",
    renta_actual: "",
    pretension_renta: "",
    observaciones: "",
    benef_act: "",
    cv_url: "",
    foto_url: "",
    fecha_inicio_1: "",
    fecha_fin_1: "",
    fecha_inicio_2: "",
    fecha_fin_2: "",
    fecha_inicio_3: "",
    fecha_fin_3: "",
    fecha_inicio_4: "",
    fecha_fin_4: "",
    fecha_inicio_5: "",
    fecha_fin_5: "",
    fecha_inicio_6: "",
    fecha_fin_6: "",
    motivacion: "",
  });

  useEffect(() => {
    if (editing) {
      setForm({
        nombre: editing.nombre,
        status: editing.status,
        estado_proceso_postulante: editing.estado_proceso_postulante ?? "Research",
        telefono: editing.telefono ?? "",
        email: editing.email ?? "",
        linkedin: editing.linkedin ?? "",
        cargo_actual: editing.cargo_actual ?? "",
        empresa: editing.empresa ?? "",
        cargo_2: editing.cargo_2 ?? "",
        empresa_2: editing.empresa_2 ?? "",
        cargo_3: editing.cargo_3 ?? "",
        empresa_3: editing.empresa_3 ?? "",
        cargo_4: editing.cargo_4 ?? "",
        empresa_4: editing.empresa_4 ?? "",
        cargo_5: editing.cargo_5 ?? "",
        empresa_5: editing.empresa_5 ?? "",
        cargo_6: editing.cargo_6 ?? "",
        empresa_6: editing.empresa_6 ?? "",
        edad: editing.edad?.toString() ?? "",
        genero: editing.genero ?? "",
        estudios: editing.estudios ?? "",
        institucion: editing.institucion ?? "",
        estudios_2: editing.estudios_2 ?? "",
        institucion_2: editing.institucion_2 ?? "",
        estudios_3: editing.estudios_3 ?? "",
        institucion_3: editing.institucion_3 ?? "",
        renta_actual: editing.renta_actual?.toString() ?? "",
        pretension_renta: editing.pretension_renta?.toString() ?? "",
        observaciones: editing.observaciones ?? "",
        benef_act: editing.benef_act ?? "",
        cv_url: editing.cv_url ?? "",
        foto_url: editing.foto_url ?? "",
        fecha_inicio_1: editing.fecha_inicio_1 ?? "",
        fecha_fin_1: editing.fecha_fin_1 ?? "",
        fecha_inicio_2: editing.fecha_inicio_2 ?? "",
        fecha_fin_2: editing.fecha_fin_2 ?? "",
        fecha_inicio_3: editing.fecha_inicio_3 ?? "",
        fecha_fin_3: editing.fecha_fin_3 ?? "",
        fecha_inicio_4: editing.fecha_inicio_4 ?? "",
        fecha_fin_4: editing.fecha_fin_4 ?? "",
        fecha_inicio_5: editing.fecha_inicio_5 ?? "",
        fecha_fin_5: editing.fecha_fin_5 ?? "",
        fecha_inicio_6: editing.fecha_inicio_6 ?? "",
        fecha_fin_6: editing.fecha_fin_6 ?? "",
        motivacion: editing.motivacion ?? "",
      });
      if (editing.cargo_6 || editing.empresa_6) setExpCount(6);
      else if (editing.cargo_5 || editing.empresa_5) setExpCount(5);
      else if (editing.cargo_4 || editing.empresa_4) setExpCount(4);
      else if (editing.cargo_3 || editing.empresa_3) setExpCount(3);
      else if (editing.cargo_2 || editing.empresa_2) setExpCount(2);
      else setExpCount(1);

      if (editing.estudios_3 || editing.institucion_3) setEduCount(3);
      else if (editing.estudios_2 || editing.institucion_2) setEduCount(2);
      else setEduCount(1);
    } else {
      setForm({
        nombre: "", status: "LinkedIn", estado_proceso_postulante: "Research", telefono: "", email: "",
        linkedin: "", cargo_actual: "", empresa: "", cargo_2: "", empresa_2: "", cargo_3: "", empresa_3: "", cargo_4: "", empresa_4: "", cargo_5: "", empresa_5: "", cargo_6: "", empresa_6: "", edad: "", genero: "",
        estudios: "", institucion: "", estudios_2: "", institucion_2: "", estudios_3: "", institucion_3: "", renta_actual: "", pretension_renta: "", observaciones: "", benef_act: "", motivacion: "", cv_url: "", foto_url: "",
        fecha_inicio_1: "", fecha_fin_1: "", fecha_inicio_2: "", fecha_fin_2: "", fecha_inicio_3: "", fecha_fin_3: "", fecha_inicio_4: "", fecha_fin_4: "", fecha_inicio_5: "", fecha_fin_5: "", fecha_inicio_6: "", fecha_fin_6: ""
      });
      setExpCount(1);
      setEduCount(1);
    }
  }, [editing, open]);

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const fileName = `${procesoId}/${Date.now()}_${sanitizedName}`;
    const { error } = await supabase.storage.from("cvs").upload(fileName, file, { upsert: true });
    if (error) {
      toast.error("Error subiendo CV: " + error.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("cvs").getPublicUrl(fileName);
    setForm({ ...form, cv_url: urlData.publicUrl });
    setUploading(false);
    toast.success("CV subido correctamente");
  };

  const handleRemoveCV = () => {
    setForm({ ...form, cv_url: "" });
  };

  const handleRemoveFoto = () => {
    setForm({ ...form, foto_url: "" });
  };

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset current file input to allow selecting the same file again if aborted
    e.target.value = "";

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setTempImageSrc(reader.result?.toString() || null);
      setCropperOpen(true);
    });
    reader.readAsDataURL(file);
  };

  const handleCropSubmit = async (croppedBlob: Blob) => {
    setCropperOpen(false);
    setTempImageSrc(null);
    setUploadingFoto(true);

    const fileName = `${procesoId}/${Date.now()}_foto.jpg`;
    const { error } = await supabase.storage.from("fotos").upload(fileName, croppedBlob, { upsert: true });

    if (error) {
      toast.error("Error subiendo fotografía");
      setUploadingFoto(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("fotos").getPublicUrl(fileName);
    setForm({ ...form, foto_url: urlData.publicUrl });
    setUploadingFoto(false);
    toast.success("Fotografía subida correctamente");
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Partial<TablesInsert<"postulantes">> = {
        proceso_id: procesoId,
        nombre: form.nombre.trim(),
        status: form.status as TablesInsert<"postulantes">["status"],
        estado_proceso_postulante: form.estado_proceso_postulante as TablesInsert<"postulantes">["estado_proceso_postulante"],
        telefono: form.telefono.trim() || null,
        email: form.email.trim() || null,
        linkedin: form.linkedin.trim() || null,
        cargo_actual: form.cargo_actual.trim() || null,
        empresa: form.empresa.trim() || null,
        cargo_2: form.cargo_2.trim() || null,
        empresa_2: form.empresa_2.trim() || null,
        cargo_3: form.cargo_3.trim() || null,
        empresa_3: form.empresa_3.trim() || null,
        cargo_4: form.cargo_4.trim() || null,
        empresa_4: form.empresa_4.trim() || null,
        cargo_5: form.cargo_5.trim() || null,
        empresa_5: form.empresa_5.trim() || null,
        cargo_6: form.cargo_6.trim() || null,
        empresa_6: form.empresa_6.trim() || null,
        edad: form.edad ? parseInt(form.edad) : null,
        genero: (form.genero || null) as TablesInsert<"postulantes">["genero"],
        estudios: form.estudios.trim() || null,
        institucion: form.institucion.trim() || null,
        renta_actual: form.renta_actual ? parseInt(form.renta_actual) : null,
        pretension_renta: form.pretension_renta ? parseInt(form.pretension_renta) : null,
        observaciones: form.observaciones.trim() || null,
        benef_act: form.benef_act.trim() || null,
        motivacion: form.motivacion.trim() || null,
        cv_url: form.cv_url || null,
        foto_url: form.foto_url || null,
        fecha_inicio_1: form.fecha_inicio_1.trim() || null,
        fecha_fin_1: form.fecha_fin_1.trim() || null,
        fecha_inicio_2: form.fecha_inicio_2.trim() || null,
        fecha_fin_2: form.fecha_fin_2.trim() || null,
        fecha_inicio_3: form.fecha_inicio_3.trim() || null,
        fecha_fin_3: form.fecha_fin_3.trim() || null,
        fecha_inicio_4: form.fecha_inicio_4.trim() || null,
        fecha_fin_4: form.fecha_fin_4.trim() || null,
        fecha_inicio_5: form.fecha_inicio_5.trim() || null,
        fecha_fin_5: form.fecha_fin_5.trim() || null,
        fecha_inicio_6: form.fecha_inicio_6.trim() || null,
        fecha_fin_6: form.fecha_fin_6.trim() || null,
        created_by: user?.id,
      };

      if (form.estudios_2.trim()) payload.estudios_2 = form.estudios_2.trim();
      if (form.institucion_2.trim()) payload.institucion_2 = form.institucion_2.trim();
      if (form.estudios_3.trim()) payload.estudios_3 = form.estudios_3.trim();
      if (form.institucion_3.trim()) payload.institucion_3 = form.institucion_3.trim();

      if (editing) {
        const { error } = await supabase.from("postulantes").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("postulantes").insert(payload as TablesInsert<"postulantes">);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postulantes", procesoId] });
      toast.success(editing ? "Postulante actualizado" : "Postulante registrado");
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    mutation.mutate();
  };

  const handleRestore = async () => {
    if (!editing) return;
    setConfirmRestore(true);
  };

  const executeRestore = async () => {
    const { error } = await (supabase.rpc as any)("restore_postulante", { p_id: editing!.id });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Postulante restaurado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["postulantes", procesoId] });
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

    // Eliminar archivos asociados permanentemente
    if (editing.cv_url) {
      const parts = editing.cv_url.split('/cvs/');
      if (parts.length > 1) await supabase.storage.from("cvs").remove([parts[1]]);
    }
    if (editing.foto_url) {
      const parts = editing.foto_url.split('/fotos/');
      if (parts.length > 1) await supabase.storage.from("fotos").remove([parts[1]]);
    }

    const { error } = await supabase.from("postulantes").delete().eq("id", editing.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Postulante eliminado permanentemente");
      queryClient.invalidateQueries({ queryKey: ["postulantes", procesoId] });
      onClose();
    }
    setConfirmDelete(false);
  };

  const isDeleted = editing && (editing as any).deleted_at;

  const set = (key: string, value: string) => setForm({ ...form, [key]: value });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-display">
            {editing ? "Editar Postulante" : "Nuevo Postulante"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre Postulante *</Label>
              <Input value={form.nombre} onChange={(e) => set("nombre", e.target.value)} maxLength={60} required />
            </div>
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.status_postulante.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estado en el Proceso</Label>
              <Select value={form.estado_proceso_postulante} onValueChange={(v) => set("estado_proceso_postulante", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.estado_proceso.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={form.telefono} onChange={(e) => set("telefono", e.target.value)} maxLength={11} type="tel" placeholder="Ej. +56912345678" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => set("email", e.target.value)} type="email" />
            </div>
            <div className="space-y-2">
              <Label>LinkedIn</Label>
              <Input value={form.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="https://linkedin.com/in/..." type="url" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Edad</Label>
              <Input value={form.edad} onChange={(e) => set("edad", e.target.value.slice(0, 2))} type="number" min={18} max={99} />
            </div>
            <div className="space-y-2">
              <Label>Género</Label>
              <Select value={form.genero} onValueChange={(v) => set("genero", v)}>
                <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.genero.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 rounded-md border p-3 bg-muted/20">
            <h4 className="text-sm font-semibold text-muted-foreground w-full">Antecedentes Académicos</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estudios / Título 1</Label>
                <Input value={form.estudios} onChange={(e) => set("estudios", e.target.value)} maxLength={80} placeholder="Ej. Ingeniería Comercial" />
              </div>
              <div className="space-y-2">
                <Label>Institución 1</Label>
                <Input value={form.institucion} onChange={(e) => set("institucion", e.target.value)} maxLength={80} placeholder="Ej. Universidad de Chile" />
              </div>
            </div>

            {eduCount >= 2 && (
              <div className="animate-fade-in border-t border-muted pt-3 mt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Estudio 2</span>
                  <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={() => { setForm(f => ({ ...f, estudios_2: "", institucion_2: "" })); if (eduCount === 2) setEduCount(1); else if (eduCount === 3) setEduCount(2); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estudios / Título 2</Label>
                    <Input value={form.estudios_2} onChange={(e) => set("estudios_2", e.target.value)} maxLength={80} placeholder="Ej. Diplomado en Marketing" />
                  </div>
                  <div className="space-y-2">
                    <Label>Institución 2</Label>
                    <Input value={form.institucion_2} onChange={(e) => set("institucion_2", e.target.value)} maxLength={80} placeholder="Ej. U. de Santiago" />
                  </div>
                </div>
              </div>
            )}

            {eduCount >= 3 && (
              <div className="animate-fade-in border-t border-muted pt-3 mt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Estudio 3</span>
                  <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={() => { setForm(f => ({ ...f, estudios_3: "", institucion_3: "" })); setEduCount(2); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estudios / Título 3</Label>
                    <Input value={form.estudios_3} onChange={(e) => set("estudios_3", e.target.value)} maxLength={80} placeholder="Ej. Magíster en Negocios" />
                  </div>
                  <div className="space-y-2">
                    <Label>Institución 3</Label>
                    <Input value={form.institucion_3} onChange={(e) => set("institucion_3", e.target.value)} maxLength={80} placeholder="Ej. PUC" />
                  </div>
                </div>
              </div>
            )}

            {eduCount < 3 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setEduCount((c) => c + 1)} className="mt-2 text-xs h-8">
                + Agregar Estudio
              </Button>
            )}
          </div>

          <div className="space-y-4 rounded-md border p-3 bg-muted/20">
            <h4 className="text-sm font-semibold text-muted-foreground w-full">Experiencia Laboral</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cargo 1 (Actual / Último)</Label>
                <Input value={form.cargo_actual} onChange={(e) => set("cargo_actual", e.target.value)} maxLength={60} placeholder="Ej. Key Account Manager" />
              </div>
              <div className="space-y-2">
                <Label>Empresa 1</Label>
                <Input value={form.empresa} onChange={(e) => set("empresa", e.target.value)} maxLength={40} placeholder="Ej. Empresa S.A." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="space-y-2">
                <Label>Desde</Label>
                <MonthYearSelector value={form.fecha_inicio_1} onChange={(v) => set("fecha_inicio_1", v)} />
              </div>
              <div className="space-y-2">
                <Label>Hasta</Label>
                <MonthYearSelector value={form.fecha_fin_1} onChange={(v) => set("fecha_fin_1", v)} isHasta={true} />
              </div>
            </div>
            {expCount >= 2 && (
              <div className="animate-fade-in border-t border-muted pt-3 mt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Experiencia 2</span>
                  <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={() => { setForm(f => ({ ...f, cargo_2: "", empresa_2: "", fecha_inicio_2: "", fecha_fin_2: "" })); setExpCount(1); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cargo 2</Label>
                    <Input value={form.cargo_2} onChange={(e) => set("cargo_2", e.target.value)} maxLength={60} placeholder="Ej. Analista Comercial" />
                  </div>
                  <div className="space-y-2">
                    <Label>Empresa 2</Label>
                    <Input value={form.empresa_2} onChange={(e) => set("empresa_2", e.target.value)} maxLength={40} placeholder="Ej. Corporación XYZ" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label>Desde</Label>
                    <MonthYearSelector value={form.fecha_inicio_2} onChange={(v) => set("fecha_inicio_2", v)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hasta</Label>
                    <MonthYearSelector value={form.fecha_fin_2} onChange={(v) => set("fecha_fin_2", v)} isHasta={true} />
                  </div>
                </div>
              </div>
            )}
            {expCount >= 3 && (
              <div className="animate-fade-in border-t border-muted pt-3 mt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Experiencia 3</span>
                  <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={() => { setForm(f => ({ ...f, cargo_3: "", empresa_3: "", fecha_inicio_3: "", fecha_fin_3: "" })); setExpCount(2); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cargo 3</Label>
                    <Input value={form.cargo_3} onChange={(e) => set("cargo_3", e.target.value)} maxLength={60} placeholder="Ej. Ejecutivo de Ventas" />
                  </div>
                  <div className="space-y-2">
                    <Label>Empresa 3</Label>
                    <Input value={form.empresa_3} onChange={(e) => set("empresa_3", e.target.value)} maxLength={40} placeholder="Ej. StartUp Chile" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label>Desde</Label>
                    <MonthYearSelector value={form.fecha_inicio_3} onChange={(v) => set("fecha_inicio_3", v)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hasta</Label>
                    <MonthYearSelector value={form.fecha_fin_3} onChange={(v) => set("fecha_fin_3", v)} isHasta={true} />
                  </div>
                </div>
              </div>
            )}
            {expCount >= 4 && (
              <div className="animate-fade-in border-t border-muted pt-3 mt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Experiencia 4</span>
                  <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={() => { setForm(f => ({ ...f, cargo_4: "", empresa_4: "", fecha_inicio_4: "", fecha_fin_4: "" })); setExpCount(3); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cargo 4</Label>
                    <Input value={form.cargo_4} onChange={(e) => set("cargo_4", e.target.value)} maxLength={60} />
                  </div>
                  <div className="space-y-2">
                    <Label>Empresa 4</Label>
                    <Input value={form.empresa_4} onChange={(e) => set("empresa_4", e.target.value)} maxLength={40} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label>Desde</Label>
                    <MonthYearSelector value={form.fecha_inicio_4} onChange={(v) => set("fecha_inicio_4", v)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hasta</Label>
                    <MonthYearSelector value={form.fecha_fin_4} onChange={(v) => set("fecha_fin_4", v)} isHasta={true} />
                  </div>
                </div>
              </div>
            )}
            {expCount >= 5 && (
              <div className="animate-fade-in border-t border-muted pt-3 mt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Experiencia 5</span>
                  <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={() => { setForm(f => ({ ...f, cargo_5: "", empresa_5: "", fecha_inicio_5: "", fecha_fin_5: "" })); setExpCount(4); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cargo 5</Label>
                    <Input value={form.cargo_5} onChange={(e) => set("cargo_5", e.target.value)} maxLength={60} />
                  </div>
                  <div className="space-y-2">
                    <Label>Empresa 5</Label>
                    <Input value={form.empresa_5} onChange={(e) => set("empresa_5", e.target.value)} maxLength={40} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label>Desde</Label>
                    <MonthYearSelector value={form.fecha_inicio_5} onChange={(v) => set("fecha_inicio_5", v)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hasta</Label>
                    <MonthYearSelector value={form.fecha_fin_5} onChange={(v) => set("fecha_fin_5", v)} isHasta={true} />
                  </div>
                </div>
              </div>
            )}
            {expCount >= 6 && (
              <div className="animate-fade-in border-t border-muted pt-3 mt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Experiencia 6</span>
                  <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    onClick={() => { setForm(f => ({ ...f, cargo_6: "", empresa_6: "", fecha_inicio_6: "", fecha_fin_6: "" })); setExpCount(5); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cargo 6</Label>
                    <Input value={form.cargo_6} onChange={(e) => set("cargo_6", e.target.value)} maxLength={60} />
                  </div>
                  <div className="space-y-2">
                    <Label>Empresa 6</Label>
                    <Input value={form.empresa_6} onChange={(e) => set("empresa_6", e.target.value)} maxLength={40} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label>Desde</Label>
                    <MonthYearSelector value={form.fecha_inicio_6} onChange={(v) => set("fecha_inicio_6", v)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hasta</Label>
                    <MonthYearSelector value={form.fecha_fin_6} onChange={(v) => set("fecha_fin_6", v)} isHasta={true} />
                  </div>
                </div>
              </div>
            )}
            {expCount < 6 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setExpCount(prev => prev + 1)}>
                + Agregar Experiencia
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Renta Actual ($)</Label>
              <Input value={form.renta_actual} onChange={(e) => set("renta_actual", e.target.value.slice(0, 9))} type="number" max={999999999} />
            </div>
            <div className="space-y-2">
              <Label>Pretensión Renta ($)</Label>
              <Input value={form.pretension_renta} onChange={(e) => set("pretension_renta", e.target.value.slice(0, 9))} type="number" max={999999999} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Beneficios Actuales</Label>
            <Textarea value={form.benef_act} onChange={(e) => set("benef_act", e.target.value)} maxLength={320} rows={3} placeholder="Mencionar beneficios como aguinaldos, seguro de salud complementario..." />
          </div>

          <div className="space-y-2">
            <Label>Motivación</Label>
            <Input value={form.motivacion} onChange={(e) => set("motivacion", e.target.value)} maxLength={200} placeholder="Ej. Estabilidad laboral." />
          </div>

          <div className="space-y-2">
            <Label>Observaciones</Label>
            <Textarea value={form.observaciones} onChange={(e) => set("observaciones", e.target.value)} maxLength={1000} rows={3} placeholder="Notas adicionales sobre el candidato, disponibilidad, etc." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fotografía</Label>
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-muted transition-colors">
                  <Upload className="h-4 w-4" />
                  {uploadingFoto ? "Subiendo..." : "Subir Foto"}
                  <input type="file" className="hidden" onChange={handleFotoUpload} accept="image/*" disabled={uploadingFoto} />
                </label>
                {form.foto_url && (
                  <span className="flex items-center gap-1 text-sm text-accent">
                    <FileCheck className="h-4 w-4" /> Cargada
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleRemoveFoto} title="Eliminar Foto">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>CV</Label>
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-muted transition-colors">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Subiendo..." : "Subir CV"}
                  <input type="file" className="hidden" onChange={handleCVUpload} accept=".pdf,.doc,.docx" disabled={uploading} />
                </label>
                {form.cv_url && (
                  <span className="flex items-center gap-1 text-sm text-accent">
                    <FileCheck className="h-4 w-4" /> Cargado
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 ml-1 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleRemoveCV} title="Eliminar CV">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t mt-4">
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
          title="¿Restaurar postulante?"
          description="Este postulante volverá a aparecer en la lista táctica del proceso."
          confirmText="Restaurar"
        />

        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          onConfirm={executePermanentDelete}
          title="¿ELIMINAR PERMANENTEMENTE?"
          description="Esta acción es IRREVERSIBLE. Se borrarán todos los datos del postulante y sus archivos del servidor."
          confirmText="Eliminar Permanentemente"
          variant="destructive"
        />
      </DialogContent>
      {tempImageSrc && (
        <ImageCropperModal
          open={cropperOpen}
          imageSrc={tempImageSrc}
          onClose={() => {
            setCropperOpen(false);
            setTempImageSrc(null);
          }}
          onCropSubmit={handleCropSubmit}
        />
      )}
    </Dialog>
  );
};

export default PostulanteForm;
