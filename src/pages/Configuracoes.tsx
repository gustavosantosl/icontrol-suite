import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Save,
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Mail,
  Smartphone,
  Key,
  Download
} from "lucide-react";

const Configuracoes = () => {
  const configSections = [
    {
      id: "profile",
      title: "Perfil do Usuário",
      description: "Informações pessoais e de conta",
      icon: User,
    },
    {
      id: "notifications",
      title: "Notificações",
      description: "Configurar alertas e avisos",
      icon: Bell,
    },
    {
      id: "security",
      title: "Segurança",
      description: "Senhas e autenticação",
      icon: Shield,
    },
    {
      id: "appearance",
      title: "Aparência",
      description: "Tema e personalização",
      icon: Palette,
    },
    {
      id: "data",
      title: "Dados e Backup",
      description: "Exportação e backup",
      icon: Database,
    },
  ];

  const notificationSettings = [
    {
      id: "email",
      title: "Notificações por Email",
      description: "Receber alertas importantes por email",
      enabled: true,
    },
    {
      id: "push",
      title: "Notificações Push",
      description: "Alertas em tempo real no navegador",
      enabled: false,
    },
    {
      id: "reports",
      title: "Relatórios Automáticos",
      description: "Envio automático de relatórios mensais",
      enabled: true,
    },
    {
      id: "alerts",
      title: "Alertas de Limite",
      description: "Avisos quando atingir limites definidos",
      enabled: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">
            Personalize sua experiência no iControl
          </p>
        </div>
        <Button className="bg-brand-primary hover:bg-brand-primary-dark text-white shadow-md gap-2">
          <Save className="w-4 h-4" />
          Salvar Alterações
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {configSections.map((section) => (
          <Card key={section.id} className="cursor-pointer hover:shadow-md transition-all">
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 mx-auto mb-2 p-2 bg-brand-primary/10 rounded-lg">
                <section.icon className="w-4 h-4 text-brand-primary" />
              </div>
              <h3 className="font-medium text-sm text-foreground">{section.title}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Perfil do Usuário
            </CardTitle>
            <CardDescription>
              Atualize suas informações pessoais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" defaultValue="João Silva" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="joao@empresa.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" defaultValue="(11) 99999-9999" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input id="company" defaultValue="Minha Empresa Ltda" />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure como receber alertas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notificationSettings.map((setting) => (
              <div key={setting.id} className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5 flex-1">
                  <Label className="text-sm font-medium">
                    {setting.title}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {setting.description}
                  </p>
                </div>
                <Switch defaultChecked={setting.enabled} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Segurança
            </CardTitle>
            <CardDescription>
              Gerencie a segurança da sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Alterar Senha</p>
                  <p className="text-xs text-muted-foreground">Última alteração: 30 dias atrás</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Alterar
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Autenticação 2FA</p>
                  <p className="text-xs text-muted-foreground">Não configurada</p>
                </div>
              </div>
              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                Pendente
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Email Verificado</p>
                  <p className="text-xs text-muted-foreground">joao@empresa.com</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                Verificado
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Data & Backup */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Dados e Backup
            </CardTitle>
            <CardDescription>
              Exporte seus dados e configure backups
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div>
                <p className="font-medium">Exportar Dados</p>
                <p className="text-xs text-muted-foreground">Download completo dos seus dados</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Exportar
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div>
                <p className="font-medium">Backup Automático</p>
                <p className="text-xs text-muted-foreground">Último backup: Ontem às 23:00</p>
              </div>
              <Switch defaultChecked={true} />
            </div>

            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div>
                <p className="font-medium">Limpeza de Dados</p>
                <p className="text-xs text-muted-foreground">Remover dados antigos automaticamente</p>
              </div>
              <Switch defaultChecked={false} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Info */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
          <CardDescription>Versão e status do iControl</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Versão</p>
              <p className="font-semibold">iControl v2.1.3</p>
            </div>
            <div>
              <p className="text-muted-foreground">Último Update</p>
              <p className="font-semibold">15/03/2024</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status do Sistema</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="font-semibold text-green-600">Online</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Configuracoes;