"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { Breadcrumbs } from "./breadcrumbs";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface PageHeaderProps {
    title: string;
    description?: string;
    className?: string;
    showBreadcrumbs?: boolean;
    action?: {
        label: string;
        icon?: LucideIcon;
        onClick?: () => void;
    };
    children?: ReactNode;
}

export function PageHeader({ title, description, className, showBreadcrumbs = true, action, children }: PageHeaderProps) {
    const headerRef = useScrollAnimation<HTMLDivElement>({
        y: 20,
        opacity: 0,
        duration: 0.4,
        stagger: 0.1,
    });

    return (
        <div ref={headerRef} className={cn("flex flex-col gap-2", className)}>
            {showBreadcrumbs && <Breadcrumbs className="mb-1" />}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
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

