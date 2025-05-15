import { cn } from "@/lib/utils";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Home, 
  UtensilsCrossed, 
  Heart, 
  User, 
  HelpCircle, 
  LogOut,
  Search
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { logout } = useAuth();

  const routes = [
    {
      name: "Master Pet",
      href: "/",
      icon: Home,
      active: location === "/",
    },
    {
      name: "Minhas Receitas",
      href: "/my-recipes",
      icon: UtensilsCrossed,
      active: location === "/my-recipes",
    },
    {
      name: "Favoritos",
      href: "/favorites",
      icon: Heart,
      active: location === "/favorites",
    },
    {
      name: "Perfil",
      href: "/profile",
      icon: User,
      active: location === "/profile",
    },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside className={cn("hidden md:flex flex-col w-64 min-h-screen bg-white shadow-md p-4", className)}>
      <div className="flex items-center gap-3 mb-10 px-2">
        <Search className="w-8 h-8 text-primary" />
        <h1 className="text-xl font-bold text-primary">Cozinha de Pet</h1>
      </div>
      
      <nav className="flex-1 space-y-2">
        {routes.map((route) => (
          <Link key={route.href} href={route.href}>
            <a className={cn(
              "flex items-center gap-3 p-3 rounded-lg transition-all",
              route.active 
                ? "text-primary bg-primary/10" 
                : "text-gray-600 hover:bg-primary/5"
            )}>
              <route.icon size={18} />
              <span>{route.name}</span>
            </a>
          </Link>
        ))}
      </nav>
      
      <div className="mt-auto">
        <div className="p-4 bg-primary/5 rounded-lg">
          <p className="text-sm font-medium">Precisa de ajuda?</p>
          <p className="text-xs text-gray-500 mt-1">Nosso suporte está disponível 24/7</p>
          <Button variant="default" className="mt-3 w-full bg-primary text-white hover:bg-primary/90">
            Contatar Suporte
          </Button>
        </div>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              className="mt-4 w-full flex items-center justify-center gap-2 text-gray-600"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              <span>Sair</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sair da conta</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
