import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "@/hooks/useAuth";

// Pages
import MasterPet from "@/pages/MasterPet";
import MyRecipes from "@/pages/MyRecipes";
import Profile from "@/pages/Profile";
import PetProfile from "@/pages/PetProfile";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "@/pages/not-found";
import { AuthRoute } from "@/components/auth/AuthRoute";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/">
        <AuthRoute>
          <MasterPet />
        </AuthRoute>
      </Route>
      
      <Route path="/my-recipes">
        <AuthRoute>
          <MyRecipes />
        </AuthRoute>
      </Route>
      
      <Route path="/favorites">
        <AuthRoute>
          <MyRecipes favorites={true} />
        </AuthRoute>
      </Route>
      
      <Route path="/profile">
        <AuthRoute>
          <Profile />
        </AuthRoute>
      </Route>
      
      <Route path="/pet/:id">
        {(params) => (
          <AuthRoute>
            <PetProfile id={Number(params.id)} />
          </AuthRoute>
        )}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
