import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown, CreditCard, User, Bell, Shield, Palette } from "lucide-react";
import MobileNav from "@/components/MobileNav";

const Settings = () => {
  const navigate = useNavigate();

  const handleUpgradeToPremium = () => {
    window.open("https://regulargram.lemonsqueezy.com/buy/bf74052a-6a77-479a-a893-52ec2fe2fd04", "_blank");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="safe-area-top px-4 py-4 flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="rounded-full"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold">Settings</h1>
      </header>

      <main className="px-4 space-y-6">
        {/* Account Section */}
        <section className="glass-card p-4 rounded-2xl space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Account</h2>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 h-12"
            onClick={() => navigate("/edit-profile")}
          >
            <User className="w-5 h-5" />
            Edit Profile
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 h-12"
            onClick={() => navigate("/notifications")}
          >
            <Bell className="w-5 h-5" />
            Notifications
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 h-12"
          >
            <Shield className="w-5 h-5" />
            Privacy & Security
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 h-12"
          >
            <Palette className="w-5 h-5" />
            Appearance
          </Button>
        </section>

        {/* Billing Section */}
        <section className="glass-card p-4 rounded-2xl space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Billing</h2>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Regulargram Premium</p>
              <p className="text-xs text-muted-foreground">Unlock all premium features</p>
            </div>
          </div>
          <Button 
            onClick={handleUpgradeToPremium}
            className="w-full h-12 gap-2"
          >
            <CreditCard className="w-5 h-5" />
            Upgrade to Premium
          </Button>
          <Button 
            variant="outline"
            className="w-full h-12 gap-2"
            onClick={() => navigate("/subscribe")}
          >
            <Crown className="w-5 h-5" />
            View Premium Benefits
          </Button>
        </section>
      </main>

      <MobileNav />
    </div>
  );
};

export default Settings;
