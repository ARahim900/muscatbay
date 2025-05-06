"use client"

import type React from "react"

import { useState } from "react"
import {
  LayoutDashboard,
  Droplet,
  Zap,
  Settings,
  Factory,
  ThermometerSun,
  Bug,
  Building,
  Users,
  Recycle,
  Menu,
  Activity,
  ChevronRight,
  Bell,
  Sun,
  Moon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DashboardOverview } from "@/components/sections/dashboard-overview"
import { ElectricitySystem } from "@/components/sections/electricity-system"
import { PumpingStations } from "@/components/sections/pumping-stations"
import { PlaceholderSection } from "@/components/sections/placeholder-section"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

// Navigation Structure
const navigationItems = [
  {
    section: "Dashboard",
    icon: LayoutDashboard,
    href: "#dashboard",
    component: () => <DashboardOverview />,
  },
  {
    section: "Utilities",
    icon: Settings,
    subsections: [
      { name: "Water System", icon: Droplet, href: "/water-system", isExternalPage: true },
      { name: "Electricity System", icon: Zap, href: "#electricity", component: () => <ElectricitySystem /> },
    ],
  },
  {
    section: "Operations",
    icon: Factory,
    subsections: [
      { name: "STP Plant", icon: Recycle, href: "#stp", component: () => <PlaceholderSection title="STP Plant" /> },
      { name: "PS/LS", icon: Activity, href: "#psls", component: () => <PumpingStations /> },
      {
        name: "HVAC/BMS",
        icon: ThermometerSun,
        href: "#hvac",
        component: () => <PlaceholderSection title="HVAC/BMS" />,
      },
      { name: "Pest Control", icon: Bug, href: "#pest", component: () => <PlaceholderSection title="Pest Control" /> },
      {
        name: "FM",
        icon: Building,
        href: "#fm",
        component: () => <PlaceholderSection title="Facility Management (FM)" />,
      },
    ],
  },
  {
    section: "Management",
    icon: Users,
    subsections: [
      {
        name: "Contractor Management",
        icon: Users,
        href: "#contractors",
        component: () => <PlaceholderSection title="Contractor Management" />,
      },
      {
        name: "ALM",
        icon: Recycle,
        href: "#alm",
        component: () => <PlaceholderSection title="ALM Kochmeal Assets Lifecycle" />,
      },
    ],
  },
]

