"use client"

import { Menu, LogOut, Settings, User } from "lucide-react"
import { Sidebar } from "@/components/layout/sidebar"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/auth/auth-provider"
import Link from "next/link"

export function Topbar() {
    const { user, profile, logout, isAuthenticated } = useAuth();

    const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
    const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

    return (
        <div className="flex items-center p-4 border-b h-16 bg-background">
            <Sheet>
                <SheetTrigger className="md:hidden inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10">
                    <Menu />
                </SheetTrigger>
                <SheetContent
                    side="left"
                    className="p-0 w-72 text-white border-r border-white/10"
                    style={{ background: "linear-gradient(180deg, #4E4456 0%, #3A3341 100%)" }}
                >
                    <SheetTitle className="sr-only">Menu</SheetTitle>
                    <Sidebar mobile />
                </SheetContent>
            </Sheet>

            <div className="ml-4 md:ml-0 flex w-full justify-between items-center">
                <h2 className="text-lg font-semibold md:hidden">
                    Muscat Bay Ops
                </h2>
                <div className="hidden md:block">
                </div>

                <div className="flex items-center gap-x-2 ml-auto">
                    {isAuthenticated ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent transition-colors outline-none">
                                <span className="text-sm text-muted-foreground hidden md:block">
                                    {displayName}
                                </span>
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={profile?.avatar_url || ""} />
                                    <AvatarFallback className="bg-[var(--mb-secondary)] text-white text-xs">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">{displayName}</p>
                                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <Link href="/settings/">
                                    <DropdownMenuItem className="cursor-pointer">
                                        <User className="mr-2 h-4 w-4" />
                                        Profile
                                    </DropdownMenuItem>
                                </Link>
                                <Link href="/settings/">
                                    <DropdownMenuItem className="cursor-pointer">
                                        <Settings className="mr-2 h-4 w-4" />
                                        Settings
                                    </DropdownMenuItem>
                                </Link>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={logout}
                                    className="cursor-pointer text-red-600 focus:text-red-600"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sign out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="flex items-center gap-x-2">
                            <span className="text-sm text-muted-foreground hidden md:block">
                                Guest
                            </span>
                            <Avatar className="h-8 w-8">
                                <AvatarFallback>G</AvatarFallback>
                            </Avatar>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
