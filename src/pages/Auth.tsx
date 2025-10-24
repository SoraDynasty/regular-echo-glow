import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, Ghost } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [accountType, setAccountType] = useState<"regulus" | "ghost">("regulus");
  const [ghostType, setGhostType] = useState<"observer" | "ghost" | "echo">("observer");

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/feed");
      }
    });
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !username) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            account_type: accountType,
            ghost_type: accountType === "ghost" ? ghostType : null,
          },
          emailRedirectTo: `${window.location.origin}/feed`,
        },
      });

      if (error) throw error;

      if (data.user) {
        toast.success("Account created! Redirecting...");
        navigate("/feed");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        toast.success("Welcome back!");
        navigate("/feed");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-gradient-to-b from-background to-card/50 safe-area-top safe-area-bottom">
      <Card className="w-full max-w-md glass-card border-border/50">
        <CardHeader className="text-center px-4 md:px-6">
          <CardTitle className="text-3xl md:text-4xl font-bold text-glow-regulus mb-2">
            Regulargram
          </CardTitle>
          <CardDescription className="text-sm md:text-base">
            Be real. Stay silent. Or shine as Regulus.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 md:px-6">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  variant="regulus"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="yourname"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <Label className="text-sm md:text-base">Account Type</Label>
                  <RadioGroup
                    value={accountType}
                    onValueChange={(value) => setAccountType(value as "regulus" | "ghost")}
                    disabled={loading}
                  >
                    <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-3 rounded-lg border border-border hover:bg-card/50 transition-colors">
                      <RadioGroupItem value="regulus" id="regulus" />
                      <Label htmlFor="regulus" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <div>
                          <div className="text-sm md:text-base font-semibold">Regulus</div>
                          <div className="text-xs text-muted-foreground">Visible & followable</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-3 rounded-lg border border-border hover:bg-card/50 transition-colors">
                      <RadioGroupItem value="ghost" id="ghost" />
                      <Label htmlFor="ghost" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Ghost className="w-4 h-4 text-secondary" />
                        <div>
                          <div className="text-sm md:text-base font-semibold">GhostMode</div>
                          <div className="text-xs text-muted-foreground">Private & silent</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {accountType === "ghost" && (
                  <div className="space-y-3">
                    <Label className="text-sm md:text-base">Ghost Identity</Label>
                    <RadioGroup
                      value={ghostType}
                      onValueChange={(value) => setGhostType(value as "observer" | "ghost" | "echo")}
                      disabled={loading}
                    >
                      <div className="flex items-center space-x-2 p-2 rounded-lg border border-border hover:bg-card/50 transition-colors">
                        <RadioGroupItem value="observer" id="observer" />
                        <Label htmlFor="observer" className="cursor-pointer text-sm md:text-base flex-1">
                          👁️ Observer — Watch quietly
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-2 rounded-lg border border-border hover:bg-card/50 transition-colors">
                        <RadioGroupItem value="ghost" id="ghost-type" />
                        <Label htmlFor="ghost-type" className="cursor-pointer text-sm md:text-base flex-1">
                          🌪️ Ghost — React invisibly
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-2 rounded-lg border border-border hover:bg-card/50 transition-colors">
                        <RadioGroupItem value="echo" id="echo" />
                        <Label htmlFor="echo" className="cursor-pointer text-sm md:text-base flex-1">
                          🔊 Echo — Comment anonymously
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  variant={accountType === "regulus" ? "regulus" : "ghostmode"}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
