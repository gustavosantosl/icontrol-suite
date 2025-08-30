import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  BarChart3, 
  CreditCard, 
  FileText, 
  Settings, 
  Menu,
  ChevronLeft,
  Users,
  UserCog,
  LogOut
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTenant } from "@/contexts/TenantContext";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: BarChart3,
  },
  {
    title: "Contas",
    url: "/contas",
    icon: CreditCard,
  },
  {
    title: "Clientes & Fornecedores",
    url: "/clientes-fornecedores",
    icon: Users,
  },
  {
    title: "Relatórios", 
    url: "/relatorios",
    icon: FileText,
  },
];

const adminMenuItems = [
  {
    title: "Configurações",
    url: "/configuracoes", 
    icon: Settings,
    roles: ['admin', 'manager']
  },
  {
    title: "Usuários",
    url: "/usuarios",
    icon: UserCog,
    roles: ['admin', 'manager']
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { profile, tenant, requireRole, signOut } = useTenant();
  
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const getNavClassName = (path: string) => {
    const baseClasses = "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-smooth";
    
    if (isActive(path)) {
      return `${baseClasses} bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-accent`;
    }
    
    return baseClasses;
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar className={`border-r border-sidebar-border ${isCollapsed ? "w-16" : "w-64"}`}>
      <SidebarContent className="bg-sidebar">
        {/* Logo & Tenant Section */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-bold text-sidebar-foreground">iControl</h1>
                {tenant ? (
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-sidebar-foreground/70">{tenant.name}</p>
                    {profile && (
                      <Badge 
                        variant="outline" 
                        className="text-xs bg-sidebar-primary/10 text-sidebar-primary border-sidebar-primary/20"
                      >
                        {profile.role === 'admin' ? 'Admin' : 
                         profile.role === 'manager' ? 'Gerente' : 'Leitor'}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-sidebar-foreground/70">Controle Financeiro</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup className="px-4 py-6">
          <SidebarGroupLabel className={`text-sidebar-foreground/70 font-medium mb-3 ${isCollapsed ? "sr-only" : ""}`}>
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={getNavClassName(item.url)}
                      title={isCollapsed ? item.title : undefined}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {profile && requireRole(['admin', 'manager']) && (
          <SidebarGroup className="px-4">
            <SidebarGroupLabel className={`text-sidebar-foreground/70 font-medium mb-3 ${isCollapsed ? "sr-only" : ""}`}>
              Administração
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {adminMenuItems.map((item) => {
                  if (!requireRole(item.roles)) return null;
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={getNavClassName(item.url)}
                          title={isCollapsed ? item.title : undefined}
                        >
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          {!isCollapsed && (
                            <span className="font-medium">{item.title}</span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* User Section */}
        {!isCollapsed && profile && (
          <div className="mt-auto p-4 border-t border-sidebar-border">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-sidebar-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-sidebar-primary">
                    {profile.full_name?.charAt(0) || profile.email?.charAt(0) || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {profile.full_name || 'Usuário'}
                  </p>
                  <p className="text-xs text-sidebar-foreground/70 truncate">
                    {profile.email}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-sidebar-border">
            <div className="text-xs text-sidebar-foreground/50 text-center">
              © 2024 iControl
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}