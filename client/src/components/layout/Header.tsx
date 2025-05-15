import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { getAvatarFallback } from "@/lib/utils";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onSearch?: (query: string) => void;
}

export function Header({ title, subtitle, onSearch }: HeaderProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  return (
    <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        {subtitle && <p className="text-gray-500">{subtitle}</p>}
      </div>
      
      <div className="flex items-center gap-4">
        <form onSubmit={handleSearch} className="relative">
          <Input
            type="text"
            placeholder="Buscar receitas..."
            className="py-2 pl-10 pr-4 w-full md:w-64 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        </form>
        
        <div className="relative">
          <Avatar className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
            {user?.profileImageUrl ? (
              <AvatarImage src={user.profileImageUrl} alt={user.username} />
            ) : (
              <AvatarFallback>
                {getAvatarFallback(user?.firstName || user?.username || "")}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
      </div>
    </header>
  );
}
