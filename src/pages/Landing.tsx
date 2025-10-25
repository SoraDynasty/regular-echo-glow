import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Eye, Users, MessageCircle } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
const Landing = () => {
  return <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden safe-area-top" style={{
      backgroundImage: `linear-gradient(rgba(10, 10, 15, 0.85), rgba(10, 10, 15, 0.85)), url(${heroBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 text-center">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-marker mb-6 text-glow-regulus tracking-wider">
            Regulargram
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-muted-foreground mb-4">
            Be real. Stay silent. Or shine as Regulus.
          </p>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-12 px-4">
            Capture authentic moments when the "Now" notification hits. 
            Choose your presence: visible or invisible.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <Link to="/auth">
              <Button size="lg" variant="regulus" className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 w-full sm:w-auto">
                Get Started
              </Button>
            </Link>
            
          </div>
        </div>
      </div>

      {/* Account Types Section */}
      <section className="py-16 md:py-24 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16">Choose Your Presence</h2>
          
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {/* Regulus Card */}
            <div className="glass-card rounded-2xl p-6 md:p-8 glow-regulus transition-all hover:scale-105">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full gradient-regulus flex items-center justify-center mb-4 md:mb-6">
                <Users className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 text-glow-regulus">⚡️ Regulus</h3>
              <p className="text-base md:text-lg text-muted-foreground mb-4 md:mb-6">
                Visible accounts that shine bright. Share your authentic moments with the world, 
                build your following, and be discovered by others.
              </p>
              <ul className="space-y-2 md:space-y-3 text-sm md:text-base text-muted-foreground">
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
            <div className="glass-card rounded-2xl p-6 md:p-8 glow-ghost transition-all hover:scale-105">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full gradient-ghost flex items-center justify-center mb-4 md:mb-6">
                <Eye className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 text-glow-ghost">🌫️ GhostMode</h3>
              <p className="text-base md:text-lg text-muted-foreground mb-4 md:mb-6">
                Experience quietly without being followed. Three ghost identities let you 
                choose your level of interaction.
              </p>
              <ul className="space-y-3 md:space-y-4 text-sm md:text-base text-muted-foreground">
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
      <section className="py-16 md:py-24 px-4 md:px-6 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center px-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 md:mb-6">
                <span className="text-3xl md:text-4xl">📸</span>
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Capture the Moment</h3>
              <p className="text-sm md:text-base text-muted-foreground">
                When the "Now" notification hits, capture a photo or 5-10 second video of what you're doing.
              </p>
            </div>

            <div className="text-center px-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 md:mb-6">
                <span className="text-3xl md:text-4xl">🚫</span>
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">No Filters, No Edits</h3>
              <p className="text-sm md:text-base text-muted-foreground">
                Post once per day. No retakes, no filters — just real life, beautifully minimal.
              </p>
            </div>

            <div className="text-center px-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 md:mb-6">
                <span className="text-3xl md:text-4xl">💬</span>
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Connect & React</h3>
              <p className="text-sm md:text-base text-muted-foreground">
                React with 👀, 💬, ❤️, or 🔥. Echo users can even comment anonymously.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 md:px-6 border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p className="mb-4 text-sm md:text-base">Regulargram — Authentic moments, your way</p>
          <Link to="/auth">
            <Button variant="link" className="text-sm md:text-base">Join Now</Button>
          </Link>
        </div>
      </footer>
    </div>;
};
export default Landing;