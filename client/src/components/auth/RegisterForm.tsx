import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Search } from "lucide-react";

const registerSchema = z.object({
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirme sua senha"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { register: registerUser, isLoading } = useAuth();
  const [error, setError] = useState("");

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setError("");
      const { confirmPassword, ...userData } = data;
      await registerUser(userData);
    } catch (err) {
      setError("Falha no cadastro. Verifique os dados e tente novamente.");
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="mb-2 inline-flex items-center justify-center">
            <Search className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Cozinha de Pet</h2>
          <p className="text-gray-500 mt-2">Crie sua conta</p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                Nome (opcional)
              </Label>
              <Input
                id="firstName"
                placeholder="Seu nome"
                {...form.register("firstName")}
                className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            
            <div>
              <Label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Sobrenome (opcional)
              </Label>
              <Input
                id="lastName"
                placeholder="Seu sobrenome"
                {...form.register("lastName")}
                className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Nome de usuário
            </Label>
            <Input
              id="username"
              placeholder="Escolha um nome de usuário"
              {...form.register("username")}
              className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {form.formState.errors.username && (
              <p className="text-red-600 text-sm mt-1">
                {form.formState.errors.username.message}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              {...form.register("email")}
              className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {form.formState.errors.email && (
              <p className="text-red-600 text-sm mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...form.register("password")}
              className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {form.formState.errors.password && (
              <p className="text-red-600 text-sm mt-1">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar senha
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...form.register("confirmPassword")}
              className="w-full py-2 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-red-600 text-sm mt-1">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
          
          <Button
            type="submit"
            className="w-full gradient-btn text-white font-medium py-3 px-6 rounded-lg shadow-md hover:shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? "Cadastrando..." : "Cadastrar"}
          </Button>
        </form>
        
        <p className="text-center text-sm text-gray-500 mt-6">
          Já tem uma conta?{" "}
          <Link href="/login">
            <a className="font-medium text-primary hover:text-primary/80 transition-all">
              Faça login
            </a>
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
