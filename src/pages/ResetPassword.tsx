import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, CheckCircle2 } from "lucide-react";

type PageState = "loading" | "ready" | "success" | "invalid";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase redirige incluyendo el token en el hash de la URL.
    // onAuthStateChange detecta el evento PASSWORD_RECOVERY automáticamente.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setPageState("ready");
      }
    });

    // Si después de 4s no llegó el evento, el link es inválido o expiró.
    const fallback = setTimeout(() => {
      setPageState((prev) => (prev === "loading" ? "invalid" : prev));
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallback);
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error(`Error al actualizar: ${error.message}`);
      setLoading(false);
    } else {
      setPageState("success");
      await supabase.auth.signOut();
      setTimeout(() => navigate("/auth"), 2500);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-4">
      <Card className="w-full max-w-md animate-fade-in bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />

        <CardHeader className="text-center relative z-10 pb-2">
          <div className="mx-auto mb-4 flex h-[140px] w-[220px] items-center justify-center shrink-0">
            <img
              src="/back-cover-v2.png"
              alt="Tailor Made Logo"
              className="h-full w-full object-contain drop-shadow-md"
            />
          </div>
        </CardHeader>

        <CardContent className="relative z-10 pb-6">

          {/* ── Estado: Cargando token ── */}
          {pageState === "loading" && (
            <div className="flex flex-col items-center gap-3 py-6 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm">Verificando enlace de recuperación…</p>
            </div>
          )}

          {/* ── Estado: Token inválido / expirado ── */}
          {pageState === "invalid" && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3">
                <KeyRound className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Enlace inválido o expirado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Este enlace ya no es válido. Solicita uno nuevo desde la pantalla de inicio de sesión.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => navigate("/auth")}
              >
                Volver al inicio de sesión
              </Button>
            </div>
          )}

          {/* ── Estado: Formulario de nueva contraseña ── */}
          {pageState === "ready" && (
            <form onSubmit={handleReset} className="space-y-4">
              <CardDescription className="text-center pb-2">
                Ingresa tu nueva contraseña
              </CardDescription>

              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repite la contraseña"
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Actualizando…" : "Establecer nueva contraseña"}
              </Button>
            </form>
          )}

          {/* ── Estado: Éxito ── */}
          {pageState === "success" && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-3">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground">¡Contraseña actualizada!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Serás redirigido al inicio de sesión en unos segundos…
                </p>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
