import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { Eye, Edit, Trash2, MoreHorizontal, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";

interface MyRecipesProps {
  favorites?: boolean;
}

export default function MyRecipes({ favorites = false }: MyRecipesProps) {
  const [page, setPage] = useState(1);
  const [isRecipeFormOpen, setIsRecipeFormOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const pageSize = 25;

  // Fetch user's recipes
  const recipesQuery = useQuery({
    queryKey: ['/api/my-recipes', page],
    queryFn: async () => {
      const response = await fetch('/api/auth/me');
      if (!response.ok) throw new Error('Failed to fetch user');
      
      const user = await response.json();
      const recipesResponse = await fetch(`/api/users/${user.id}/recipes?page=${page}&limit=${pageSize}`);
      if (!recipesResponse.ok) throw new Error('Failed to fetch recipes');
      
      return recipesResponse.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (recipeId: number) => {
      await apiRequest('DELETE', `/api/recipes/${recipeId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Receita excluída",
        description: "A receita foi excluída com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/my-recipes'] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir a receita.",
        variant: "destructive",
      });
    },
  });

  const handleEditRecipe = (recipe: any) => {
    setSelectedRecipe(recipe);
    setIsRecipeFormOpen(true);
  };

  const handleDeleteRecipe = (recipe: any) => {
    setSelectedRecipe(recipe);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedRecipe) {
      deleteMutation.mutate(selectedRecipe.id);
    }
  };

  const handleNewRecipe = () => {
    setSelectedRecipe(null);
    setIsRecipeFormOpen(true);
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/my-recipes'] });
    setIsRecipeFormOpen(false);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const totalPages = Math.ceil((recipesQuery.data?.length || 0) / pageSize) || 1;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <Header title="Minhas Receitas" />
        
        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-500">Gerencie suas receitas publicadas</p>
          <Button 
            onClick={handleNewRecipe} 
            className="gradient-btn text-white flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Receita
          </Button>
        </div>
        
        {recipesQuery.isLoading ? (
          <div className="w-full bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded mb-4"></div>
            ))}
          </div>
        ) : recipesQuery.isError ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-red-500 mb-4">Erro ao carregar receitas</p>
            <Button onClick={() => recipesQuery.refetch()}>Tentar novamente</Button>
          </div>
        ) : recipesQuery.data?.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-10 text-center">
            <p className="text-gray-500 mb-4">Você ainda não publicou nenhuma receita</p>
            <Button onClick={handleNewRecipe} className="gradient-btn text-white">
              Publicar minha primeira receita
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo de Pet</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipesQuery.data.map((recipe: any) => (
                    <TableRow key={recipe.id}>
                      <TableCell className="font-medium">{recipe.title}</TableCell>
                      <TableCell>{recipe.petType === 'dog' ? 'Cães' : 'Gatos'}</TableCell>
                      <TableCell>
                        {recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1)}
                      </TableCell>
                      <TableCell>{formatDate(recipe.createdAt)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              className="flex items-center gap-2 cursor-pointer"
                              onClick={() => {
                                // View recipe details (to be implemented)
                                toast({
                                  title: "Visualizar receita",
                                  description: "Esta funcionalidade será implementada em breve.",
                                });
                              }}
                            >
                              <Eye className="h-4 w-4" />
                              <span>Visualizar</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="flex items-center gap-2 cursor-pointer"
                              onClick={() => handleEditRecipe(recipe)}
                            >
                              <Edit className="h-4 w-4" />
                              <span>Editar</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="flex items-center gap-2 cursor-pointer text-red-600"
                              onClick={() => handleDeleteRecipe(recipe)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Excluir</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    {page > 1 && (
                      <PaginationItem>
                        <PaginationPrevious onClick={() => handlePageChange(page - 1)} />
                      </PaginationItem>
                    )}
                    
                    {[...Array(totalPages)].map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink 
                          isActive={page === i + 1}
                          onClick={() => handlePageChange(i + 1)}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    {page < totalPages && (
                      <PaginationItem>
                        <PaginationNext onClick={() => handlePageChange(page + 1)} />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </main>
      
      <MobileSidebar onNewRecipe={handleNewRecipe} />
      
      <RecipeForm 
        open={isRecipeFormOpen} 
        onOpenChange={setIsRecipeFormOpen}
        onSuccess={handleFormSuccess}
        initialData={selectedRecipe}
        isEditing={!!selectedRecipe}
      />
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir receita</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir esta receita? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
