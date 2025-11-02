const LoadingAnimation = () => {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="relative w-16 h-16">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping"></div>
        {/* Middle ring */}
        <div className="absolute inset-2 rounded-full border-4 border-primary/40 animate-pulse"></div>
        {/* Inner core */}
        <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary to-primary-glow animate-pulse"></div>
      </div>
    </div>
  );
};

export default LoadingAnimation;
