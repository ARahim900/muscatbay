
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
  Thermometer,
  Search,
  Bell,
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

interface NavItem {
  title: string
  icon: React.ReactNode
  section: string
  children?: NavItem[]
}

export default function MusbatBayDashboard() {
  const [activeSection, setActiveSection] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>(["utilities"])
  const isDesktop = useMediaQuery("(min-width: 1024px)")

  const navItems: NavItem[] = [
    {
      title: "Overview",
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
      title: "HVAC/BMS",
      icon: <Thermometer className="h-5 w-5" />,
      section: "hvac",
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
        <div
          className={cn(
            "flex items-center justify-between p-2 rounded-md cursor-pointer",
            isActive
              ? "bg-white/10 text-white"
              : "text-gray-300 hover:bg-white/10 hover:text-white"
          )}
          onClick={() => (hasChildren ? toggleExpandItem(item.section) : handleNavigation(item.section))}
        >
          <div className="flex items-center">
            {item.icon}
            <span className={`ml-2 ${isActive ? "font-medium" : ""}`}>{item.title}</span>
          </div>
          {hasChildren &&
            (isExpanded(item.section) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
        </div>

        {hasChildren && isExpanded(item.section) && (
          <div className="pl-8 space-y-1">
            {item.children?.map((child) => (
              <div
                key={child.section}
                className={cn(
                  "flex items-center p-2 rounded-md cursor-pointer",
                  activeSection === child.section
                    ? "bg-white/10 text-white"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                )}
                onClick={() => handleNavigation(child.section)}
              >
                {child.icon}
                <span className="ml-2">{child.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Main Header */}
      <header className="bg-white border-b h-16 flex items-center justify-between px-4 z-20">
        <div className="flex items-center">
          <div className="lg:hidden mr-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-purple-600"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="font-medium text-purple-800">AU</span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium">Admin User</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-30 w-64 bg-[#4E4456] transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:h-auto",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            "top-16", // Position below header
          )}
        >
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-[#635870]">
              <h1 className="text-xl font-bold text-white">Muscat Bay</h1>
              <p className="text-sm text-gray-300">Assets and Operation</p>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map(renderNavItem)}
            </nav>
            <div className="p-4 border-t border-[#635870]">
              <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10">
                <Settings className="h-5 w-5 mr-2" />
                Help & Support
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {activeSection === "overview" && <DashboardOverview />}
          {activeSection === "water" && <WaterSystemSection fullView={true} />}
          {activeSection === "electricity" && <ElectricitySystem fullView={true} />}
          {activeSection === "pumping" && <PumpingStations />}
          {activeSection === "stp" && <STPPlant />}
          {activeSection === "contractor" && <ContractorTracker />}
          {activeSection === "residents" && <PlaceholderSection title="Residents Management" />}
          {activeSection === "settings" && <PlaceholderSection title="System Settings" />}
          {activeSection === "hvac" && <PlaceholderSection title="HVAC & Building Management System" />}
        </div>
      </div>
    </div>
  )
}
