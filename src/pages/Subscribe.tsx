import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowLeft, Loader2, Sparkles, Wand2, BarChart3, Bot, Layout, Rocket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Subscribe = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(profileData);

      // Use maybeSingle() to handle no subscription gracefully
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      setSubscription(subData);
      setLoading(false);
    };

    fetchUserData();
  }, [navigate]);

  const handleSubscribe = (planType: 'ghost_premium' | 'regulus_premium') => {
    // PayPal plan IDs - Replace with your actual PayPal subscription plan IDs
    const planIds = {
      ghost_premium: 'YOUR_GHOST_PLAN_ID', // Replace with your Ghost Premium plan ID from PayPal
      regulus_premium: 'YOUR_REGULUS_PLAN_ID', // Replace with your Regulus Premium plan ID from PayPal
    };

    const paypalUrl = `https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=${planIds[planType]}&custom_id=${user?.id}`;
    
    window.location.href = paypalUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const isGhostAccount = profile?.account_type !== 'regulus';
  const hasActiveSubscription = subscription?.status === 'active';

  const premiumFeatures = [
    {
      icon: Wand2,
      title: "AI Captions + HD Enhancements",
      description: "AI-powered caption generation and high-definition image processing"
    },
    {
      icon: BarChart3,
      title: "Auto-posting + Advanced Analytics",
      description: "Schedule posts and get detailed engagement insights"
    },
    {
      icon: Bot,
      title: "Unlimited Ray AI",
      description: "Unlimited conversations with your AI assistant"
    },
    {
      icon: Layout,
      title: "Premium Templates",
      description: "Access exclusive post and story templates"
    },
    {
      icon: Rocket,
      title: "Early Access Tools",
      description: "Be the first to try new features before anyone else"
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 glass-card border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/profile")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Upgrade to Premium</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
        {hasActiveSubscription && (
          <Card className="gradient-regulus border-0">
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                Active Subscription
              </CardTitle>
              <CardDescription className="text-center text-foreground/80">
                You're currently subscribed to {subscription.tier === 'ghost_premium' ? 'Ghost Premium' : 'Regulus Premium'}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Premium Features Card */}
        <Card className="glass-card overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
          <CardHeader className="relative">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              {isGhostAccount ? 'Ghost Premium' : 'Regulus Premium'}
            </CardTitle>
            <CardDescription className="text-3xl font-bold text-foreground">
              $5.00<span className="text-sm font-normal text-muted-foreground">/month</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-6">
            <div className="space-y-4">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-4 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                </div>
              ))}
            </div>

            <Button
              className="w-full h-12 text-lg"
              variant="regulus"
              onClick={() => handleSubscribe(isGhostAccount ? 'ghost_premium' : 'regulus_premium')}
              disabled={hasActiveSubscription}
            >
              {hasActiveSubscription ? 'Current Plan' : 'Subscribe Now'}
            </Button>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground px-4">
          Subscriptions are billed monthly via PayPal. Cancel anytime from your PayPal account.
        </p>
      </main>
    </div>
  );
};

export default Subscribe;
