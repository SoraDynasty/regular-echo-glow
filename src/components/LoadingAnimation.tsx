import regulagramLogo from "@/assets/regulargram-logo.png";

interface LoadingAnimationProps {
  isLoading?: boolean;
}

const LoadingAnimation = ({ isLoading = true }: LoadingAnimationProps) => {
  return (
    <div 
      className={`flex items-center justify-center min-h-[200px] transition-opacity duration-500 ${
        isLoading ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="relative w-32 h-32">
        {/* Rotating arc loader */}
        <svg 
          className="absolute inset-0 w-full h-full animate-spin-slow"
          viewBox="0 0 100 100"
        >
          <defs>
            <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3DF09E" stopOpacity="1" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="1" />
            </linearGradient>
            <filter id="arcGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="url(#arcGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="100 190"
            filter="url(#arcGlow)"
          />
        </svg>
        
        {/* Logo container with glow */}
        <div className="absolute inset-3 flex items-center justify-center">
          <div className="relative">
            {/* Glow effect behind logo */}
            <div 
              className="absolute inset-0 blur-lg opacity-50"
              style={{
                background: 'radial-gradient(circle, rgba(61, 240, 158, 0.4) 0%, rgba(139, 92, 246, 0.3) 50%, transparent 70%)'
              }}
            />
            {/* Logo */}
            <img 
              src={regulagramLogo} 
              alt="Regulargram" 
              className="relative w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(61,240,158,0.5)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;
