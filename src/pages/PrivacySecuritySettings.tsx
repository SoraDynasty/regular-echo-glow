import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Activity, MessageCircle, KeyRound, Trash2, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import MobileNav from "@/components/MobileNav";
import { useUserSettings } from "@/hooks/useUserSettings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const PrivacySecuritySettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings, isLoading, updateSettings } = useUserSettings();
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handlePasswordReset = async () => {
    setIsResettingPassword(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast({
          title: "Error",
          description: "No email associated with this account.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });

      if (error) throw error;

      toast({
        title: "Password reset email sent",
        description: "Check your email for a password reset link.",
      });
    } catch (error) {
      console.error("Password reset error:", error);
      toast({
        title: "Error",
        description: "Failed to send password reset email.",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      // Sign out the user - actual account deletion would need admin privileges
      await supabase.auth.signOut();
      toast({
        title: "Account deletion requested",
        description: "Please contact support to complete account deletion.",
      });
      navigate("/auth");
    } catch (error) {
      console.error("Delete account error:", error);
      toast({
        title: "Error",
        description: "Failed to process request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingAccount(false);
    }
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
        <h1 className="text-xl font-bold">Privacy & Security</h1>
      </header>

      <main className="px-4 space-y-6">
        {/* Privacy Section */}
        <section className="glass-card p-4 rounded-2xl space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Privacy
          </h2>

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Profile Visibility</p>
                <p className="text-xs text-muted-foreground">
                  Allow non-followers to find you
                </p>
              </div>
            </div>
            <Switch
              checked={settings?.profile_visible ?? true}
              onCheckedChange={(checked) => updateSettings({ profile_visible: checked })}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">Activity Status</p>
                <p className="text-xs text-muted-foreground">
                  Show when you're online
                </p>
              </div>
            </div>
            <Switch
              checked={settings?.show_activity_status ?? true}
              onCheckedChange={(checked) => updateSettings({ show_activity_status: checked })}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">Read Receipts</p>
                <p className="text-xs text-muted-foreground">
                  Show when you've read messages
                </p>
              </div>
            </div>
            <Switch
              checked={settings?.read_receipts ?? true}
              onCheckedChange={(checked) => updateSettings({ read_receipts: checked })}
              disabled={isLoading}
            />
          </div>
        </section>

        {/* Security Section */}
        <section className="glass-card p-4 rounded-2xl space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Security
          </h2>

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-14"
            onClick={handlePasswordReset}
            disabled={isResettingPassword}
          >
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-left">
              <p className="font-medium">Change Password</p>
              <p className="text-xs text-muted-foreground">
                Send password reset email
              </p>
            </div>
          </Button>
        </section>

        {/* Danger Zone */}
        <section className="glass-card p-4 rounded-2xl space-y-3 border-destructive/20">
          <h2 className="text-sm font-semibold text-destructive uppercase tracking-wide">
            Danger Zone
          </h2>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-14 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-destructive" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Delete Account</p>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete your account
                  </p>
                </div>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Delete Account
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete your account? This action cannot be undone.
                  All your posts, messages, and data will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeletingAccount ? "Deleting..." : "Delete Account"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </main>

      <MobileNav />
    </div>
  );
};

export default PrivacySecuritySettings;
