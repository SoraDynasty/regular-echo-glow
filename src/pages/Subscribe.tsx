import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown, Ghost, Eye, Sparkles, Shield, Palette, Lock, Filter, Brain, Rocket } from "lucide-react";
import MobileNav from "@/components/MobileNav";

const premiumFeatures = [
  {
    icon: Ghost,
    title: "Ghost Mode+",
    description: "Enhanced invisibility with zero digital footprint"
  },
  {
    icon: Eye,
    title: "Identity Switch",
    description: "Seamlessly switch between Ghost and Regulus modes"
  },
  {
    icon: Sparkles,
    title: "AI-curated feed",
    description: "Personalized content powered by intelligent algorithms"
  },
  {
    icon: Shield,
    title: "Advanced privacy",
    description: "Military-grade privacy controls and encryption"
  },
  {
    icon: Palette,
    title: "Custom themes",
    description: "Unlock exclusive themes: Midnight, Sunset, Ocean & more"
  },
  {
    icon: Lock,
    title: "Vault posts",
    description: "Private posts only you can see, secured in your vault"
  },
  {
    icon: Filter,
    title: "Anti-social filter",
    description: "Filter out noise and focus on what matters"
  },
  {
    icon: Brain,
    title: "Ellie AI memory mode",
    description: "Ellie remembers your conversations across sessions"
  },
  {
    icon: Rocket,
    title: "Early access",
    description: "Be first to try new features before anyone else"
  }
];

const Subscribe = () => {
  const navigate = useNavigate();

  const handleSubscribe = () => {
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
        <h1 className="text-xl font-bold">Regulargram Premium</h1>
      </header>

      <main className="px-4">
        {/* Hero Section */}
        <div className="glass-card p-6 rounded-3xl mb-6 text-center border border-primary/20">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
            <Crown className="w-10 h-10 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Unlock Premium</h2>
          <p className="text-muted-foreground text-sm">
            Get access to exclusive features and take your Regulargram experience to the next level
          </p>
        </div>

        {/* Features List */}
        <div className="space-y-3 mb-8">
          {premiumFeatures.map((feature, index) => (
            <div 
              key={index}
              className="glass-card p-4 rounded-2xl flex items-start gap-4 border border-border/50"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{feature.title}</h3>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Subscribe Button */}
        <Button 
          onClick={handleSubscribe}
          className="w-full h-14 rounded-2xl text-lg font-semibold"
        >
          <Crown className="w-5 h-5 mr-2" />
          Subscribe to Premium
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Cancel anytime. Secure payment via Lemon Squeezy.
        </p>
      </main>

      <MobileNav />
    </div>
  );
};

export default Subscribe;
