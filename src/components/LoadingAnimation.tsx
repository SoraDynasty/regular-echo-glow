interface LoadingAnimationProps {
  isLoading?: boolean;
  size?: "sm" | "md" | "lg";
}

const LoadingAnimation = ({ isLoading = true, size = "md" }: LoadingAnimationProps) => {
  const sizeClasses = {
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-3",
    lg: "w-14 h-14 border-4"
  };

  return (
    <div 
      className={`flex items-center justify-center min-h-[100px] transition-opacity duration-300 ${
        isLoading ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div 
        className={`${sizeClasses[size]} rounded-full border-primary border-t-transparent animate-spin`}
      />
    </div>
  );
};

export default LoadingAnimation;
