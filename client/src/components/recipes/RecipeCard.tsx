import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Heart, MessageSquare, Share2, Clock, Flame } from "lucide-react";
import { Cat, Dog } from "lucide-react";
import { cn, getCategoryColor, getPetTypeIcon, getAvatarFallback } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface RecipeCardProps {
  recipe: {
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
  };
  isFavorite?: boolean;
  onComment?: () => void;
  onShare?: () => void;
}

export function RecipeCard({ recipe, isFavorite: initialFavorite = false, onComment, onShare }: RecipeCardProps) {
  const { isAuthenticated } = useAuth();
  const [isFavorite, setIsFavorite] = useState(initialFavorite);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) return;
      
      if (isFavorite) {
        await apiRequest('DELETE', `/api/recipes/${recipe.id}/favorite`, {});
      } else {
        await apiRequest('POST', `/api/recipes/${recipe.id}/favorite`, {});
      }
    },
    onSuccess: () => {
      setIsFavorite(!isFavorite);
      queryClient.invalidateQueries({ queryKey: ['/api/users', 'favorites'] });
    },
  });
  
  const handleFavoriteClick = () => {
    if (!isAuthenticated) return;
    toggleFavoriteMutation.mutate();
  };

  const handleCookCountMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) return;
      await apiRequest('POST', `/api/recipes/${recipe.id}/cook`, {});
    }
  });

  const categoryLabel = recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1);
  const PetIcon = recipe.petType === 'dog' ? Dog : Cat;
  const petIconColor = recipe.petType === 'dog' ? 'text-primary' : 'text-secondary';

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg card-shadow card-shadow-hover">
      <div className="relative h-48">
        {recipe.imageUrl ? (
          <img 
            src={recipe.imageUrl} 
            alt={recipe.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <PetIcon className={cn("w-12 h-12", petIconColor)} />
          </div>
        )}
        <div className="absolute top-3 right-3 bg-white p-2 rounded-lg shadow">
          <PetIcon className={cn("w-5 h-5", petIconColor)} />
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <Badge className={cn("font-normal text-xs", getCategoryColor(recipe.category))}>
            {categoryLabel}
          </Badge>
          
          {recipe.rating && (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-medium">{recipe.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        
        <h3 className="font-semibold text-lg mb-2">{recipe.title}</h3>
        
        {recipe.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {recipe.description}
          </p>
        )}
        
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">{recipe.prepTime} min</span>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">
              {recipe.cookingType.charAt(0).toUpperCase() + recipe.cookingType.slice(1)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          {recipe.user && (
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8 rounded-full overflow-hidden">
                {recipe.user.profileImageUrl ? (
                  <AvatarImage src={recipe.user.profileImageUrl} alt={recipe.user.username} />
                ) : (
                  <AvatarFallback>{getAvatarFallback(recipe.user.username)}</AvatarFallback>
                )}
              </Avatar>
              <span className="text-sm font-medium">{recipe.user.username}</span>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "text-gray-400 hover:text-primary transition-all",
                    isFavorite && "text-secondary"
                  )}
                  onClick={handleFavoriteClick}
                >
                  <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-gray-400 hover:text-primary transition-all"
                  onClick={onComment}
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Comentar</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-gray-400 hover:text-primary transition-all"
                  onClick={onShare}
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Compartilhar</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
