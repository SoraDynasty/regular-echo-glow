import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sun, Moon, Monitor, Vibrate } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import MobileNav from "@/components/MobileNav";
import { useTheme } from "@/hooks/use-theme";
import { useUserSettings } from "@/hooks/useUserSettings";

const AppearanceSettings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { settings, isLoading, updateSettings } = useUserSettings();

  const handleHapticChange = (checked: boolean) => {
    updateSettings({ haptic_feedback: checked });
  };

  const handleFontSizeChange = (size: string) => {
    updateSettings({ font_size: size });
    // Apply font size to document
    document.documentElement.setAttribute("data-font-size", size);
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
        <h1 className="text-xl font-bold">Appearance</h1>
      </header>

      <main className="px-4 space-y-6">
        {/* Theme Section */}
        <section className="glass-card p-4 rounded-2xl space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Theme
          </h2>
          <RadioGroup
            value={theme}
            onValueChange={(value) => setTheme(value as "dark" | "light" | "system")}
            className="space-y-3"
          >
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center border">
                  <Moon className="w-5 h-5" />
                </div>
                <Label htmlFor="dark" className="cursor-pointer font-medium">
                  Dark
                </Label>
              </div>
              <RadioGroupItem value="dark" id="dark" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center border">
                  <Sun className="w-5 h-5 text-amber-600" />
                </div>
                <Label htmlFor="light" className="cursor-pointer font-medium">
                  Light
                </Label>
              </div>
              <RadioGroupItem value="light" id="light" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-800 flex items-center justify-center border">
                  <Monitor className="w-5 h-5 text-white" />
                </div>
                <Label htmlFor="system" className="cursor-pointer font-medium">
                  System
                </Label>
              </div>
              <RadioGroupItem value="system" id="system" />
            </div>
          </RadioGroup>
        </section>

        {/* Haptic Feedback Section */}
        <section className="glass-card p-4 rounded-2xl space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Feedback
          </h2>
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Vibrate className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Haptic Feedback</p>
                <p className="text-xs text-muted-foreground">
                  Vibrate on interactions
                </p>
              </div>
            </div>
            <Switch
              checked={settings?.haptic_feedback ?? true}
              onCheckedChange={handleHapticChange}
              disabled={isLoading}
            />
          </div>
        </section>

        {/* Font Size Section */}
        <section className="glass-card p-4 rounded-2xl space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Font Size
          </h2>
          <RadioGroup
            value={settings?.font_size ?? "medium"}
            onValueChange={handleFontSizeChange}
            className="flex gap-3"
            disabled={isLoading}
          >
            <div
              className={`flex-1 p-4 rounded-xl border-2 text-center cursor-pointer transition-colors ${
                settings?.font_size === "small"
                  ? "border-primary bg-primary/10"
                  : "border-muted bg-muted/50 hover:bg-muted"
              }`}
              onClick={() => handleFontSizeChange("small")}
            >
              <RadioGroupItem value="small" id="small" className="sr-only" />
              <span className="text-sm font-medium">Aa</span>
              <p className="text-xs text-muted-foreground mt-1">Small</p>
            </div>

            <div
              className={`flex-1 p-4 rounded-xl border-2 text-center cursor-pointer transition-colors ${
                settings?.font_size === "medium"
                  ? "border-primary bg-primary/10"
                  : "border-muted bg-muted/50 hover:bg-muted"
              }`}
              onClick={() => handleFontSizeChange("medium")}
            >
              <RadioGroupItem value="medium" id="medium" className="sr-only" />
              <span className="text-base font-medium">Aa</span>
              <p className="text-xs text-muted-foreground mt-1">Medium</p>
            </div>

            <div
              className={`flex-1 p-4 rounded-xl border-2 text-center cursor-pointer transition-colors ${
                settings?.font_size === "large"
                  ? "border-primary bg-primary/10"
                  : "border-muted bg-muted/50 hover:bg-muted"
              }`}
              onClick={() => handleFontSizeChange("large")}
            >
              <RadioGroupItem value="large" id="large" className="sr-only" />
              <span className="text-lg font-medium">Aa</span>
              <p className="text-xs text-muted-foreground mt-1">Large</p>
            </div>
          </RadioGroup>
        </section>
      </main>

      <MobileNav />
    </div>
  );
};

export default AppearanceSettings;
