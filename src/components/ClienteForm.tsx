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
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { Upload, X } from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";

interface Props {
  open: boolean;
  onClose: () => void;
  editing: Tables<"clientes"> | null;
}

const ClienteForm = ({ open, onClose, editing }: Props) => {
  const { user, role } = useAuth();
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    rut: "",
    industria: "" as string,
    pais: "Chile",
    ciudad: "Santiago",
    personas_contacto: "",
    logo_url: "",
  });
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        nombre: editing.nombre,
        rut: editing.rut ?? "",
        industria: editing.industria ?? "",
        pais: editing.pais ?? "Chile",
        ciudad: editing.ciudad ?? "Santiago",
        personas_contacto: editing.personas_contacto ?? "",
        logo_url: editing.logo_url ?? "",
      });
    } else {
      setForm({ nombre: "", rut: "", industria: "", pais: "Chile", ciudad: "Santiago", personas_contacto: "", logo_url: "" });
    }
  }, [editing, open]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("El archivo es muy grande (máx 4MB)");
      return;
    }

    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `logos/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("client-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("client-logos")
        .getPublicUrl(filePath);

      setForm((prev) => ({ ...prev, logo_url: urlData.publicUrl }));
      toast.success("Logo subido exitosamente");
    } catch (err: any) {
      toast.error("Error al subir logo: " + (err.message || "desconocido"));
    } finally {
      setUploadingLogo(false);
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nombre: form.nombre.trim(),
        rut: form.rut.trim() || null,
        industria: (form.industria || null) as TablesInsert<"clientes">["industria"],
        pais: form.pais.trim() || "Chile",
        ciudad: form.ciudad.trim() || "Santiago",
        personas_contacto: form.personas_contacto.trim() || null,
        logo_url: form.logo_url || null,
        created_by: user?.id,
      };

      if (editing) {
        const { error } = await supabase.from("clientes").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clientes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      // Also refresh any cached proceso data that embeds clientes(logo_url)
      queryClient.invalidateQueries({ queryKey: ["procesos"] });
      queryClient.invalidateQueries({ queryKey: ["proceso"] });
      toast.success(editing ? "Cliente actualizado" : "Cliente creado");
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      toast.error("El nombre del cliente es obligatorio");
      return;
    }
    mutation.mutate();
  };

  const handleRestore = async () => {
    if (!editing) return;
    setConfirmRestore(true);
  };

  const executeRestore = async () => {
    const { error } = await (supabase.rpc as any)("restore_cliente", { p_id: editing!.id });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Cliente restaurado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
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
    
    // Eliminar logo del cliente si existe
    if (editing.logo_url) {
      const parts = editing.logo_url.split('/client-logos/');
      if (parts.length > 1) {
        const storagePath = parts[1].split('?')[0]; // remove query params
        await supabase.storage.from("client-logos").remove([storagePath]);
      }
    }

    // Buscar procesos asociados para vaciar sus carpetas de archivos (CVs y Fotos)
    const { data: procesos } = await supabase.from("procesos").select("id").eq("cliente_id", editing.id);
    if (procesos && procesos.length > 0) {
      const emptyFolder = async (bucket: string, folder: string) => {
        const { data } = await supabase.storage.from(bucket).list(folder);
        if (data && data.length > 0) {
          const paths = data.map(file => `${folder}/${file.name}`);
          await supabase.storage.from(bucket).remove(paths);
        }
      };
      for (const p of procesos) {
        await emptyFolder("cvs", p.id);
        await emptyFolder("fotos", p.id);
        await emptyFolder("cartas_gantt", p.id);
      }
    }

    const { error } = await supabase.from("clientes").delete().eq("id", editing.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Cliente eliminado permanentemente");
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      onClose();
    }
    setConfirmDelete(false);
  };

  const isDeleted = editing && (editing as any).deleted_at;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-display">
            {editing ? "Editar Cliente" : "Nuevo Cliente"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre Cliente *</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} maxLength={80} required placeholder="Ej. The Green Scope" />
            </div>
            <div className="space-y-2">
              <Label>RUT</Label>
              <Input value={form.rut} onChange={(e) => setForm({ ...form, rut: e.target.value })} maxLength={12} placeholder="12.345.678-9" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Industria</Label>
            <Select value={form.industria} onValueChange={(v) => setForm({ ...form, industria: v })}>
              <SelectTrigger><SelectValue placeholder="Selecciona industria" /></SelectTrigger>
              <SelectContent>
                {Constants.public.Enums.industria.map((i) => (
                  <SelectItem key={i} value={i}>{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>País</Label>
              <Input value={form.pais} onChange={(e) => setForm({ ...form, pais: e.target.value })} maxLength={40} />
            </div>
            <div className="space-y-2">
              <Label>Ciudad</Label>
              <Input value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} maxLength={25} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Personas de Contacto</Label>
            <Textarea
              value={form.personas_contacto}
              onChange={(e) => setForm({ ...form, personas_contacto: e.target.value })}
              maxLength={200}
              rows={3}
              placeholder={"Ej. Juan Pérez - Gerente de RRHH\njuan.perez@empresa.com"}
            />
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Logo del Cliente</Label>
            <div className="flex items-center gap-3">
              {form.logo_url ? (
                <div className="relative group">
                  <img
                    src={form.logo_url}
                    alt="Logo"
                    className="h-14 w-14 object-contain rounded-md border bg-white p-1"
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, logo_url: "" })}
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Quitar logo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : null}
              <label className="cursor-pointer">
                <div className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-dashed hover:bg-accent transition-colors">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {uploadingLogo ? "Subiendo..." : form.logo_url ? "Cambiar logo" : "Subir logo"}
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                />
              </label>
            </div>
          </div>

          <div className="flex justify-between items-center mt-6">
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
            <div className="flex gap-3">
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
          title="¿Restaurar cliente?"
          description="El cliente y todos sus procesos volverán a estar visibles para todos los usuarios."
          confirmText="Restaurar"
        />

        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          onConfirm={executePermanentDelete}
          title="¿ELIMINAR PERMANENTEMENTE?"
          description="Esta acción es IRREVERSIBLE. Se borrarán todos los datos del cliente, sus procesos, postulantes y archivos del servidor."
          confirmText="Eliminar Permanentemente"
          variant="destructive"
        />
      </DialogContent>
    </Dialog >
  );
};

export default ClienteForm;
