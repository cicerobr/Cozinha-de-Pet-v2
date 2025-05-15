import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Camera, 
  Dog, 
  Cat, 
  Edit, 
  Trash2,
  Calendar,
  Scale
} from "lucide-react";

interface PetProfileProps {
  id: number;
}

const petUpdateSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  breed: z.string().optional(),
  age: z.coerce.number().min(0, "Idade deve ser maior ou igual a 0").optional(),
  weight: z.coerce.number().min(0, "Peso deve ser maior ou igual a 0").optional(),
});

type PetUpdateValues = z.infer<typeof petUpdateSchema>;

export default function PetProfile({ id }: PetProfileProps) {
  const [, setLocation] = useLocation();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [petImageFile, setPetImageFile] = useState<File | null>(null);
  const [petImagePreview, setPetImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch pet details
  const petQuery = useQuery({
    queryKey: [`/api/pets/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/pets/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Pet não encontrado');
        }
        throw new Error('Erro ao carregar informações do pet');
      }
      return response.json();
    },
  });

  // Initialize form with pet data when available
  const form = useForm<PetUpdateValues>({
    resolver: zodResolver(petUpdateSchema),
    defaultValues: {
      name: "",
      breed: "",
      age: undefined,
      weight: undefined,
    },
  });

  // Update form values when pet data is loaded
  React.useEffect(() => {
    if (petQuery.data) {
      form.reset({
        name: petQuery.data.name,
        breed: petQuery.data.breed || "",
        age: petQuery.data.age,
        weight: petQuery.data.weight,
      });
    }
  }, [petQuery.data, form]);

  // Update pet mutation
  const updatePetMutation = useMutation({
    mutationFn: async (data: PetUpdateValues) => {
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });
      
      if (petImageFile) {
        formData.append('profileImage', petImageFile);
      }
      
      const response = await fetch(`/api/pets/${id}`, {
        method: 'PUT',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Pet atualizado",
        description: "As informações do seu pet foram atualizadas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/pets/${id}`] });
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar pet",
        description: error.message || "Ocorreu um erro ao atualizar as informações do seu pet.",
        variant: "destructive",
      });
    },
  });

  // Delete pet mutation
  const deletePetMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/pets/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Pet removido",
        description: "O pet foi removido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pets'] });
      setLocation('/profile');
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover pet",
        description: error.message || "Ocorreu um erro ao remover o pet.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PetUpdateValues) => {
    updatePetMutation.mutate(data);
  };

  const handlePetImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPetImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPetImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = () => {
    deletePetMutation.mutate();
  };

  if (petQuery.isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="container mx-auto max-w-4xl">
            <div className="animate-pulse">
              <div className="h-8 w-32 bg-gray-200 rounded mb-8"></div>
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="h-64 bg-gray-200"></div>
                <div className="p-6 space-y-4">
                  <div className="h-8 w-1/2 bg-gray-200 rounded"></div>
                  <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                  <div className="flex space-x-4">
                    <div className="h-10 w-24 bg-gray-200 rounded"></div>
                    <div className="h-10 w-24 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <MobileSidebar />
      </div>
    );
  }

  if (petQuery.isError) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="container mx-auto max-w-4xl">
            <Button 
              variant="ghost" 
              className="mb-8 flex items-center gap-2"
              onClick={() => setLocation('/profile')}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao perfil
            </Button>
            
            <Card className="text-center p-8">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Erro ao carregar pet</h2>
                <p className="text-gray-600 mb-6">
                  {petQuery.error instanceof Error ? petQuery.error.message : "Ocorreu um erro ao carregar as informações do pet."}
                </p>
                <div className="flex justify-center gap-4">
                  <Button 
                    onClick={() => petQuery.refetch()}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Tentar novamente
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setLocation('/profile')}
                  >
                    Voltar ao perfil
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <MobileSidebar />
      </div>
    );
  }

  const pet = petQuery.data;
  const PetIcon = pet.type === 'dog' ? Dog : Cat;
  const petTypeColor = pet.type === 'dog' ? 'text-primary' : 'text-secondary';

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="container mx-auto max-w-4xl">
          <Button 
            variant="ghost" 
            className="mb-8 flex items-center gap-2"
            onClick={() => setLocation('/profile')}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao perfil
          </Button>
          
          <Card>
            <div className="relative h-64 bg-gray-100">
              {pet.profileImageUrl ? (
                <img
                  src={pet.profileImageUrl}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <PetIcon className={`h-32 w-32 ${petTypeColor}`} />
                </div>
              )}
              <div className={`absolute top-4 right-4 bg-white p-2 rounded-full ${petTypeColor}`}>
                <PetIcon className="h-6 w-6" />
              </div>
            </div>
            
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl">{pet.name}</CardTitle>
                  <CardDescription>
                    {pet.type === 'dog' ? 'Cão' : 'Gato'} • {pet.breed || 'Sem raça definida'}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsEditDialogOpen(true)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-red-600"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {pet.age !== null && pet.age !== undefined && (
                  <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Idade</p>
                      <p className="font-medium">{pet.age} anos</p>
                    </div>
                  </div>
                )}
                
                {pet.weight !== null && pet.weight !== undefined && (
                  <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-3">
                    <Scale className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Peso</p>
                      <p className="font-medium">{pet.weight} kg</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <MobileSidebar />
      
      {/* Edit Pet Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar {pet.name}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    {petImagePreview ? (
                      <AvatarImage src={petImagePreview} alt="Preview" />
                    ) : pet.profileImageUrl ? (
                      <AvatarImage src={pet.profileImageUrl} alt={pet.name} />
                    ) : (
                      <AvatarFallback>
                        <PetIcon className={`h-12 w-12 ${petTypeColor}`} />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <label
                    htmlFor="pet-image-upload"
                    className="absolute bottom-0 right-0 bg-primary text-white p-1 rounded-full cursor-pointer"
                  >
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      id="pet-image-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handlePetImageChange}
                    />
                  </label>
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Pet</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="breed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Raça</FormLabel>
                    <FormControl>
                      <Input placeholder="Raça do seu pet" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Idade</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  className="gradient-btn w-full"
                  disabled={updatePetMutation.isPending}
                >
                  {updatePetMutation.isPending ? "Salvando..." : "Salvar alterações"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pet</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir {pet.name}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletePetMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
