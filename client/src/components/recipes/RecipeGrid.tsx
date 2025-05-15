import { RecipeCard } from "./RecipeCard";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationEllipsis, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";

interface Recipe {
  id: number;
  title: string;
  description?: string;
  imageUrl?: string;
  category: string;
  petType: string;
  rating?: number;
  prepTime: number;
  cookingType: string;
  userId: number;
  user?: {
    id: number;
    username: string;
    profileImageUrl?: string;
  };
}

interface RecipeGridProps {
  recipes: Recipe[];
  favorites?: number[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function RecipeGrid({ 
  recipes, 
  favorites = [],
  currentPage, 
  totalPages, 
  onPageChange 
}: RecipeGridProps) {
  const { toast } = useToast();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const handleComment = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    toast({
      title: "Em desenvolvimento",
      description: "A funcionalidade de comentários estará disponível em breve.",
    });
  };

  const handleShare = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setShareDialogOpen(true);
  };

  const handleCopyLink = (recipeId: number) => {
    const url = `${window.location.origin}/recipe/${recipeId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado!",
      description: "O link da receita foi copiado para a área de transferência.",
    });
    setShareDialogOpen(false);
  };

  const renderPageNumbers = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Always show first page
    if (startPage > 1) {
      pageNumbers.push(
        <PaginationItem key={1}>
          <PaginationLink onClick={() => onPageChange(1)}>1</PaginationLink>
        </PaginationItem>
      );
      
      if (startPage > 2) {
        pageNumbers.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }
    
    // Show current range
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <PaginationItem key={i}>
          <PaginationLink onClick={() => onPageChange(i)} isActive={i === currentPage}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Always show last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      
      pageNumbers.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => onPageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return pageNumbers;
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            isFavorite={favorites.includes(recipe.id)}
            onComment={() => handleComment(recipe)}
            onShare={() => handleShare(recipe)}
          />
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination className="justify-center">
            <PaginationContent>
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationPrevious onClick={() => onPageChange(currentPage - 1)} />
                </PaginationItem>
              )}
              
              {renderPageNumbers()}
              
              {currentPage < totalPages && (
                <PaginationItem>
                  <PaginationNext onClick={() => onPageChange(currentPage + 1)} />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
      
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Compartilhar receita</h3>
            {selectedRecipe && (
              <>
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Compartilhe esta receita com amigos:</p>
                  <p className="mt-2 font-medium">{selectedRecipe.title}</p>
                </div>
                <div className="space-y-4">
                  <button
                    className="w-full p-3 rounded-lg border border-gray-200 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                    onClick={() => handleCopyLink(selectedRecipe.id)}
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                      <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                    </svg>
                    <span>Copiar link</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
