import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Bell, User } from "lucide-react";

export function AppNavbar() {
  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-foreground hover:bg-secondary" />
          <div className="hidden sm:block">
            <h2 className="text-lg font-semibold text-foreground">
              Sistema de Controle Financeiro
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-accent rounded-full"></span>
          </Button>
          
          <Button variant="ghost" size="sm" className="gap-2">
            <User className="w-5 h-5" />
            <span className="hidden sm:inline">Usuário</span>
          </Button>
        </div>
      </div>
    </header>
  );
}