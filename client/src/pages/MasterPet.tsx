import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { RecipeFilters } from "@/components/recipes/RecipeFilters";
import { RecipeGrid } from "@/components/recipes/RecipeGrid";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { useToast } from "@/hooks/use-toast";

export default function MasterPet() {
  const [filters, setFilters] = useState({ petType: "", category: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isRecipeFormOpen, setIsRecipeFormOpen] = useState(false);
  const { toast } = useToast();
  const pageSize = 6;

  // Fetch recipes based on filters, search, and pagination
  const recipesQuery = useQuery({
    queryKey: ['/api/recipes', filters, searchQuery, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.petType) params.append('petType', filters.petType);
      if (filters.category) params.append('category', filters.category);
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', page.toString());
      params.append('limit', pageSize.toString());
      
      const response = await fetch(`/api/recipes?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch recipes');
      return response.json();
    },
  });

  // Fetch user's favorites for favorite status in recipe cards
  const favoritesQuery = useQuery({
    queryKey: ['/api/users', 'favorites'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) return [];
        
        const user = await response.json();
        const favResponse = await fetch(`/api/users/${user.id}/favorites`);
        if (!favResponse.ok) return [];
        
        const favorites = await favResponse.json();
        return favorites.map((fav: any) => fav.id);
      } catch (error) {
        return [];
      }
    },
  });

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleFilterChange = (newFilters: { petType: string; category: string }) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleNewRecipe = () => {
    setIsRecipeFormOpen(true);
  };

  const handleRecipeSuccess = () => {
    recipesQuery.refetch();
    toast({
      title: "Receita publicada",
      description: "Sua receita foi publicada com sucesso!",
    });
  };

  // Calculate the total pages based on the total count (assuming the API returns total count)
  // For now, we'll use a placeholder value
  const totalPages = 10;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <Header 
          title="Master Pet"
          subtitle="Descubra e compartilhe receitas para o seu pet"
          onSearch={handleSearchChange}
        />
        
        <RecipeFilters onFilterChange={handleFilterChange} onNewRecipe={handleNewRecipe} />
        
        {recipesQuery.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md h-96 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-8 bg-gray-200 rounded w-full mt-4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : recipesQuery.isError ? (
          <div className="text-center p-8">
            <p className="text-red-500">Erro ao carregar receitas. Tente novamente mais tarde.</p>
            <button 
              onClick={() => recipesQuery.refetch()}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
            >
              Tentar novamente
            </button>
          </div>
        ) : recipesQuery.data?.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-gray-500">Nenhuma receita encontrada. Seja o primeiro a compartilhar!</p>
            <button 
              onClick={handleNewRecipe}
              className="mt-4 px-4 py-2 gradient-btn text-white rounded-lg"
            >
              Criar receita
            </button>
          </div>
        ) : (
          <RecipeGrid 
            recipes={recipesQuery.data || []}
            favorites={favoritesQuery.data || []}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </main>
      
      <MobileSidebar onNewRecipe={handleNewRecipe} />
      
      <RecipeForm 
        open={isRecipeFormOpen} 
        onOpenChange={setIsRecipeFormOpen}
        onSuccess={handleRecipeSuccess}
      />
    </div>
  );
}
