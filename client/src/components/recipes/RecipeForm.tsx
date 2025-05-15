import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Camera } from "lucide-react";
import { petTypeOptions, categoryOptions, cookingTypeOptions } from "@/lib/utils";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const recipeFormSchema = z.object({
  title: z.string().min(3, { message: "O título deve ter pelo menos 3 caracteres" }),
  petType: z.string({ required_error: "Selecione o tipo de pet" }),
  category: z.string({ required_error: "Selecione uma categoria" }),
  ingredients: z.string().min(10, { message: "Os ingredientes devem ter pelo menos 10 caracteres" }),
  instructions: z.string().min(20, { message: "As instruções devem ter pelo menos 20 caracteres" }),
  prepTime: z.coerce.number().min(1, { message: "O tempo de preparo deve ser maior que 0" }),
  cookingType: z.string({ required_error: "Selecione o tipo de preparo" }),
  youtubeUrl: z.string().url({ message: "URL inválida" }).optional().or(z.literal("")),
  image: z
    .instanceof(FileList)
    .optional()
    .refine((files) => !files || files.length === 0 || files.length === 1, "Uma imagem é permitida")
    .refine(
      (files) => !files || files.length === 0 || files[0].size <= MAX_FILE_SIZE,
      `Tamanho máximo de arquivo é 10MB`
    )
    .refine(
      (files) => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files[0].type),
      "Apenas .jpg, .jpeg, .png e .webp são suportados"
    ),
});

type RecipeFormValues = z.infer<typeof recipeFormSchema>;

interface RecipeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (recipe: any) => void;
  initialData?: Partial<RecipeFormValues>;
  isEditing?: boolean;
}

export function RecipeForm({ 
  open, 
  onOpenChange, 
  onSuccess, 
  initialData, 
  isEditing = false 
}: RecipeFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.imageUrl ? initialData.imageUrl : null
  );
  const { toast } = useToast();

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      petType: initialData?.petType || "",
      category: initialData?.category || "",
      ingredients: initialData?.ingredients || "",
      instructions: initialData?.instructions || "",
      prepTime: initialData?.prepTime || 30,
      cookingType: initialData?.cookingType || "",
      youtubeUrl: initialData?.youtubeUrl || "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: RecipeFormValues) => {
      const formData = new FormData();
      
      // Add form fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (key !== "image") {
          formData.append(key, value?.toString() || "");
        }
      });
      
      // Add image if exists
      const fileList = data.image as FileList;
      if (fileList && fileList.length > 0) {
        formData.append("image", fileList[0]);
      }
      
      const url = isEditing 
        ? `/api/recipes/${initialData?.id}` 
        : "/api/recipes";
      
      const method = isEditing ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        body: formData,
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || res.statusText);
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: isEditing ? "Receita atualizada" : "Receita criada",
        description: isEditing 
          ? "Sua receita foi atualizada com sucesso." 
          : "Sua receita foi publicada com sucesso.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/recipes'] });
      
      if (onSuccess) {
        onSuccess(data);
      }
      
      form.reset();
      setImagePreview(null);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar a receita.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RecipeFormValues) => {
    submitMutation.mutate(data);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar receita" : "Postar nova receita"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Receita</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Biscoitos de Frango para Cães" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="petType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Pet</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {petTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="ingredients"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ingredientes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Digite os ingredientes, um por linha" 
                      {...field} 
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modo de Preparo</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o passo a passo do preparo" 
                      {...field} 
                      rows={5}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="prepTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tempo de Preparo (minutos)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Ex: 30" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cookingType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Preparo</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cookingTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="image"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Foto do Prato</FormLabel>
                  <FormControl>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                      {imagePreview ? (
                        <div className="space-y-2 text-center">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="mx-auto h-32 object-cover rounded-md" 
                          />
                          <div className="flex text-sm justify-center">
                            <Label
                              htmlFor="file-upload"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/80 transition-all"
                            >
                              <span>Alterar imagem</span>
                              <Input
                                id="file-upload"
                                type="file"
                                className="sr-only"
                                accept="image/*"
                                onChange={(e) => {
                                  handleImageChange(e);
                                  onChange(e.target.files);
                                }}
                                {...fieldProps}
                              />
                            </Label>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 text-center">
                          <Camera className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600 justify-center">
                            <Label
                              htmlFor="file-upload"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/80 transition-all"
                            >
                              <span>Carregar uma foto</span>
                              <Input
                                id="file-upload"
                                type="file"
                                className="sr-only"
                                accept="image/*"
                                onChange={(e) => {
                                  handleImageChange(e);
                                  onChange(e.target.files);
                                }}
                                {...fieldProps}
                              />
                            </Label>
                            <p className="pl-1">ou arraste e solte</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, GIF até 10MB
                          </p>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="youtubeUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link do YouTube (opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: https://www.youtube.com/watch?v=..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6 flex items-center justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="text-gray-600"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="gradient-btn"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  "Salvando..."
                ) : isEditing ? (
                  "Atualizar Receita"
                ) : (
                  "Publicar Receita"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
