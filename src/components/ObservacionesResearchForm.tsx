import { useEffect, useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  procesoId: string;
}

const OPCIONES_INTERES = [
  "Se encuentra cómodo en su trabajo actual (cargo y empleo).",
  "Incertidumbre laboral.",
  "Tienes otros planes personales.",
  "Lleva poco tiempo en su actual puesto de trabajo.",
  "No le interesa una posición de liderazgo.",
  "No disponible para trabajar full presencial.",
  "Lejanía del lugar de trabajo.",
  "No disponible para cambio de ciudad.",
];

const OPCIONES_PERFIL = [
  "No tienen los conocimientos necesarios, según los requisitos técnicos del cargo.",
  "No tienen la experiencia necesaria, según los requisitos del cargo.",
  "Menor seniority.",
  "Falencia en aspectos comunicacionales.",
  "Bajo nivel de inglés.",
  "Pocas habilidades sociales.",
  "Baja motivación para un cambio laboral.",
  "Sin experiencia en Sistemas relativos al rol.",
  "No han manejado altas dotaciones.",
];

export default function ObservacionesResearchForm({ open, onClose, procesoId }: Props) {
  const queryClient = useQueryClient();

  const [obsInteres, setObsInteres] = useState<string[]>([""]);
  const [obsPerfil, setObsPerfil] = useState<string[]>([""]);

  const { data: serverData, isLoading } = useQuery({
    queryKey: ["observaciones_research", procesoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("observaciones_research")
        .select("*")
        .eq("proceso_id", procesoId)
        .order("orden");
      if (error) throw error;
      return data;
    },
    enabled: open && !!procesoId,
  });

  useEffect(() => {
    if (open && serverData) {
      const interes = serverData.filter((o) => o.tipo === "no_interesado").map((o) => o.descripcion);
      const perfil = serverData.filter((o) => o.tipo === "no_responde_perfil").map((o) => o.descripcion);
      setObsInteres(interes.length > 0 ? interes : [""]);
      setObsPerfil(perfil.length > 0 ? perfil : [""]);
    } else if (open && !serverData && !isLoading) {
      setObsInteres([""]);
      setObsPerfil([""]);
    }
  }, [open, serverData, isLoading]);

  const mutation = useMutation({
    mutationFn: async () => {
      // Delete existing
      const { error: delError } = await supabase
        .from("observaciones_research")
        .delete()
        .eq("proceso_id", procesoId);
      if (delError) throw delError;

      // Prepare new
      const validInteres = obsInteres.filter((o) => o.trim());
      const validPerfil = obsPerfil.filter((o) => o.trim());

      const payload = [
        ...validInteres.map((desc, i) => ({
          proceso_id: procesoId,
          tipo: "no_interesado" as const,
          descripcion: desc,
          orden: i,
        })),
        ...validPerfil.map((desc, i) => ({
          proceso_id: procesoId,
          tipo: "no_responde_perfil" as const,
          descripcion: desc,
          orden: i,
        })),
      ];

      if (payload.length > 0) {
        const { error: insError } = await supabase
          .from("observaciones_research")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .insert(payload as any);
        if (insError) throw insError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["observaciones_research", procesoId] });
      toast.success("Observaciones guardadas correctamente");
      onClose();
    },
    onError: (err: Error) => toast.error(`Error: ${err.message}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const updateArray = (arr: string[], index: number, val: string) => {
    const updated = [...arr];
    updated[index] = val;
    return updated;
  };

  const removeArray = (arr: string[], index: number) => {
    return arr.filter((_, i) => i !== index);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display border-b pb-4 text-center text-xl underline decoration-primary underline-offset-4">
            Formulario Observaciones Generales Research
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground animate-pulse">Cargando datos...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 pt-4">
            
            {/* Section 1 */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Considerando el promedio de los contactos realizados en este proceso, es posible decir que las personas...
              </p>
              
              <div className="space-y-3">
                {obsInteres.map((val, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Label className="w-32 text-right shrink-0">No se interesaron por:</Label>
                    <Select value={val} onValueChange={(v) => setObsInteres(updateArray(obsInteres, i, v))}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccione una opción" />
                      </SelectTrigger>
                      <SelectContent>
                        {OPCIONES_INTERES.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {obsInteres.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => setObsInteres(removeArray(obsInteres, i))}>
                        <X className="h-4 w-4 text-red-600 font-bold" strokeWidth={3} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end pr-[44px]">
                <Button type="button" variant="secondary" size="sm" onClick={() => setObsInteres([...obsInteres, ""])} className="bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-100 border border-blue-300">
                  Agregar Observación (+)
                </Button>
              </div>
            </div>

            {/* Section 2 */}
            <div className="space-y-4 border-t pt-6">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                En base a los candidatos contactados que no respondían al perfil buscado, es posible decir que en su mayoría...
              </p>
              
              <div className="space-y-3">
                {obsPerfil.map((val, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Label className="w-40 text-right shrink-0">No respondían al perfil por:</Label>
                    <Select value={val} onValueChange={(v) => setObsPerfil(updateArray(obsPerfil, i, v))}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccione una opción" />
                      </SelectTrigger>
                      <SelectContent>
                        {OPCIONES_PERFIL.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {obsPerfil.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => setObsPerfil(removeArray(obsPerfil, i))}>
                        <X className="h-4 w-4 text-red-600 font-bold" strokeWidth={3} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end pr-[44px]">
                <Button type="button" variant="secondary" size="sm" onClick={() => setObsPerfil([...obsPerfil, ""])} className="bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-100 border border-blue-300">
                  Agregar Observación (+)
                </Button>
              </div>
            </div>

            <div className="flex justify-start gap-3 border-t pt-6">
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[120px]" disabled={mutation.isPending}>
                {mutation.isPending ? "Guardando..." : "Aceptar"}
              </Button>
              <Button type="button" variant="destructive" onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white min-w-[100px]">
                Salir
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Minimal internal Label component just for this file since we are using flex layouts that need it
function Label({ className, children }: { className: string, children: React.ReactNode }) {
  return <label className={`text-sm font-medium leading-none ${className}`}>{children}</label>;
}
