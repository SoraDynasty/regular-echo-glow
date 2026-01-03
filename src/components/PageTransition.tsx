import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    // Reset animation state on route change
    setIsVisible(false);
    
    // Small delay to ensure CSS transition triggers
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsVisible(true);
    }, 20);

    return () => clearTimeout(timer);
  }, [location.pathname, children]);

  return (
    <div
      className={`min-h-screen transition-all duration-250 ease-out ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-1"
      }`}
    >
      {displayChildren}
    </div>
  );
};

export default PageTransition;