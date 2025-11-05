import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Eye, Users, MessageCircle, Camera, Sparkles, Zap } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const Landing = () => {
  return <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden safe-area-top" style={{
      backgroundImage: `linear-gradient(rgba(10, 10, 15, 0.9), rgba(10, 10, 15, 0.85)), url(${heroBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background" />
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Authentic moments. No filters.</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-marker mb-6 text-glow-regulus tracking-wider animate-scale-in">
            Regulargram
          </h1>
          
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Be real. Stay silent. Or shine as Regulus.
          </p>
          
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-12 px-4 animate-fade-in leading-relaxed" style={{ animationDelay: '0.3s' }}>
            Capture authentic moments when the "Now" notification hits. 
            Choose your presence: visible as Regulus or invisible in GhostMode.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Link to="/auth" className="w-full sm:w-auto">
              <Button size="lg" variant="regulus" className="w-full text-lg px-8 py-7 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 group">
                <Zap className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                Get Started Free
              </Button>
            </Link>
            
            <Link to="/auth" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full text-lg px-8 py-7 rounded-2xl font-semibold border-2 hover:bg-background/5 transition-all hover:scale-105">
                <Camera className="w-5 h-5 mr-2" />
                Learn More
              </Button>
            </Link>
          </div>
          
          <div className="mt-16 flex items-center justify-center gap-8 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>Join thousands</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-secondary" />
              <span>Stay anonymous</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-accent" />
              <span>Daily moments</span>
            </div>
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
      <section className="py-20 md:py-32 px-4 md:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
        
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple, authentic, and built for real moments
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 md:gap-10">
            <div className="glass-card rounded-2xl p-8 transition-all hover:scale-105 hover:glow-regulus group">
              <div className="w-20 h-20 rounded-2xl gradient-regulus flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all">
                <Camera className="w-10 h-10 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-center">Capture the Moment</h3>
              <p className="text-base text-muted-foreground text-center leading-relaxed">
                When the "Now" notification hits, capture a photo or 5-10 second video of what you're doing. Real life, no staging.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-8 transition-all hover:scale-105 hover:glow-ghost group">
              <div className="w-20 h-20 rounded-2xl bg-destructive/20 flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all">
                <Sparkles className="w-10 h-10 text-destructive" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-center">No Filters, No Edits</h3>
              <p className="text-base text-muted-foreground text-center leading-relaxed">
                Post once per day. No retakes, no filters, no pressure — just beautiful, minimal authenticity.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-8 transition-all hover:scale-105 hover:glow-regulus group">
              <div className="w-20 h-20 rounded-2xl gradient-ghost flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all">
                <MessageCircle className="w-10 h-10 text-secondary-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-center">Connect & React</h3>
              <p className="text-base text-muted-foreground text-center leading-relaxed">
                React with 👀, 💬, ❤️, or 🔥. Echo users can even comment anonymously. Your way, your rules.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="py-20 px-4 md:px-6 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to be real?</h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join Regulargram today and experience social media the way it should be — authentic, unfiltered, and uniquely yours.
          </p>
          
          <Link to="/auth">
            <Button size="lg" variant="regulus" className="text-lg px-10 py-7 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 group">
              <Zap className="w-5 h-5 mr-2 group-hover:animate-pulse" />
              Start Your Journey
            </Button>
          </Link>
          
          <p className="mt-8 text-sm text-muted-foreground">
            Regulargram — Authentic moments, your way
          </p>
        </div>
      </footer>
    </div>;
};
export default Landing;