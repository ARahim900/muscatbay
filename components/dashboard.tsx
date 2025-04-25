"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Droplet,
  Zap,
  Building2,
  Users,
  ShieldAlert,
  Settings,
  Menu,
  Recycle,
  ClipboardList,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { DashboardOverview } from "./sections/dashboard-overview"
import { PumpingStations } from "./sections/pumping-stations"
import { PlaceholderSection } from "./sections/placeholder-section"
import { ElectricitySystem } from "./sections/electricity-system"
import WaterSystemSection from "./sections/water-system"
import { STPPlant } from "./sections/stp-plant"
import { ContractorTracker } from "./sections/contractor-tracker"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"
import { MainHeader } from "./main-header"

interface NavItem {
  title: string
  icon: React.ReactNode
  section: string
  children?: NavItem[]
}

export default function MusbatBayDashboard() {
  const [activeSection, setActiveSection] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const isDesktop = useMediaQuery("(min-width: 1024px)")

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      section: "overview",
    },
    {
      title: "Utilities",
      icon: <ShieldAlert className="h-5 w-5" />,
      section: "utilities",
      children: [
        {
          title: "Water System",
          icon: <Droplet className="h-5 w-5" />,
          section: "water",
        },
        {
          title: "Electricity",
          icon: <Zap className="h-5 w-5" />,
          section: "electricity",
        },
      ],
    },
    {
      title: "Pumping Stations",
      icon: <Building2 className="h-5 w-5" />,
      section: "pumping",
    },
    {
      title: "STP Plant",
      icon: <Recycle className="h-5 w-5" />,
      section: "stp",
    },
    {
      title: "Contractor Tracker",
      icon: <ClipboardList className="h-5 w-5" />,
      section: "contractor",
    },
    {
      title: "Residents",
      icon: <Users className="h-5 w-5" />,
      section: "residents",
    },
    {
      title: "Settings",
      icon: <Settings className="h-5 w-5" />,
      section: "settings",
    },
  ]

  const handleNavigation = (section: string) => {
    setActiveSection(section)
    if (!isDesktop) {
      setSidebarOpen(false)
    }
  }

  const toggleExpandItem = (section: string) => {
    setExpandedItems((prev) => (prev.includes(section) ? prev.filter((item) => item !== section) : [...prev, section]))
  }

  const isExpanded = (section: string) => expandedItems.includes(section)

  const renderNavItem = (item: NavItem) => {
    const hasChildren = item.children && item.children.length > 0
    const isActive =
      activeSection === item.section || (hasChildren && item.children?.some((child) => activeSection === child.section))

    return (
      <div key={item.title} className="space-y-1">
        <Button
          variant={isActive ? "default" : "ghost"}
          className={cn("w-full justify-between", hasChildren && "mb-1")}
          onClick={() => (hasChildren ? toggleExpandItem(item.section) : handleNavigation(item.section))}
        >
          <span className="flex items-center">
            {item.icon}
            <span className="ml-2">{item.title}</span>
          </span>
          {hasChildren &&
            (isExpanded(item.section) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
        </Button>

        {hasChildren && isExpanded(item.section) && (
          <div className="pl-8 space-y-1">
            {item.children?.map((child) => (
              <Button
                key={child.section}
                variant={activeSection === child.section ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => handleNavigation(child.section)}
              >
                {child.icon}
                <span className="ml-2">{child.title}</span>
              </Button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Set page title based on active section
  const getPageTitle = () => {
    const activeItem =
      navItems.find((item) => item.section === activeSection) ||
      navItems.flatMap((item) => item.children || []).find((item) => item.section === activeSection)

    return activeItem?.title || "Dashboard"
  }

  // Get icon for header based on active section
  const getHeaderIcon = () => {
    const activeItem =
      navItems.find((item) => item.section === activeSection) ||
      navItems.flatMap((item) => item.children || []).find((item) => item.section === activeSection)

    return activeItem?.icon || <LayoutDashboard className="h-6 w-6 mr-2 text-[#9AD0D2]" />
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Main Header */}
      <MainHeader
        title={`Muscat Bay Operations - ${getPageTitle()}`}
        icon={getHeaderIcon()}
        showControls={activeSection === "water" || activeSection === "electricity"}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar toggle */}
        <div className="lg:hidden fixed top-20 left-4 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Sidebar */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-30 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:h-auto",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            "top-16", // Position below header
          )}
        >
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <h1 className="text-xl font-bold">Navigation</h1>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">{navItems.map(renderNavItem)}</nav>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {activeSection === "overview" && <DashboardOverview />}
          {activeSection === "water" && <WaterSystemSection fullView={true} />}
          {activeSection === "electricity" && <ElectricitySystem fullView={true} />}
          {activeSection === "pumping" && <PumpingStations />}
          {activeSection === "stp" && <STPPlant />}
          {activeSection === "contractor" && <ContractorTracker />}
          {activeSection === "residents" && <PlaceholderSection title="Residents Management" />}
          {activeSection === "settings" && <PlaceholderSection title="System Settings" />}
        </div>
      </div>
    </div>
  )
}
