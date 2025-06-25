import { registerComponent } from "../../penpal/client";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Hooks } from "../../penpal/client";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleUserIcon,
  LogOutIcon,
  SettingsIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { cn } from "./utils";
import * as React from "react";

const { useAccount } = Hooks;

export interface SidebarNavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  className?: string;
  divider?: boolean;
  disabled?: boolean;
  tooltip?: string;
}

interface SidebarProps {
  navItems: SidebarNavItem[];
  userName?: string | null;
  userEmail?: string | null;
  onSidebarStateChange?: (isOpen: boolean) => void;
}

export function Sidebar({
  navItems,
  userName,
  userEmail,
  onSidebarStateChange,
}: SidebarProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const { logout } = useAccount();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Notify parent of sidebar state changes
  useEffect(() => {
    onSidebarStateChange?.(isSidebarOpen);
  }, [isSidebarOpen, onSidebarStateChange]);

  return (
    <aside
      className={`bg-white shadow-md ${
        isSidebarOpen ? "w-64" : "w-20"
      } fixed bottom-0 left-0 top-0 z-30 transition-all duration-300`}
    >
      {/* Toggle button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute -right-3 top-1/2 z-50 flex h-6 w-6 -translate-y-1/2 transform items-center justify-center rounded-full bg-white text-gray-500 shadow-md transition-all hover:text-gray-800"
        aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isSidebarOpen ? (
          <ChevronLeftIcon className="h-4 w-4" />
        ) : (
          <ChevronRightIcon className="h-4 w-4" />
        )}
      </button>

      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-[64px] items-center justify-center border-b p-4">
          <div className="flex items-center justify-center">
            <img
              src="/logo.png"
              alt="PenPal Logo"
              width={isSidebarOpen ? 32 : 24}
              height={isSidebarOpen ? 32 : 24}
              className="object-contain"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {navItems.map((item, index) => {
              // Use exact matching for all nav links to avoid highlighting when it's just a substring
              const isActive = pathname === item.href;

              // Special handling for divider items
              if (item.divider) {
                return (
                  <div
                    key={`divider-${index}`}
                    className={item.className ?? "my-2 h-px bg-gray-200"}
                  />
                );
              }

              return (
                <TooltipProvider key={index} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {item.disabled ? (
                        // Render a non-interactive span for disabled items
                        <span
                          className={cn(
                            `flex items-center ${
                              isSidebarOpen ? "" : "justify-center"
                            } rounded-md p-2`,
                            "cursor-not-allowed text-gray-400",
                            item.className ?? ""
                          )}
                          aria-disabled="true"
                        >
                          <span className={isSidebarOpen ? "mr-3" : ""}>
                            {item.icon}
                          </span>
                          {isSidebarOpen && <span>{item.title}</span>}
                        </span>
                      ) : (
                        // Render the Link for enabled items
                        <Link
                          to={item.href}
                          className={cn(
                            `flex items-center ${
                              isSidebarOpen ? "" : "justify-center"
                            } rounded-md p-2 transition-colors`,
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-gray-700 hover:bg-gray-100",
                            item.className ?? ""
                          )}
                        >
                          <span className={isSidebarOpen ? "mr-3" : ""}>
                            {item.icon}
                          </span>
                          {isSidebarOpen && <span>{item.title}</span>}
                        </Link>
                      )}
                    </TooltipTrigger>
                    {item.tooltip ? (
                      <TooltipContent
                        side="right"
                        align="center"
                        className="flex items-center"
                      >
                        <p className="mb-0">{item.tooltip ?? item.title}</p>
                      </TooltipContent>
                    ) : null}
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </nav>

        {/* User info */}
        {(userName ?? userEmail) && (
          <div className="border-t p-4">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`flex items-center ${
                isSidebarOpen ? "" : "justify-center"
              } w-full rounded-md p-2 text-left hover:bg-gray-100`}
            >
              <CircleUserIcon
                className={`h-5 w-5 ${isSidebarOpen ? "mr-3" : ""}`}
              />
              <div
                className={`flex-1 overflow-hidden ${
                  isSidebarOpen ? "block" : "hidden"
                }`}
              >
                <p className="truncate text-sm font-medium">
                  {userName ?? "User"}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {userEmail ?? ""}
                </p>
              </div>
              <ChevronDownIcon
                className={`h-4 w-4 transform transition-transform duration-200 ${
                  showUserMenu ? "" : "rotate-180"
                } ${isSidebarOpen ? "block" : "hidden"}`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                showUserMenu && isSidebarOpen
                  ? "mt-2 max-h-20 opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="space-y-1 px-2">
                <Link
                  to="/dashboard/settings"
                  className="flex items-center rounded-md p-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <SettingsIcon className="mr-3 h-4 w-4" />
                  Settings
                </Link>
                <button
                  onClick={() => logout()}
                  className="flex w-full items-center rounded-md p-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOutIcon className="mr-3 h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

registerComponent("Sidebar", Sidebar);

// This is only needed for the fast refresh plugin, the registerComponent above is needed for the plugin system
export default Sidebar;
