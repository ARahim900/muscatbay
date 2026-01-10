"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { updateUserProfile, uploadAvatar } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, Save, User, Shield, Bell, Smartphone, Monitor, CheckCircle2 } from "lucide-react"

export default function SettingsPage() {
    const { user, profile, isAuthenticated, refreshProfile } = useAuth()
    const [updating, setUpdating] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        full_name: "",
        username: "",
        website: "",
        avatar_url: "",
    })
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'notifications'>('profile')

    // Initialize form data from profile
    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || "",
                username: profile.username || "",
                website: profile.website || "",
                avatar_url: profile.avatar_url || "",
            })
        } else if (user) {
            setFormData({
                full_name: user.user_metadata?.full_name || "",
                username: "",
                website: "",
                avatar_url: user.user_metadata?.avatar_url || "",
            })
        }
    }, [profile, user])

    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) {
            return
        }
        const file = event.target.files[0]

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setError("Image size must be less than 2MB")
            return
        }

        setAvatarFile(file)
        setError(null)

        // Create preview
        const objectUrl = URL.createObjectURL(file)
        setAvatarPreview(objectUrl)
    }

    const updateProfile = async () => {
        if (!user) return

        setUpdating(true)
        setError(null)
        setSuccess(false)

        try {
            let avatarUrl = formData.avatar_url

            // Upload avatar if changed
            if (avatarFile) {
                try {
                    avatarUrl = await uploadAvatar(user.id, avatarFile)
                } catch (uploadErr: any) {
                    console.error("Avatar upload error:", uploadErr)
                    // Continue without avatar update if upload fails
                }
            }

            // Update profile
            await updateUserProfile(user.id, {
                full_name: formData.full_name,
                username: formData.username,
                website: formData.website,
                avatar_url: avatarUrl,
            })

            // Refresh profile in context
            await refreshProfile()

            setAvatarPreview(null)
            setAvatarFile(null)
            setSuccess(true)

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000)
        } catch (err: any) {
            console.error("Profile update error:", err)
            setError(err.message || "Failed to update profile")
        } finally {
            setUpdating(false)
        }
    }

    const displayName = formData.full_name || user?.email?.split("@")[0] || "User"
    const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)

    return (
        <div className="flex-1 p-4 sm:p-6 lg:p-8 pt-6 space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-mb-primary">Settings</h1>
                    <p className="text-muted-foreground mt-2">Manage your account settings and profile information.</p>
                </div>
                {isAuthenticated && (
                    <Badge variant="secondary" className="w-fit px-4 py-1.5 text-sm bg-mb-success/10 text-mb-success border-mb-success/20">
                        Authenticated
                    </Badge>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <aside className="lg:w-64 space-y-1">
                    {[
                        { id: 'profile', label: 'Profile', icon: User },
                        { id: 'account', label: 'Account', icon: Shield },
                        { id: 'notifications', label: 'Notifications', icon: Bell },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === item.id
                                ? "bg-mb-primary text-white shadow-md"
                                : "text-muted-foreground hover:bg-mb-primary/5 hover:text-mb-primary"
                                }`}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </button>
                    ))}
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 space-y-6">
                    {/* Success/Error Messages */}
                    {success && (
                        <div className="flex items-center gap-2 p-3 text-sm text-mb-success bg-mb-success/10 rounded-lg border border-mb-success/20">
                            <CheckCircle2 className="h-4 w-4" />
                            Profile updated successfully!
                        </div>
                    )}
                    {error && (
                        <div className="p-3 text-sm text-mb-danger bg-mb-danger/10 rounded-lg border border-mb-danger/20">
                            {error}
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <Card className="glass-card">
                            <CardHeader className="glass-card-header">
                                <CardTitle>Public Profile</CardTitle>
                                <CardDescription>
                                    This information represents you publicly on the platform.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center gap-6">
                                    <Avatar className="h-24 w-24 border-4 border-white dark:border-slate-900 shadow-lg">
                                        <AvatarImage src={avatarPreview || formData.avatar_url} />
                                        <AvatarFallback className="bg-mb-secondary text-white text-2xl font-bold">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Label
                                                htmlFor="avatar-upload"
                                                className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-mb-primary text-white hover:bg-mb-primary-hover h-9 px-4 py-2"
                                            >
                                                <Upload className="mr-2 h-4 w-4" />
                                                Change Avatar
                                            </Label>
                                            {avatarPreview && (
                                                <Button variant="ghost" size="sm" onClick={() => {
                                                    setAvatarPreview(null)
                                                    setAvatarFile(null)
                                                }} className="text-mb-danger hover:text-mb-danger-hover hover:bg-mb-danger/10">
                                                    Remove
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Recommended: 400x400px. Max size: 2MB.
                                        </p>
                                    </div>
                                    <Input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarChange}
                                    />
                                </div>

                                <Separator />

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="full-name">Full Name</Label>
                                        <Input
                                            id="full-name"
                                            value={formData.full_name}
                                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                            placeholder="e.g. John Doe"
                                            className="max-w-md bg-white/50 dark:bg-slate-800/50"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="username">Username</Label>
                                        <Input
                                            id="username"
                                            value={formData.username}
                                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                                            placeholder="e.g. john_doe"
                                            className="max-w-md bg-white/50 dark:bg-slate-800/50"
                                        />
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="website">Website</Label>
                                        <Input
                                            id="website"
                                            value={formData.website}
                                            onChange={e => setFormData({ ...formData, website: e.target.value })}
                                            placeholder="https://example.com"
                                            className="max-w-md bg-white/50 dark:bg-slate-800/50"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between border-t border-mb-primary/10 px-6 py-4 bg-mb-primary/5">
                                <p className="text-sm text-muted-foreground">
                                    Changes will be saved to your account.
                                </p>
                                <Button
                                    onClick={updateProfile}
                                    disabled={updating}
                                    className="bg-mb-primary hover:bg-mb-primary-hover text-white"
                                >
                                    {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Changes
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    {activeTab === 'account' && (
                        <Card className="glass-card">
                            <CardHeader className="glass-card-header">
                                <CardTitle>Account Security</CardTitle>
                                <CardDescription>
                                    Manage your login credentials and security preferences.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <div className="flex max-w-md items-center space-x-2">
                                        <Input
                                            id="email"
                                            value={user?.email || ""}
                                            disabled
                                            className="bg-slate-100 dark:bg-slate-800 text-slate-500"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Contact your administrator to change your email address.
                                    </p>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium">Active Sessions</h3>
                                    <div className="flex items-center justify-between p-4 border rounded-lg bg-white/50 dark:bg-slate-900 border-mb-primary/10">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white dark:bg-slate-800 rounded-full border shadow-sm">
                                                <Monitor className="w-5 h-5 text-mb-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-mb-primary">Current Session</p>
                                                <p className="text-xs text-muted-foreground">Active now</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-mb-success bg-mb-success/10 border-mb-success/20">Current</Badge>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between border-t border-mb-primary/10 px-6 py-4 bg-mb-primary/5">
                                <p className="text-sm text-muted-foreground">
                                    Session management options.
                                </p>
                                <Button
                                    onClick={updateProfile}
                                    disabled={updating}
                                    className="bg-mb-primary hover:bg-mb-primary-hover text-white"
                                >
                                    {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Changes
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    {activeTab === 'notifications' && (
                        <Card className="glass-card">
                            <CardHeader className="glass-card-header">
                                <CardTitle>Notifications</CardTitle>
                                <CardDescription>
                                    Configure how you receive alerts and reports.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between space-x-2">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Email Alerts</Label>
                                        <p className="text-sm text-muted-foreground">Receive daily summary reports via email.</p>
                                    </div>
                                    <div className="h-6 w-11 rounded-full bg-slate-200 dark:bg-slate-700 relative cursor-pointer">
                                        <div className="absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform" />
                                    </div>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between space-x-2">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Critical Alarms</Label>
                                        <p className="text-sm text-muted-foreground">Immediate notifications for critical system failures (SMS).</p>
                                    </div>
                                    <div className="h-6 w-11 rounded-full bg-mb-primary relative cursor-pointer">
                                        <div className="absolute top-1 right-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform" />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between border-t border-mb-primary/10 px-6 py-4 bg-mb-primary/5">
                                <p className="text-sm text-muted-foreground">
                                    Configure your notification preferences.
                                </p>
                                <Button
                                    onClick={updateProfile}
                                    disabled={updating}
                                    className="bg-mb-primary hover:bg-mb-primary-hover text-white"
                                >
                                    {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Changes
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
