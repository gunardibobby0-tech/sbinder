import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  LogOut,
  Settings,
  Plus,
  Clapperboard,
  Menu,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavContent = () => (
    <div className="flex flex-col h-full bg-[#1c2128] border-r border-white/5">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center shadow-lg shadow-primary/20">
            <Clapperboard className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white font-display">
            STUDIO<span className="text-primary">BINDER</span>
          </h1>
        </div>

        <nav className="space-y-1">
          <Link href="/dashboard">
            <Button
              variant={location === "/dashboard" ? "secondary" : "ghost"}
              className="w-full justify-start gap-3 h-12 text-base font-medium"
            >
              <LayoutDashboard className="w-5 h-5 opacity-70" />
              Projects
            </Button>
          </Link>
          <Link href="/settings">
            <Button
              variant={location === "/settings" ? "secondary" : "ghost"}
              className="w-full justify-start gap-3 h-12 text-base font-medium"
            >
              <Settings className="w-5 h-5 opacity-70" />
              Settings
            </Button>
          </Link>
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold">
            {user?.firstName?.[0] || user?.email?.[0] || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.firstName || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full border-white/10 hover:bg-white/5 hover:text-white"
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 fixed inset-y-0 left-0 z-50">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-card border-white/10">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80 bg-[#1c2128] border-r border-white/10">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      <main className="flex-1 lg:ml-72 min-h-screen">
        {children}
      </main>
    </div>
  );
}
