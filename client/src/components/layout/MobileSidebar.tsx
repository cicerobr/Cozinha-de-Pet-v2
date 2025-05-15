import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Button } from "@/components/ui/button";
import { Menu, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface MobileSidebarProps {
  onNewRecipe?: () => void;
}

export function MobileSidebar({ onNewRecipe }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);

  const handleNewRecipe = () => {
    if (onNewRecipe) {
      onNewRecipe();
    }
  };

  return (
    <>
      <div className="md:hidden fixed bottom-4 right-4 z-20">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="icon" className="h-14 w-14 rounded-full bg-primary text-white shadow-lg">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <Sidebar className="w-full h-full" />
          </SheetContent>
        </Sheet>
      </div>

      {/* Fixed Button for New Recipe (Mobile) */}
      {onNewRecipe && (
        <div className="fixed bottom-16 right-4 md:hidden z-10">
          <Button 
            onClick={handleNewRecipe}
            className="p-4 rounded-full shadow-lg hover:shadow-xl transition-all gradient-btn"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}
    </>
  );
}
