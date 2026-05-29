import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSidebar } from "./DashboardSidebar";
import { SubscriptionBanner } from "./SubscriptionBanner";

type AppLayoutProps = {
  children: React.ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function openMobileMenu() {
    setMobileMenuOpen(true);
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add("zunary-menu-open");
    } else {
      document.body.classList.remove("zunary-menu-open");
    }

    return () => {
      document.body.classList.remove("zunary-menu-open");
    };
  }, [mobileMenuOpen]);

  return (
    <div className="zunary-app">
      <DashboardSidebar
        isMobileOpen={mobileMenuOpen}
        onClose={closeMobileMenu}
      />

      {mobileMenuOpen && (
        <button
          className="zunary-sidebar-overlay"
          type="button"
          onClick={closeMobileMenu}
          aria-label="Fechar menu"
        />
      )}

      <div className="zunary-main">
        <DashboardHeader onOpenMenu={openMobileMenu} />

        <main className="zunary-content">
          <SubscriptionBanner />
          {children}
        </main>
      </div>
    </div>
  );
}