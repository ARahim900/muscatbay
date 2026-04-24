"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    Droplets,
    Zap,
    Waves,
    Users,
    Package,
    Flame,
    ArrowRight,
} from "lucide-react";

interface FeatureLink {
    label: string;
    description: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
}

const features: FeatureLink[] = [
    { label: "Water", description: "Monitor production and consumption", href: "/water", icon: Droplets, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Electricity", description: "Track meter readings and costs", href: "/electricity", icon: Zap, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-50 dark:bg-amber-900/20" },
    { label: "STP Plant", description: "Sewage treatment operations", href: "/stp", icon: Waves, color: "text-teal-600 dark:text-teal-400", bgColor: "bg-teal-50 dark:bg-teal-900/20" },
    { label: "Contractors", description: "Manage service providers", href: "/contractors", icon: Users, color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-50 dark:bg-purple-900/20" },
    { label: "Assets", description: "Track equipment and inventory", href: "/assets", icon: Package, color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-50 dark:bg-emerald-900/20" },
    { label: "Fire Safety", description: "PPM and equipment status", href: "/firefighting", icon: Flame, color: "text-red-600 dark:text-red-400", bgColor: "bg-red-50 dark:bg-red-900/20" },
];

interface WelcomeCardProps {
    userName?: string;
    className?: string;
}

export function WelcomeCard({ userName, className }: WelcomeCardProps) {
    const greeting = userName ? `Welcome, ${userName}` : "Welcome to Muscat Bay";

    return (
        <div className={cn("rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6", className)}>
            <div className="space-y-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">
                    {greeting}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg">
                    Your operations dashboard is ready. Explore the modules below to start monitoring utilities, managing assets, and tracking contractors.
                </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {features.map((feature) => {
                    const Icon = feature.icon;
                    return (
                        <Link
                            key={feature.href}
                            href={feature.href}
                            className="group flex flex-col gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm transition-[border-color,box-shadow] duration-200"
                        >
                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", feature.bgColor)}>
                                <Icon className={cn("w-5 h-5", feature.color)} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                                    {feature.label}
                                    <ArrowRight className="w-3 h-3 opacity-40 group-hover:opacity-100 motion-safe:-translate-x-1 motion-safe:group-hover:translate-x-0 transition-[transform,opacity] duration-200" />
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">
                                    {feature.description}
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
