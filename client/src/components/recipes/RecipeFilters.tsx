import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { petTypeOptions, categoryOptions } from "@/lib/utils";
import { Plus } from "lucide-react";

interface RecipeFiltersProps {
  onFilterChange: (filters: { petType: string; category: string }) => void;
  onNewRecipe: () => void;
}

export function RecipeFilters({ onFilterChange, onNewRecipe }: RecipeFiltersProps) {
  const [petType, setPetType] = useState<string>("");
  const [category, setCategory] = useState<string>("");

  const handlePetTypeChange = (value: string) => {
    setPetType(value);
    onFilterChange({ petType: value, category });
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    onFilterChange({ petType, category: value });
  };

  return (
    <div className="mb-8 flex flex-col md:flex-row gap-4">
      <div className="flex-1 flex items-center gap-4">
        <div className="w-full md:w-48">
          <Label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pet</Label>
          <Select value={petType} onValueChange={handlePetTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {petTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full md:w-48">
          <Label className="block text-sm font-medium text-gray-700 mb-1">Categorias</Label>
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas</SelectItem>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Button 
        onClick={onNewRecipe}
        className="gradient-btn text-white font-medium py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 self-end"
      >
        <Plus className="h-4 w-4" />
        <span>Postar minha receita</span>
      </Button>
    </div>
  );
}
