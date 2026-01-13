import { createContext, useContext, useState, ReactNode } from "react";

type EllieContextType = {
  isEllieOpen: boolean;
  setIsEllieOpen: (open: boolean) => void;
};

const EllieContext = createContext<EllieContextType | undefined>(undefined);

export const EllieProvider = ({ children }: { children: ReactNode }) => {
  const [isEllieOpen, setIsEllieOpen] = useState(false);

  return (
    <EllieContext.Provider value={{ isEllieOpen, setIsEllieOpen }}>
      {children}
    </EllieContext.Provider>
  );
};

export const useEllie = () => {
  const context = useContext(EllieContext);
  if (!context) {
    throw new Error("useEllie must be used within an EllieProvider");
  }
  return context;
};
