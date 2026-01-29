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
  const prevPathname = useRef(location.pathname);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Only animate on actual route changes
    if (prevPathname.current === location.pathname) {
      setDisplayChildren(children);
      return;
    }

    prevPathname.current = location.pathname;

    // Fade out quickly
    setIsVisible(false);
    
    // After fade out, swap content and fade in
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      // Small delay before fade in for smoother feel
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname, children]);

  // Update children when they change (but not on route change - that's handled above)
  useEffect(() => {
    if (isFirstRender.current) return;
    if (prevPathname.current === location.pathname) {
      setDisplayChildren(children);
    }
  }, [children, location.pathname]);

  return (
    <div
      className={`min-h-screen transition-opacity duration-150 ease-out ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      style={{ willChange: "opacity" }}
    >
      {displayChildren}
    </div>
  );
};

export default PageTransition;