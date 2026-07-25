import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * The single brand lockup for every unauthenticated page.
 *
 * Login used the real `/logo.png` mark while signup, the professional
 * application and forgot-password each drew their own purple square with the
 * letters "MB" — three pages of the same flow presenting two different brands.
 * All of them now render this component.
 */
export function AuthBrandLockup({ className }: { className?: string }) {
    return (
        <div className={cn("flex items-center gap-3", className)}>
            <div className="relative w-12 h-12 flex-shrink-0 rounded-xl bg-primary p-2 shadow-lg">
                <Image
                    src="/logo.png"
                    alt=""
                    fill
                    sizes="48px"
                    className="object-contain p-1"
                    priority
                />
            </div>
            <div className="min-w-0">
                <p className="text-xl font-bold text-foreground">Muscat Bay</p>
                <p className="text-sm text-primary dark:text-secondary">Operations Dashboard</p>
            </div>
        </div>
    );
}
