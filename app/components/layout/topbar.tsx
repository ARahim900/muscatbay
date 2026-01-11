"use client";

import { useSidebar } from "./sidebar-context";
import { Menu, Search, Bell } from "lucide-react";

export function Topbar() {
    const { isCollapsed, setIsCollapsed } = useSidebar();

    return (
        <div className="h-16 border-b bg-white px-4 flex items-center justify-between sticky top-0 z-10 transition-all duration-300">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 hover:bg-gray-100 rounded-lg md:hidden"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <h1 className="text-xl font-semibold text-[var(--mb-primary)] hidden md:block">
                    Dashboard
                </h1>
            </div>

            <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-gray-100 rounded-full">
                    <Search className="w-5 h-5 text-gray-500" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full relative">
                    <Bell className="w-5 h-5 text-gray-500" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <div className="w-8 h-8 bg-[var(--mb-primary)] rounded-full flex items-center justify-center text-white text-sm font-medium">
                    U
                </div>
            </div>
        </div>
    );
}
