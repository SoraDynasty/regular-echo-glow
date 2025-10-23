import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Eye, Users, MessageCircle } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div 
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(10, 10, 15, 0.85), rgba(10, 10, 15, 0.85)), url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-7xl md:text-8xl font-bold mb-6 text-glow-regulus">
            Regulargram
          </h1>
          <p className="text-2xl md:text-3xl text-muted-foreground mb-4">
            Be real. Stay silent. Or shine as Regulus.
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
            Capture authentic moments when the "Now" notification hits. 
            Choose your presence: visible or invisible.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" variant="regulus" className="text-lg px-8 py-6">
                Get Started
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              Learn More
            </Button>
          </div>
        </div>
      </div>

      {/* Account Types Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Choose Your Presence</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Regulus Card */}
            <div className="glass-card rounded-2xl p-8 glow-regulus transition-all hover:scale-105">
              <div className="w-16 h-16 rounded-full gradient-regulus flex items-center justify-center mb-6">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold mb-4 text-glow-regulus">⚡️ Regulus</h3>
              <p className="text-lg text-muted-foreground mb-6">
                Visible accounts that shine bright. Share your authentic moments with the world, 
                build your following, and be discovered by others.
              </p>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Visible and followable profile</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Share daily moments publicly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Appear on discovery feed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Full interaction capabilities</span>
                </li>
              </ul>
            </div>

            {/* GhostMode Card */}
            <div className="glass-card rounded-2xl p-8 glow-ghost transition-all hover:scale-105">
              <div className="w-16 h-16 rounded-full gradient-ghost flex items-center justify-center mb-6">
                <Eye className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-bold mb-4 text-glow-ghost">🌫️ GhostMode</h3>
              <p className="text-lg text-muted-foreground mb-6">
                Experience quietly without being followed. Three ghost identities let you 
                choose your level of interaction.
              </p>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-secondary">👁️</span>
                  <div>
                    <strong className="text-foreground">Observer</strong> — Watch quietly, no interactions
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-secondary">🌪️</span>
                  <div>
                    <strong className="text-foreground">Ghost</strong> — Invisible presence, can like & react
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-secondary">🔊</span>
                  <div>
                    <strong className="text-foreground">Echo</strong> — Comment anonymously, responses echo back
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📸</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Capture the Moment</h3>
              <p className="text-muted-foreground">
                When the "Now" notification hits, capture a photo or 5-10 second video of what you're doing.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🚫</span>
              </div>
              <h3 className="text-xl font-bold mb-3">No Filters, No Edits</h3>
              <p className="text-muted-foreground">
                Post once per day. No retakes, no filters — just real life, beautifully minimal.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">💬</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Connect & React</h3>
              <p className="text-muted-foreground">
                React with 👀, 💬, ❤️, or 🔥. Echo users can even comment anonymously.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p className="mb-4">Regulargram — Authentic moments, your way</p>
          <Link to="/auth">
            <Button variant="link">Join Now</Button>
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
