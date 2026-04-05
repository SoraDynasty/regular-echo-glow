import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Eye, Users, MessageCircle, Camera, Sparkles, Zap } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import kiteLogo from "@/assets/regulargram-kite.png";

const Landing = () => {
  return <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden safe-area-top px-4 py-12 md:py-0" style={{
      backgroundImage: `linear-gradient(rgba(10, 10, 15, 0.9), rgba(10, 10, 15, 0.85)), url(${heroBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: window.innerWidth > 768 ? 'fixed' : 'scroll'
    }}>
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background" />
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-48 h-48 md:w-96 md:h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 md:w-96 md:h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          {/* Kite Logo */}
          <div className="mb-6 md:mb-8 animate-fade-in">
            <img 
              src={kiteLogo} 
              alt="Regulargram Kite" 
              className="w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 mx-auto object-contain opacity-90"
            />
          </div>
          
          <h1 className="text-[2.5rem] leading-[1.1] sm:text-5xl md:text-6xl lg:text-7xl font-marker mb-4 md:mb-6 text-glow-regulus tracking-wider animate-scale-in px-2">
            Socialize without the Noise.
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold mb-3 md:mb-4 animate-fade-in px-4" style={{ animationDelay: '0.2s' }}>
            Powered by Ellie.
          </p>
          
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 md:mb-12 px-4 animate-fade-in leading-relaxed" style={{ animationDelay: '0.3s' }}>
            <span className="text-primary font-medium">GhostMode</span> — our signature tiered privacy system. 
            <span className="text-primary font-medium"> Agentic Curation</span> — Ellie replaces the follower-trap with what actually matters.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Link to="/auth" className="w-full sm:w-auto">
              <Button size="lg" variant="regulus" className="w-full min-h-[56px] text-base md:text-lg px-6 md:px-8 py-4 md:py-7 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 group">
                <Zap className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                Get Started
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 md:mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-xs md:text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>Let's ride</span>
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-muted-foreground/50" />
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-secondary" />
              <span>Stay anonymous</span>
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-muted-foreground/50" />
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-accent" />
              <span>Daily moments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Types Section */}
      <section className="py-12 md:py-16 lg:py-24 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12 lg:mb-16 px-4">Choose Your Presence</h2>
          
          <div className="grid md:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
            {/* Regulus Card */}
            <div className="glass-card rounded-xl md:rounded-2xl p-5 md:p-6 lg:p-8 glow-regulus transition-all hover:scale-[1.02] md:hover:scale-105">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full gradient-regulus flex items-center justify-center mb-4 md:mb-6">
                <Users className="w-7 h-7 md:w-8 md:h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 md:mb-3 text-glow-regulus">⚡️ Regulus</h3>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-4 md:mb-6 leading-relaxed">
                Visible accounts that shine bright. Share your authentic moments with the world 
                and be discovered by others.
              </p>
              <ul className="space-y-2 md:space-y-3 text-sm md:text-base text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Visible profile with posts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Share daily moments publicly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Appear on discovery feed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Full interaction capabilities</span>
                </li>
              </ul>
            </div>

            {/* GhostMode Card */}
            <div className="glass-card rounded-xl md:rounded-2xl p-5 md:p-6 lg:p-8 glow-ghost transition-all hover:scale-[1.02] md:hover:scale-105">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full gradient-ghost flex items-center justify-center mb-4 md:mb-6">
                <Eye className="w-7 h-7 md:w-8 md:h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 md:mb-3 text-glow-ghost">🌫️ GhostMode</h3>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-4 md:mb-6 leading-relaxed">
                Experience quietly without being followed. Three ghost identities let you 
                choose your level of interaction.
              </p>
              <ul className="space-y-2.5 md:space-y-3 lg:space-y-4 text-sm md:text-base text-muted-foreground">
                <li className="flex items-start gap-2 md:gap-3">
                  <span className="text-secondary text-base md:text-lg">👁️</span>
                  <div>
                    <strong className="text-foreground">Observer</strong> — Watch quietly, no interactions
                  </div>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <span className="text-secondary text-base md:text-lg">🌪️</span>
                  <div>
                    <strong className="text-foreground">Ghost</strong> — Invisible presence, can like & react
                  </div>
                </li>
                <li className="flex items-start gap-2 md:gap-3">
                  <span className="text-secondary text-base md:text-lg">🔊</span>
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
      <section className="py-12 md:py-20 lg:py-32 px-4 md:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
        
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-10 md:mb-16 lg:mb-20 px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">How It Works</h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple, authentic, and built for real moments
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-5 md:gap-6 lg:gap-10">
            <div className="glass-card rounded-xl md:rounded-2xl p-6 md:p-8 transition-all hover:scale-[1.02] md:hover:scale-105 hover:glow-regulus group">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl gradient-regulus flex items-center justify-center mx-auto mb-5 md:mb-6 shadow-lg group-hover:shadow-xl transition-all">
                <Camera className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 md:mb-3 text-center">Capture the Moment</h3>
              <p className="text-sm md:text-base text-muted-foreground text-center leading-relaxed">
                When the "Now" notification hits, capture a photo or 5-10 second video of what you're doing. Real life, no staging.
              </p>
            </div>

            <div className="glass-card rounded-xl md:rounded-2xl p-6 md:p-8 transition-all hover:scale-[1.02] md:hover:scale-105 hover:glow-ghost group">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-destructive/20 flex items-center justify-center mx-auto mb-5 md:mb-6 shadow-lg group-hover:shadow-xl transition-all">
                <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-destructive" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 md:mb-3 text-center">No Filters, No Edits</h3>
              <p className="text-sm md:text-base text-muted-foreground text-center leading-relaxed">
                Post once per day. No retakes, no filters, no pressure — just beautiful, minimal authenticity.
              </p>
            </div>

            <div className="glass-card rounded-xl md:rounded-2xl p-6 md:p-8 transition-all hover:scale-[1.02] md:hover:scale-105 hover:glow-regulus group">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl gradient-ghost flex items-center justify-center mx-auto mb-5 md:mb-6 shadow-lg group-hover:shadow-xl transition-all">
                <MessageCircle className="w-8 h-8 md:w-10 md:h-10 text-secondary-foreground" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 md:mb-3 text-center">Connect & React</h3>
              <p className="text-sm md:text-base text-muted-foreground text-center leading-relaxed">
                React with 👀, 💬, ❤️, or 🔥. Echo users can even comment anonymously. Your way, your rules.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="py-12 md:py-16 lg:py-20 px-4 md:px-6 border-t border-border relative overflow-hidden safe-area-bottom">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4 px-4">Ready to be real?</h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto px-4 leading-relaxed">
            Join Regulargram today and experience social media the way it should be — authentic, unfiltered, and uniquely yours.
          </p>
          
          <Link to="/auth" className="inline-block">
            <Button size="lg" variant="regulus" className="min-h-[56px] text-base md:text-lg px-8 md:px-10 py-4 md:py-7 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 group">
              <Zap className="w-5 h-5 mr-2 group-hover:animate-pulse" />
              Start Your Journey
            </Button>
          </Link>
          
          <p className="mt-6 md:mt-8 text-xs md:text-sm text-muted-foreground px-4">
            Regulargram — Authentic moments, your way
          </p>
        </div>
      </footer>
    </div>;
};
export default Landing;