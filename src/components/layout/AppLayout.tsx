import { DashboardHeader } from "./DashboardHeader";
import { DashboardSidebar } from "./DashboardSidebar";

type AppLayoutProps = {
  children: React.ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="zunary-app">
      <DashboardSidebar />

      <div className="zunary-main">
        <DashboardHeader />

        <main className="zunary-content">{children}</main>
      </div>
    </div>
  );
}