export function MusbatBayDashboard() {
  // State to manage which component/section is currently active
  const [ActiveComponent, setActiveComponent] = useState(() => navigationItems[0].component) // Default view is Dashboard
  // State to manage the visibility of the mobile sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  // Get current theme
  const { theme, setTheme } = useTheme()

  // Handle navigation clicks
  const handleNavClick = (component: React.FC<any> | undefined, href: string, isExternalPage = false) => {
    if (isExternalPage) {
      // External page navigation is handled by Next.js Link component
      return
    }

    if (component) {
      setActiveComponent(() => component)
      setIsSidebarOpen(false)
    }
  }

  // Get current section name
  const getCurrentSectionName = () => {
    for (const item of navigationItems) {
      if (item.component === ActiveComponent) {
        return item.section
      }
      if (item.subsections) {
        for (const subItem of item.subsections) {
          if (subItem.component === ActiveComponent) {
            return subItem.name
          }
        }
      }
    }
    return "Dashboard"
  }

  // Sidebar navigation content
  const SidebarContent = () => (
    <nav className="flex flex-col space-y-1 px-2">
      {navigationItems.map((item) => (
        <div key={item.section} className="animate-fade-in-up">
          {item.subsections ? (
            <>
              <h3 className="px-3 pt-4 pb-1 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 tracking-wider">
                {item.section}
              </h3>
              {item.subsections.map((subItem) =>
                subItem.isExternalPage ? (
                  <Link href={subItem.href} key={subItem.name}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start items-center text-sm font-medium rounded-md px-3 py-2 transition-all duration-200",
                        "text-gray-700 dark:text-gray-300",
                        "hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-purple-50/80 dark:hover:from-blue-950/30 dark:hover:to-purple-950/30 hover:text-gray-900 dark:hover:text-white",
                      )}
                    >
                      <subItem.icon className="mr-3 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                      {subItem.name}
                      <ChevronRight className="ml-auto h-4 w-4 text-blue-500 dark:text-blue-400" />
                    </Button>
                  </Link>
                ) : (
                  <Button
                    key={subItem.name}
                    variant="ghost"
                    aria-current={ActiveComponent === subItem.component ? "page" : undefined}
                    className={cn(
                      "w-full justify-start items-center text-sm font-medium rounded-md px-3 py-2 transition-all duration-200",
                      "text-gray-700 dark:text-gray-300",
                      "hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-purple-50/80 dark:hover:from-blue-950/30 dark:hover:to-purple-950/30 hover:text-gray-900 dark:hover:text-white",
                      ActiveComponent === subItem.component
                        ? "bg-gradient-to-r from-blue-100/90 to-purple-100/90 dark:from-blue-900/30 dark:to-purple-900/30 text-gray-900 dark:text-white font-semibold shadow-inner"
                        : "",
                    )}
                    onClick={() => handleNavClick(subItem.component, subItem.href)}
                  >
                    <subItem.icon className="mr-3 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    {subItem.name}
                    {ActiveComponent === subItem.component && (
                      <ChevronRight className="ml-auto h-4 w-4 text-blue-500 dark:text-blue-400" />
                    )}
                  </Button>
                ),
              )}
            </>
          ) : (
            <Button
              key={item.section}
              variant="ghost"
              aria-current={ActiveComponent === item.component ? "page" : undefined}
              className={cn(
                "w-full justify-start items-center text-sm font-medium rounded-md px-3 py-2 mt-2 transition-all duration-200",
                "text-gray-700 dark:text-gray-300",
                "hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-purple-50/80 dark:hover:from-blue-950/30 dark:hover:to-purple-950/30 hover:text-gray-900 dark:hover:text-white",
                ActiveComponent === item.component
                  ? "bg-gradient-to-r from-blue-100/90 to-purple-100/90 dark:from-blue-900/30 dark:to-purple-900/30 text-gray-900 dark:text-white font-semibold shadow-inner"
                  : "",
              )}
              onClick={() => handleNavClick(item.component, item.href)}
            >
              <item.icon className="mr-3 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              {item.section}
              {ActiveComponent === item.component && (
                <ChevronRight className="ml-auto h-4 w-4 text-blue-500 dark:text-blue-400" />
              )}
            </Button>
          )}
        </div>
      ))}
    </nav>
  )

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-gray-100 font-sans antialiased">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 border-r border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-sm pt-4 transition-all duration-300">
        <div className="mb-4 px-4 h-12 flex items-center">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-500">
            Muscat Bay Ops
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto pb-4">
          <SidebarContent />
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                <AvatarFallback>MB</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Operations Manager</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="md:hidden fixed top-4 left-4 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-md rounded-full border border-gray-200 dark:border-gray-800"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-64 p-0 pt-4 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col"
        >
          <div className="mb-4 px-4 h-12 flex items-center justify-between border-b dark:border-gray-800 pb-4">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-500">
              Muscat Bay Ops
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto pb-4">
            <SidebarContent />
          </div>
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                <AvatarFallback>MB</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Operations Manager</p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header for All Devices */}
        <header className="sticky top-0 z-10 h-16 flex items-center justify-between px-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 transition-all duration-300">
          <div className="flex items-center">
            <span className="text-lg font-semibold md:ml-0 ml-8">{getCurrentSectionName()}</span>
            <Badge variant="outline" className="ml-3 hidden sm:inline-flex">
              v1.2.0
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full relative">
                    <Bell className="h-4 w-4" />
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                    <span className="sr-only">Notifications</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>3 new notifications</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full md:flex hidden">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                    <AvatarFallback>MB</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Help</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full md:hidden"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        {/* Main content rendering area */}
        <main className="flex-1 overflow-y-auto">
          <ActiveComponent />
        </main>

        {/* Footer */}
        <footer className="p-4 text-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 mt-auto shrink-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm transition-all duration-300">
          © {new Date().getFullYear()} Muscat Bay Operations Management. All rights reserved.
        </footer>
      </div>
    </div>
  )
}
