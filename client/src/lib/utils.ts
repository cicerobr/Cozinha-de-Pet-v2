import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export const petTypeOptions = [
  { label: "Cães", value: "dog" },
  { label: "Gatos", value: "cat" },
];

export const categoryOptions = [
  { label: "Carnes", value: "meat" },
  { label: "Aves", value: "poultry" },
  { label: "Peixes", value: "fish" },
  { label: "Petiscos", value: "treats" },
];

export const cookingTypeOptions = [
  { label: "Cru", value: "raw" },
  { label: "Cozido", value: "cooked" },
  { label: "Assado", value: "baked" },
  { label: "Misto", value: "mixed" },
];

export function getCategoryColor(category: string): string {
  switch (category) {
    case 'meat':
      return 'bg-primary/10 text-primary';
    case 'poultry':
      return 'bg-tertiary/10 text-tertiary';
    case 'fish':
      return 'bg-secondary/10 text-secondary';
    case 'treats':
      return 'bg-accent/30 text-accent';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function getPetTypeIcon(type: string): string {
  return type === 'dog' ? 'dog' : 'cat';
}

export function getPetTypeColor(type: string): string {
  return type === 'dog' ? 'text-primary' : 'text-secondary';
}

export function getAvatarFallback(name: string): string {
  if (!name) return '';
  const nameParts = name.split(' ');
  if (nameParts.length === 1) {
    return nameParts[0].substring(0, 2).toUpperCase();
  }
  return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
}
