"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { Breadcrumbs } from "./breadcrumbs";

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
    return (
        <div className={cn("flex flex-col gap-2", className)}>
            {showBreadcrumbs && <Breadcrumbs className="mb-1" />}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
                    {description && (
                        <p className="text-muted-foreground mt-1">{description}</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {action && (
                        <Button onClick={action.onClick}>
                            {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                            {action.label}
                        </Button>
                    )}
                    {children}
                </div>
            </div>
        </div>
    );
}

