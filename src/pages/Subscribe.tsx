import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowLeft, Loader2 } from "lucide-react";
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

      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      setSubscription(subData);
      setLoading(false);
    };

    fetchUserData();
  }, [navigate]);

  const handleSubscribe = (planType: 'ghost_premium' | 'regulus_premium') => {
    toast({
      title: "Coming Soon",
      description: "Subscription payments will be available soon.",
    });
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
          <h1 className="text-lg font-semibold">Upgrade</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
        {hasActiveSubscription && (
          <Card className="gradient-regulus border-0">
            <CardHeader>
              <CardTitle className="text-center">Active Subscription</CardTitle>
              <CardDescription className="text-center text-foreground/80">
                You're currently subscribed to {subscription.tier === 'ghost_premium' ? 'Ghost Premium' : 'Regulus Premium'}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {isGhostAccount ? (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-xl">Ghost Premium</CardTitle>
              <CardDescription className="text-2xl font-bold text-foreground">
                $5.00<span className="text-sm font-normal text-muted-foreground">/month</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Enhanced privacy controls</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>AI-powered feed curation</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Custom themes and appearance</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Ray premium features with conversation memory</span>
                </li>
              </ul>
              <Button
                className="w-full"
                variant="regulus"
                onClick={() => handleSubscribe('ghost_premium')}
                disabled={hasActiveSubscription}
              >
                {hasActiveSubscription && subscription?.tier === 'ghost_premium' ? 'Current Plan' : 'Coming Soon'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-xl">Regulus Premium</CardTitle>
              <CardDescription className="text-2xl font-bold text-foreground">
                $5.00<span className="text-sm font-normal text-muted-foreground">/month</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Creator mode with advanced analytics</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Unlimited followers and reach</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Receive tips via PayPal</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Priority support and features</span>
                </li>
              </ul>
              <Button
                className="w-full"
                variant="regulus"
                onClick={() => handleSubscribe('regulus_premium')}
                disabled={hasActiveSubscription}
              >
                {hasActiveSubscription && subscription?.tier === 'regulus_premium' ? 'Current Plan' : 'Coming Soon'}
              </Button>
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-center text-muted-foreground px-4">
          Premium subscriptions coming soon. Stay tuned for updates!
        </p>
      </main>
    </div>
  );
};

export default Subscribe;
