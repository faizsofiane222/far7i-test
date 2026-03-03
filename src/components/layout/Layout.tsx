import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { GlobalHeader } from "./GlobalHeader";
import { GlobalFooter } from "./GlobalFooter";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { ScrollToTopOnRouteChange } from "./ScrollToTopOnRouteChange";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) {
    return (
      <div className="min-h-screen bg-[#F8F5F0]">
        {children}
      </div>
    );
  }

  const isDashboard = pathname.startsWith("/partner/dashboard");

  if (isDashboard) {
    return (
      <div className="min-h-screen bg-[#F8F5F0]">
        <ScrollToTopOnRouteChange />
        <DashboardLayout>{children}</DashboardLayout>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans antialiased flex flex-col">
      <ScrollToTopOnRouteChange />
      <GlobalHeader />
      <main className="flex-grow">{children}</main>
      <GlobalFooter />
      <ScrollToTop />
    </div>
  );
}
