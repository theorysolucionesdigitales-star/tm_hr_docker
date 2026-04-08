import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Mail } from "lucide-react";

type AuthView = "login" | "forgot";

const Auth = () => {
  const [view, setView] = useState<AuthView>("login");

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [loadingForgot, setLoadingForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingLogin(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    setLoadingLogin(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingForgot(true);

    // redirectTo es dinámico: funciona en local Y en producción sin cambiar código.
    const redirectTo = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo,
    });

    if (error) {
      toast.error(error.message);
    } else {
      setForgotSent(true);
    }
    setLoadingForgot(false);
  };

  const goBackToLogin = () => {
    setView("login");
    setForgotEmail("");
    setForgotSent(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-4">
      <Card className="w-full max-w-md animate-fade-in bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />

        <CardHeader className="text-center relative z-10 pb-2">
          <div className="mx-auto mb-4 flex h-[177px] w-[268px] items-center justify-center shrink-0">
            <img src="/back-cover-v2.png" alt="Tailor Made Logo" className="h-full w-full object-contain drop-shadow-md" />
          </div>
          <CardDescription className="text-[15px]">
            {view === "login" ? "Inicia sesión en tu cuenta" : "Recuperación de contraseña"}
          </CardDescription>
        </CardHeader>

        <CardContent className="relative z-10 pb-6">

          {/* ── Vista: Login ── */}
          {view === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                  maxLength={255}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loadingLogin}>
                {loadingLogin ? "Cargando..." : "Iniciar sesión"}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setView("forgot")}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </form>
          )}

          {/* ── Vista: Olvidé contraseña ── */}
          {view === "forgot" && !forgotSent && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
              </p>
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Correo electrónico</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                  maxLength={255}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={loadingForgot}>
                {loadingForgot ? "Enviando..." : "Enviar enlace de recuperación"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full gap-2 text-muted-foreground"
                onClick={goBackToLogin}
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio de sesión
              </Button>
            </form>
          )}

          {/* ── Vista: Correo enviado ── */}
          {view === "forgot" && forgotSent && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-3">
                <Mail className="h-7 w-7 text-blue-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Revisa tu correo</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Si <span className="font-medium text-foreground">{forgotEmail}</span> está registrado en el sistema,
                  recibirás un enlace para restablecer tu contraseña.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="gap-2 text-muted-foreground"
                onClick={goBackToLogin}
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio de sesión
              </Button>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
