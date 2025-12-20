import { Button } from "@/components/ui/button";
import { Clapperboard } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Login() {
  const { user, login } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) setLocation("/dashboard");
  }, [user, setLocation]);

  return (
    <div className="min-h-screen bg-[#0a0c10] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a0c10] to-[#0a0c10] z-0" />
      
      <div className="w-full max-w-md z-10 space-y-8 text-center animate-in">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-2xl shadow-primary/30 mb-4 transform -rotate-6">
            <Clapperboard className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-display font-bold text-white tracking-wide">
            STUDIO<span className="text-primary">BINDER</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-sm leading-relaxed">
            The world's leading production management software for video, photo, and film professionals.
          </p>
        </div>

        <div className="bg-[#1c2128] p-8 rounded-xl border border-white/10 shadow-xl space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Welcome Back</h2>
            <p className="text-sm text-muted-foreground">Enter to access your projects</p>
          </div>

          <Button 
            onClick={() => login()} 
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
          >
            Enter App
          </Button>

          <p className="text-xs text-muted-foreground">
            You're all set. Click to continue to your projects.
          </p>
        </div>
      </div>
    </div>
  );
}
