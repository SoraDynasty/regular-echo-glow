import { ReactNode, useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: ReactNode;
}

const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [displayChildren, setDisplayChildren] = useState(children);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Fade out
    setIsVisible(false);
    
    // After fade out, swap content and fade in
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsVisible(true);
    }, 150);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Update children when they change (but not on route change - that's handled above)
  useEffect(() => {
    if (isFirstRender.current) return;
    setDisplayChildren(children);
  }, [children]);

  return (
    <div
      className={`min-h-screen transition-all duration-200 ease-out ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2"
      }`}
      style={{ willChange: "opacity, transform" }}
    >
      {displayChildren}
    </div>
  );
};

export default PageTransition;