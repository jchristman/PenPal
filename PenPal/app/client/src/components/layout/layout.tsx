import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import PenPal, { Components, Hooks, registerComponent } from "@penpal/core";

const { useAccount } = Hooks;

interface RouteItem {
  path?: string;
  componentName?: string;
  prettyName?: string;
  icon?: React.ComponentType<any>;
  hideFromNav?: boolean;
  divider?: boolean;
  className?: string;
}

interface LayoutProps {
  routes?: RouteItem[];
}

const Layout: React.FC<LayoutProps> = ({ routes = [] }) => {
  const { user } = useAccount();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Handle sidebar state changes
  const handleSidebarStateChange = (isOpen: boolean): void => {
    setIsSidebarOpen(isOpen);
  };

  // Convert routes to navItems format for the sidebar
  const navItems = routes
    .filter((route) => !route.hideFromNav) // Filter out routes that shouldn't show in nav
    .map((route) => {
      if (route.divider) {
        return { divider: true, className: route.className };
      }

      return {
        title: route.prettyName,
        href: route.path,
        icon: route.icon ? React.createElement(route.icon, { className: "size-6 text-black-500" }) : null,
      };
    });

  return (
    <div className="flex h-screen bg-gray-100">
      <Components.Sidebar
        navItems={navItems}
        userEmail="test@test.com"
        userName="test@test.com"
        onSidebarStateChange={handleSidebarStateChange}
      />

      <div
        className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        <header className="flex h-16 items-center justify-between border-b bg-white px-6">
          <div className="flex items-center">
            <Components.Button
              variant="ghost"
              size="icon"
              className="mr-4 lg:hidden"
            >
              <span className="h-6 w-6">☰</span>
            </Components.Button>
            <h1 className="text-xl font-semibold mb-0!">PenPal Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Components.ConnectionStatusChip />
            {PenPal.Badges.map((badge: any, index: number) => {
              const BadgeComponent = badge.component;
              return <BadgeComponent key={index} />;
            })}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-100 p-6">
          <Routes>
            {routes.map((route) => {
              if (route.divider) return null;
              const Component = Components[route.componentName as string];
              return (
                <Route
                  key={route.path}
                  path={route.path}
                  element={<Component />}
                />
              );
            })}
          </Routes>
          <Components.Toaster />
        </main>
      </div>
    </div>
  );
};

export default Layout;
registerComponent("Layout", Layout);
