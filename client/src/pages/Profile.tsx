import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { RecipeGrid } from "@/components/recipes/RecipeGrid";
import { Plus, User, MapPin, Camera, Pencil } from "lucide-react";
import { getAvatarFallback } from "@/lib/utils";

const profileFormSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("E-mail inválido"),
  state: z.string().optional(),
  city: z.string().optional(),
});

const petFormSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  type: z.string(),
  breed: z.string().optional(),
  age: z.coerce.number().min(0, "Idade deve ser maior ou igual a 0").optional(),
  weight: z.coerce.number().min(0, "Peso deve ser maior ou igual a 0").optional(),
  profileImage: z.any().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PetFormValues = z.infer<typeof petFormSchema>;

export default function Profile() {
  const [isPetDialogOpen, setPetDialogOpen] = useState(false);
  const [isRecipeFormOpen, setIsRecipeFormOpen] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [petImageFile, setPetImageFile] = useState<File | null>(null);
  const [petImagePreview, setPetImagePreview] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [favoritesPage, setFavoritesPage] = useState(1);
  const pageSize = 6;
  const { toast } = useToast();

  // Fetch user profile
  const profileQuery = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const response = await fetch('/api/auth/me');
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
  });

  // Fetch user's pets
  const petsQuery = useQuery({
    queryKey: ['/api/pets'],
    queryFn: async () => {
      const response = await fetch('/api/pets');
      if (!response.ok) throw new Error('Failed to fetch pets');
      return response.json();
    },
  });

  // Fetch user's recipes
  const recipesQuery = useQuery({
    queryKey: ['/api/user/recipes', currentPage],
    queryFn: async () => {
      if (!profileQuery.data?.id) return { recipes: [], totalCount: 0 };
      
      const response = await fetch(`/api/users/${profileQuery.data.id}/recipes?page=${currentPage}&limit=${pageSize}`);
      if (!response.ok) throw new Error('Failed to fetch recipes');
      
      const recipes = await response.json();
      return { recipes, totalCount: recipes.length }; // Assuming the API returns total count
    },
    enabled: !!profileQuery.data?.id,
  });

  // Fetch user's favorite recipes
  const favoritesQuery = useQuery({
    queryKey: ['/api/user/favorites', favoritesPage],
    queryFn: async () => {
      if (!profileQuery.data?.id) return { recipes: [], totalCount: 0 };
      
      const response = await fetch(`/api/users/${profileQuery.data.id}/favorites?page=${favoritesPage}&limit=${pageSize}`);
      if (!response.ok) throw new Error('Failed to fetch favorites');
      
      const favorites = await response.json();
      return { recipes: favorites, totalCount: favorites.length }; // Assuming the API returns total count
    },
    enabled: !!profileQuery.data?.id,
  });

  // Form for user profile
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: profileQuery.data?.firstName || "",
      lastName: profileQuery.data?.lastName || "",
      email: profileQuery.data?.email || "",
      state: profileQuery.data?.state || "",
      city: profileQuery.data?.city || "",
    },
  });

  // Update form values when profile data is loaded
  useEffect(() => {
    if (profileQuery.data) {
      profileForm.reset({
        firstName: profileQuery.data.firstName || "",
        lastName: profileQuery.data.lastName || "",
        email: profileQuery.data.email || "",
        state: profileQuery.data.state || "",
        city: profileQuery.data.city || "",
      });
    }
  }, [profileQuery.data, profileForm]);

  // Form for adding a pet
  const petForm = useForm<PetFormValues>({
    resolver: zodResolver(petFormSchema),
    defaultValues: {
      name: "",
      type: "dog",
      breed: "",
      age: undefined,
      weight: undefined,
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value.toString());
      });
      
      if (profileImageFile) {
        formData.append('profileImage', profileImageFile);
      }
      
      const response = await fetch('/api/users/profile', {
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
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message || "Ocorreu um erro ao atualizar suas informações.",
        variant: "destructive",
      });
    },
  });

  // Add pet mutation
  const addPetMutation = useMutation({
    mutationFn: async (data: PetFormValues) => {
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && key !== 'profileImage') {
          formData.append(key, value.toString());
        }
      });
      
      if (petImageFile) {
        formData.append('profileImage', petImageFile);
      }
      
      const response = await fetch('/api/pets', {
        method: 'POST',
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
        title: "Pet adicionado",
        description: "Seu pet foi adicionado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pets'] });
      setPetDialogOpen(false);
      petForm.reset();
      setPetImageFile(null);
      setPetImagePreview(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar pet",
        description: error.message || "Ocorreu um erro ao adicionar seu pet.",
        variant: "destructive",
      });
    },
  });

  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  const onPetSubmit = (data: PetFormValues) => {
    addPetMutation.mutate(data);
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
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

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Perfil</h1>
        
        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>Atualize suas informações pessoais</CardDescription>
                </div>
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    {profileImagePreview ? (
                      <AvatarImage src={profileImagePreview} alt="Preview" />
                    ) : profileQuery.data?.profileImageUrl ? (
                      <AvatarImage src={profileQuery.data.profileImageUrl} alt={profileQuery.data.username} />
                    ) : (
                      <AvatarFallback>
                        {getAvatarFallback(
                          profileQuery.data?.firstName || 
                          profileQuery.data?.username || 
                          ""
                        )}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <label
                    htmlFor="profile-image-upload"
                    className="absolute bottom-0 right-0 bg-primary text-white p-1 rounded-full cursor-pointer"
                  >
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      id="profile-image-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                    />
                  </label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu nome" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sobrenome</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu sobrenome" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input placeholder="seu@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu estado" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input placeholder="Sua cidade" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      className="gradient-btn"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? "Salvando..." : "Salvar alterações"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Meus Pets</CardTitle>
                <CardDescription>Gerencie os perfis dos seus pets</CardDescription>
              </div>
              <Dialog open={isPetDialogOpen} onOpenChange={setPetDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gradient-btn">Adicionar Pet</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Pet</DialogTitle>
                    <DialogDescription>
                      Preencha as informações do seu pet
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...petForm}>
                    <form onSubmit={petForm.handleSubmit(onPetSubmit)} className="space-y-4">
                      <div className="flex justify-center mb-4">
                        <div className="relative">
                          <Avatar className="w-24 h-24">
                            {petImagePreview ? (
                              <AvatarImage src={petImagePreview} alt="Preview" />
                            ) : (
                              <AvatarFallback>
                                <User className="h-12 w-12 text-gray-400" />
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
                        control={petForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Pet</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome do seu pet" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={petForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo</FormLabel>
                            <FormControl>
                              <select
                                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                {...field}
                              >
                                <option value="dog">Cão</option>
                                <option value="cat">Gato</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={petForm.control}
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
                          control={petForm.control}
                          name="age"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Idade</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Idade" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={petForm.control}
                          name="weight"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Peso (kg)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Peso" {...field} />
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
                          disabled={addPetMutation.isPending}
                        >
                          {addPetMutation.isPending ? "Adicionando..." : "Adicionar Pet"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {petsQuery.isLoading ? (
                <div className="flex space-x-4 overflow-x-auto pb-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="min-w-[200px] h-48 animate-pulse bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              ) : petsQuery.isError ? (
                <div className="text-center py-8">
                  <p className="text-red-500">Erro ao carregar seus pets</p>
                  <Button 
                    onClick={() => petsQuery.refetch()}
                    className="mt-4"
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : petsQuery.data?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Você ainda não adicionou nenhum pet</p>
                  <Button 
                    onClick={() => setPetDialogOpen(true)}
                    className="mt-4 gradient-btn"
                  >
                    Adicionar meu primeiro pet
                  </Button>
                </div>
              ) : (
                <div className="flex space-x-4 overflow-x-auto pb-4">
                  {petsQuery.data.map((pet: any) => (
                    <div 
                      key={pet.id} 
                      className="min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all"
                    >
                      <div className="h-32 bg-gray-200 relative">
                        {pet.profileImageUrl ? (
                          <img 
                            src={pet.profileImageUrl} 
                            alt={pet.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {pet.type === 'dog' ? (
                              <svg 
                                className="w-12 h-12 text-primary"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  strokeWidth={2} 
                                  d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" 
                                />
                              </svg>
                            ) : (
                              <svg 
                                className="w-12 h-12 text-secondary"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  strokeWidth={2} 
                                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" 
                                />
                              </svg>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold">{pet.name}</h3>
                        <p className="text-sm text-gray-500">
                          {pet.type === 'dog' ? 'Cão' : 'Gato'} • {pet.breed || 'Sem raça definida'}
                        </p>
                        <div className="mt-2 flex justify-between">
                          {pet.age && (
                            <span className="text-xs text-gray-500">{pet.age} anos</span>
                          )}
                          {pet.weight && (
                            <span className="text-xs text-gray-500">{pet.weight} kg</span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-3"
                          onClick={() => {
                            // Navigate to pet profile (to be implemented)
                            window.location.href = `/pet/${pet.id}`;
                          }}
                        >
                          Visualizar perfil
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Minhas Receitas e Favoritos</CardTitle>
              <CardDescription>Gerencie suas receitas e favoritos</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="recipes">
                <TabsList className="mb-6">
                  <TabsTrigger value="recipes">Minhas Receitas</TabsTrigger>
                  <TabsTrigger value="favorites">Receitas Favoritas</TabsTrigger>
                </TabsList>
                <TabsContent value="recipes">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Receitas Publicadas</h3>
                    <Button 
                      onClick={() => setIsRecipeFormOpen(true)}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Nova Receita
                    </Button>
                  </div>
                  
                  {recipesQuery.isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-80 animate-pulse bg-gray-200 rounded-lg"></div>
                      ))}
                    </div>
                  ) : recipesQuery.isError ? (
                    <div className="text-center py-8">
                      <p className="text-red-500">Erro ao carregar suas receitas</p>
                      <Button 
                        onClick={() => recipesQuery.refetch()}
                        className="mt-4"
                      >
                        Tentar novamente
                      </Button>
                    </div>
                  ) : recipesQuery.data?.recipes.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Você ainda não publicou nenhuma receita</p>
                      <Button 
                        onClick={() => setIsRecipeFormOpen(true)}
                        className="mt-4 gradient-btn"
                      >
                        Publicar minha primeira receita
                      </Button>
                    </div>
                  ) : (
                    <RecipeGrid 
                      recipes={recipesQuery.data.recipes}
                      favorites={favoritesQuery.data?.recipes.map((r: any) => r.id) || []}
                      currentPage={currentPage}
                      totalPages={Math.ceil((recipesQuery.data.totalCount || 0) / pageSize) || 1}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </TabsContent>
                <TabsContent value="favorites">
                  <h3 className="text-lg font-semibold mb-4">Receitas Favoritas</h3>
                  
                  {favoritesQuery.isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-80 animate-pulse bg-gray-200 rounded-lg"></div>
                      ))}
                    </div>
                  ) : favoritesQuery.isError ? (
                    <div className="text-center py-8">
                      <p className="text-red-500">Erro ao carregar seus favoritos</p>
                      <Button 
                        onClick={() => favoritesQuery.refetch()}
                        className="mt-4"
                      >
                        Tentar novamente
                      </Button>
                    </div>
                  ) : favoritesQuery.data?.recipes.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Você ainda não favoritou nenhuma receita</p>
                      <Button 
                        onClick={() => window.location.href = '/'}
                        className="mt-4 gradient-btn"
                      >
                        Explorar receitas
                      </Button>
                    </div>
                  ) : (
                    <RecipeGrid 
                      recipes={favoritesQuery.data.recipes}
                      favorites={favoritesQuery.data.recipes.map((r: any) => r.id)}
                      currentPage={favoritesPage}
                      totalPages={Math.ceil((favoritesQuery.data.totalCount || 0) / pageSize) || 1}
                      onPageChange={setFavoritesPage}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <MobileSidebar onNewRecipe={() => setIsRecipeFormOpen(true)} />
      
      <RecipeForm 
        open={isRecipeFormOpen} 
        onOpenChange={setIsRecipeFormOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/user/recipes'] });
        }}
      />
    </div>
  );
}
