"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { ReactNode, useMemo } from "react";
import { Breadcrumbs } from "./breadcrumbs";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { usePathname } from "next/navigation";

interface PageHeaderProps {
    title: string;
    description?: string;
    className?: string;
    showBreadcrumbs?: boolean;
    /** Override the auto-inferred module accent color (CSS value, e.g. "#3B7ED2") */
    moduleColor?: string;
    action?: {
        label: string;
        icon?: LucideIcon;
        onClick?: () => void;
    };
    children?: ReactNode;
}

const MODULE_ACCENTS: [string, string][] = [
    ['/water',        'var(--module-water)'],
    ['/electricity',  'var(--module-electricity)'],
    ['/stp',          'var(--module-stp)'],
    ['/assets',       'var(--module-assets)'],
    ['/contractors',  'var(--module-contractors)'],
    ['/hvac',         'var(--module-hvac)'],
    ['/pest-control', 'var(--module-pest)'],
    ['/firefighting', 'var(--module-fire)'],
    ['/settings',     'var(--module-assets)'],
];

export function PageHeader({ title, description, className, showBreadcrumbs = true, moduleColor, action, children }: PageHeaderProps) {
    const headerRef = useScrollAnimation<HTMLDivElement>({
        y: 20,
        duration: 0.4,
        stagger: 0.1,
    });

    const pathname = usePathname();

    const accentColor = useMemo(() => {
        if (moduleColor) return moduleColor;
        const match = MODULE_ACCENTS.find(([prefix]) => pathname?.startsWith(prefix));
        return match ? match[1] : null;
    }, [pathname, moduleColor]);

    return (
        <div ref={headerRef} className={cn("flex flex-col gap-2", className)}>
            {showBreadcrumbs && <Breadcrumbs className="mb-1" />}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div
                    className={cn("transition-all duration-200", accentColor && "border-s-[3px] ps-3")}
                    style={accentColor ? { borderColor: accentColor } : undefined}
                >
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
                    {description && (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">{description}</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {action && (
                        <Button onClick={action.onClick}>
                            {action.icon && <action.icon className="me-2 h-4 w-4" />}
                            {action.label}
                        </Button>
                    )}
                    {children}
                </div>
            </div>
        </div>
    );
}

