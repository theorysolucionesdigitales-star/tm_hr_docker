import { Link, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, FolderOpen, Settings, LogOut, Menu, X, PanelLeftClose, PanelLeftOpen, KeyRound, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const navItems = [
  { to: "/clientes", label: "Clientes", icon: FolderOpen },
  { to: "/procesos", label: "Procesos", icon: Briefcase },
  { to: "/usuarios", label: "Usuarios", icon: Settings },
];

const AppLayout = () => {
  const { displayName, role, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);      // Mobile
  const [collapsed, setCollapsed] = useState(false);           // Desktop collapse
  const queryClient = useQueryClient();

  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setIsChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsChangingPassword(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Contraseña actualizada con éxito");
      setPasswordModalOpen(false);
      setNewPassword("");
    }
  };

  const handlePrefetch = (path: string) => {
    if (path === "/clientes") {
      queryClient.prefetchQuery({
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
    } else if (path === "/procesos") {
      queryClient.prefetchQuery({
        queryKey: ["procesos"],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("procesos")
            .select("*, clientes(nombre)")
            .order("created_at", { ascending: false })
            .order("id", { ascending: false });
          if (error) throw error;
          return data;
        },
      });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar/80 backdrop-blur-xl border-r border-sidebar-border/50 text-sidebar-foreground transition-all duration-300 ease-in-out lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "lg:w-[68px]" : "lg:w-64",
          "w-64" // Mobile always full width
        )}
      >
        {/* Header */}
        <Link to="/clientes" onClick={() => setSidebarOpen(false)} className={cn(
          "flex h-16 items-center border-b border-sidebar-border transition-all duration-300 hover:bg-sidebar-accent/30",
          "justify-center px-4"
        )}>
          {/* <div className="flex h-10 w-10 items-center justify-center shrink-0">
            <img src="/logo-rompecabezas.png" alt="Tailor Made Pieza" className="h-full w-full object-contain" />
          </div> */}
          {!collapsed && (
            <div className="flex flex-col items-center overflow-hidden">
              <h1 className="font-logo text-[15px] font-semibold bg-gradient-to-r from-sidebar-primary-foreground to-sidebar-foreground/80 bg-clip-text text-transparent tracking-[0.25em] whitespace-nowrap">TAILOR MADE</h1>
              <p className="font-cursive text-[17px] text-sidebar-foreground/70 -mt-1 tracking-wider whitespace-nowrap">Human Consulting</p>
            </div>
          )}
        </Link>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems
            .filter((item) => {
              if (role !== "admin") return item.to !== "/usuarios";
              return true;
            })
            .map((item) => {
              const active = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  onMouseEnter={() => handlePrefetch(item.to)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    collapsed ? "justify-center" : "gap-3",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-4">
          {!collapsed ? (
            <div className="mb-4 flex items-center justify-between">
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-sidebar-foreground truncate pr-2">{displayName}</p>
                <p className="text-xs text-sidebar-foreground/50 capitalize truncate">{role}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => setPasswordModalOpen(true)}
                title="Ajustes de cuenta"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="mb-4 mx-auto flex justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => setPasswordModalOpen(true)}
                title="Ajustes de cuenta"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              title={collapsed ? "Cerrar sesión" : undefined}
              className={cn(
                "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent mt-1",
                collapsed ? "w-full justify-center px-0" : "w-full justify-start"
              )}
            >
              <LogOut className={cn("h-4 w-4 shrink-0", !collapsed && "mr-2")} />
              {!collapsed && "Cerrar sesión"}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden relative">
        <header className="flex h-16 items-center gap-4 border-b border-border/40 bg-card/50 backdrop-blur-xl px-4 lg:px-8 z-10 sticky top-0">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          {/* Desktop collapse toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </Button>
          <div className="flex-1" />
          <ThemeToggle />
        </header>
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Settings / Change Password Modal */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajustes de cuenta</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-4">
            <div className="space-y-2">
              <Label>Nombre de Usuario</Label>
              <Input
                value={displayName || ""}
                readOnly
                className="bg-muted text-muted-foreground font-medium"
                autoFocus={false}
              />
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label>Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    title={showPassword ? "Ocultar" : "Mostrar"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setPasswordModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isChangingPassword}>
                  {isChangingPassword ? "Guardando..." : "Actualizar"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppLayout;
