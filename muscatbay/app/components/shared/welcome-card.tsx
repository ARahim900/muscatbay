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
    { label: "Water", description: "Monitor production and consumption", href: "/water", icon: Droplets, color: "text-module-water", bgColor: "bg-module-water/10" },
    { label: "Electricity", description: "Track meter readings and costs", href: "/electricity", icon: Zap, color: "text-module-electricity", bgColor: "bg-module-electricity/10" },
    { label: "STP Plant", description: "Sewage treatment operations", href: "/stp", icon: Waves, color: "text-module-stp", bgColor: "bg-module-stp/10" },
    { label: "Contractors", description: "Manage service providers", href: "/contractors", icon: Users, color: "text-module-contractors", bgColor: "bg-module-contractors/10" },
    { label: "Assets", description: "Track equipment and inventory", href: "/assets", icon: Package, color: "text-module-assets", bgColor: "bg-module-assets/10" },
    { label: "Fire Safety", description: "PPM and equipment status", href: "/firefighting", icon: Flame, color: "text-module-fire", bgColor: "bg-module-fire/10" },
];

interface WelcomeCardProps {
    userName?: string;
    className?: string;
}

export function WelcomeCard({ userName, className }: WelcomeCardProps) {
    const greeting = userName ? `Welcome, ${userName}` : "Welcome to Muscat Bay";

    return (
        <div className={cn("rounded-2xl border border-border dark:border-border bg-card p-6 sm:p-8 space-y-6", className)}>
            <div className="space-y-2">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">
                    {greeting}
                </h2>
                <p className="text-sm text-muted-foreground max-w-lg">
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
                            className="group flex flex-col gap-3 p-4 rounded-xl border border-border dark:border-border hover:border-border dark:hover:border-border hover:shadow-sm transition-[border-color,box-shadow] duration-200"
                        >
                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", feature.bgColor)}>
                                <Icon className={cn("w-5 h-5", feature.color)} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                                    {feature.label}
                                    <ArrowRight className="w-3 h-3 opacity-40 group-hover:opacity-100 motion-safe:-translate-x-1 motion-safe:group-hover:translate-x-0 transition-[transform,opacity] duration-200" />
                                </p>
                                <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-1">
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
