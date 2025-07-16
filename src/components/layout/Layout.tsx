import { ReactNode } from "react";
import { DesktopNavigation, MobileNavigation } from "./Navigation";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? <MobileNavigation /> : <DesktopNavigation />}
      
      <main className={`
        ${isMobile ? 'pb-16' : ''} 
        min-h-screen
      `}>
        {children}
      </main>
    </div>
  );
}