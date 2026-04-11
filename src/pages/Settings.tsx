import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Bell, Shield, Palette, Search } from "lucide-react";
import MobileNav from "@/components/MobileNav";

const Settings = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="safe-area-top px-4 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold">Settings</h1>
      </header>

      <main className="px-4 space-y-6">
        <section className="glass-card p-4 rounded-2xl space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Account</h2>
          <Button variant="ghost" className="w-full justify-start gap-3 h-12" onClick={() => navigate("/edit-profile")}>
            <User className="w-5 h-5" />Edit Profile
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 h-12" onClick={() => navigate("/notifications")}>
            <Bell className="w-5 h-5" />Notifications
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 h-12" onClick={() => navigate("/settings/privacy")}>
            <Shield className="w-5 h-5" />Privacy & Security
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 h-12" onClick={() => navigate("/settings/appearance")}>
            <Palette className="w-5 h-5" />Appearance
          </Button>
        </section>

        <section className="glass-card p-4 rounded-2xl space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tools</h2>
          <Button variant="ghost" className="w-full justify-start gap-3 h-12" onClick={() => navigate("/ellie-research")}>
            <Search className="w-5 h-5" />Ellie Research
          </Button>
        </section>
      </main>

      <MobileNav />
    </div>
  );
};

export default Settings;
