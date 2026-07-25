"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { updateUserProfile, uploadAvatar } from "@/lib/auth"
import { useAppNotifications } from "@/components/NotificationProvider"
import { getAlertPreferences, setAlertPreferences } from "@/lib/alert-preferences"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TabNavigation } from "@/components/shared/tab-navigation"
import { Loader2, Upload, Save, User, Shield, Bell, Monitor, CheckCircle2, Droplets, Users, Waves, type LucideIcon } from "lucide-react"

type SettingsTab = 'profile' | 'account' | 'notifications'

const SETTINGS_TABS: { key: SettingsTab; label: string; icon: LucideIcon }[] = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'account', label: 'Account', icon: Shield },
    { key: 'notifications', label: 'Notifications', icon: Bell },
]

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
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
    const { permission, requestPermission } = useAppNotifications()
    // Persisted alert preference — read after mount (SSR-safe), applied immediately on toggle.
    const [pushEnabled, setPushEnabled] = useState(true)
    useEffect(() => {
        setPushEnabled(getAlertPreferences().push)
    }, [])
    const togglePush = () => {
        setPushEnabled(prev => setAlertPreferences({ push: !prev }).push)
    }

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

        // Validate file type (image formats the avatars bucket accepts)
        const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"]
        if (!ALLOWED_TYPES.includes(file.type)) {
            setError("Please choose a PNG, JPEG, WebP, or GIF image")
            return
        }

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

            // Upload avatar if changed. A failed upload must NOT be swallowed —
            // otherwise the user sees "Profile updated" while the image never saved.
            if (avatarFile) {
                try {
                    avatarUrl = await uploadAvatar(user.id, avatarFile)
                } catch (uploadErr: unknown) {
                    console.error("Avatar upload error:", uploadErr)
                    setError(uploadErr instanceof Error ? uploadErr.message : "Avatar upload failed — please try again")
                    setUpdating(false)
                    return
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
        } catch (err: unknown) {
            console.error("Profile update error:", err)
            setError(err instanceof Error ? err.message : "Failed to update profile")
        } finally {
            setUpdating(false)
        }
    }

    const displayName = formData.full_name || user?.email?.split("@")[0] || "User"
    const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)

    // Profile completion calculation
    const completionFields = [
        { filled: !!formData.full_name, label: "Full name" },
        { filled: !!formData.username, label: "Username" },
        { filled: !!formData.avatar_url || !!avatarPreview, label: "Profile photo" },
        { filled: !!formData.website, label: "Website" },
    ];
    const completedCount = completionFields.filter(f => f.filled).length;
    const completionPct = Math.round((completedCount / completionFields.length) * 100);
    const isProfileComplete = completedCount === completionFields.length;

    return (
        <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">Manage your account settings and profile.</p>
                </div>
                {isAuthenticated && (
                    <Badge variant="secondary" className="w-fit px-4 py-1.5 text-sm bg-mb-success/10 text-mb-success border-mb-success/20">
                        Authenticated
                    </Badge>
                )}
            </div>

            {/* Profile Completion Indicator */}
            {!isProfileComplete && (
                <div className="rounded-xl border border-secondary/30 dark:border-secondary/20 bg-secondary/5 dark:bg-secondary/10 p-4 sm:p-5">
                    <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-foreground">
                                Complete your profile — {completionPct}% done
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {completionFields.filter(f => !f.filled).map(f => f.label).join(", ")} still needed.
                            </p>
                        </div>
                        <div className="w-full sm:w-48 flex-shrink-0">
                            <div className="h-2 rounded-full bg-border dark:bg-muted overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-secondary transition-all duration-500"
                                    style={{ width: `${completionPct}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-6">
                {/* Section switcher — the shared TabNavigation, so these behave
                    (and are announced) as real ARIA tabs. They previously used
                    plain buttons with aria-current="page", which tells assistive
                    tech they are page-level navigation links, and sat at ~38px,
                    under the 44px field-touch target. */}
                <TabNavigation
                    tabs={SETTINGS_TABS}
                    activeTab={activeTab}
                    onTabChange={(key) => setActiveTab(key as SettingsTab)}
                    ariaLabel="Settings sections"
                />

                {/* Main Content Area */}
                <div className="flex-1 space-y-6">
                    {/* Success/Error Messages */}
                    {success && (
                        <div role="status" aria-live="polite" className="flex items-center gap-2 p-3 text-sm text-mb-success bg-mb-success/10 rounded-lg border border-mb-success/20">
                            <CheckCircle2 className="h-4 w-4" />
                            Profile updated successfully!
                        </div>
                    )}
                    {error && (
                        <div role="alert" className="p-3 text-sm text-mb-danger-text bg-mb-danger/10 rounded-lg border border-mb-danger/20">
                            {error}
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <Card
                            id="panel-profile"
                            role="tabpanel"
                            aria-labelledby="tab-profile"
                            tabIndex={0}
                            className="card-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <CardHeader className="card-elevated-header">
                                <CardTitle>Profile</CardTitle>
                                <CardDescription>
                                    Your name and photo as they appear across the Muscat Bay operations app.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center gap-6">
                                    <Avatar className="h-24 w-24 border-4 border-white dark:border-border shadow-lg">
                                        <AvatarImage src={avatarPreview || formData.avatar_url} />
                                        <AvatarFallback className="bg-mb-secondary text-primary-foreground text-2xl font-bold">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Label
                                                htmlFor="avatar-upload"
                                                className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-sidebar text-primary-foreground hover:bg-sidebar/90 h-9 px-4 py-2"
                                            >
                                                <Upload className="me-2 h-4 w-4" />
                                                Change Avatar
                                            </Label>
                                            {avatarPreview && (
                                                <Button variant="ghost" size="sm" onClick={() => {
                                                    setAvatarPreview(null)
                                                    setAvatarFile(null)
                                                }} className="text-mb-danger-text hover:bg-mb-danger/10">
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
                                        aria-label="Upload avatar"
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
                                            className="max-w-md bg-card/50"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="username">Username</Label>
                                        <Input
                                            id="username"
                                            value={formData.username}
                                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                                            placeholder="e.g. john_doe"
                                            className="max-w-md bg-card/50"
                                        />
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="website">Website</Label>
                                        <Input
                                            id="website"
                                            value={formData.website}
                                            onChange={e => setFormData({ ...formData, website: e.target.value })}
                                            placeholder="https://example.com"
                                            className="max-w-md bg-card/50"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between border-t border-sidebar/10 px-6 py-4 bg-sidebar/5">
                                <p className="text-sm text-muted-foreground">
                                    Changes will be saved to your account.
                                </p>
                                <Button
                                    onClick={updateProfile}
                                    disabled={updating}
                                    className="bg-sidebar hover:bg-sidebar/90 text-primary-foreground"
                                >
                                    {updating ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
                                    Save Changes
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    {activeTab === 'account' && (
                        <Card
                            id="panel-account"
                            role="tabpanel"
                            aria-labelledby="tab-account"
                            tabIndex={0}
                            className="card-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <CardHeader className="card-elevated-header">
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
                                            className="bg-muted text-muted-foreground"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Contact your administrator to change your email address.
                                    </p>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <h2 className="text-sm font-medium">Active Sessions</h2>
                                    <div className="flex items-center justify-between p-4 border rounded-lg bg-card/50 border-mb-primary/10">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-card rounded-full border border-border shadow-sm">
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
                            <CardFooter className="border-t border-sidebar/10 px-6 py-4 bg-sidebar/5">
                                <p className="text-sm text-muted-foreground">
                                    Need a different email? Contact your administrator.
                                </p>
                            </CardFooter>
                        </Card>
                    )}

                    {activeTab === 'notifications' && (
                        <Card
                            id="panel-notifications"
                            role="tabpanel"
                            aria-labelledby="tab-notifications"
                            tabIndex={0}
                            className="card-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <CardHeader className="card-elevated-header">
                                <CardTitle>Notifications</CardTitle>
                                <CardDescription>
                                    Alerts are generated automatically from live operational data.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* What is monitored — honest, data-driven trigger list */}
                                <div className="space-y-2">
                                    {/* Not a <Label>: there is no form control to
                                        label — a label with no `for` is a dangling
                                        label to assistive tech. */}
                                    <h2 className="text-base font-medium leading-none">Monitored conditions</h2>
                                    <p className="text-sm text-muted-foreground">
                                        These triggers are always on and feed the alert bell and dashboard.
                                    </p>
                                    <ul className="mt-2 space-y-2">
                                        <li className="flex items-start gap-2.5 text-sm text-foreground/85">
                                            <Droplets className="w-4 h-4 mt-0.5 text-module-water flex-shrink-0" aria-hidden="true" />
                                            Water system loss above the 15% management target (and critical zones above 25%)
                                        </li>
                                        <li className="flex items-start gap-2.5 text-sm text-foreground/85">
                                            <Users className="w-4 h-4 mt-0.5 text-module-contractors flex-shrink-0" aria-hidden="true" />
                                            Contracts past their end date while still marked active, or expiring within 60 days
                                        </li>
                                        <li className="flex items-start gap-2.5 text-sm text-foreground/85">
                                            <Waves className="w-4 h-4 mt-0.5 text-module-stp flex-shrink-0" aria-hidden="true" />
                                            STP critical failures — irrigation output stopped, low recovery, stale daily log
                                        </li>
                                    </ul>
                                </div>
                                <Separator />
                                {/* Browser push — the real delivery channel, persisted preference */}
                                <div className="flex items-center justify-between space-x-2">
                                    <div className="space-y-0.5">
                                        <p id="push-toggle-label" className="text-base font-medium leading-none">Browser push notifications</p>
                                        <p id="push-toggle-description" className="text-sm text-muted-foreground">
                                            Push new warning and critical alerts to this device, even in the background.
                                        </p>
                                    </div>
                                    {/* 44px hit area around the 24px switch track —
                                        field users are often gloved. */}
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={pushEnabled}
                                        aria-labelledby="push-toggle-label"
                                        aria-describedby="push-toggle-description"
                                        onClick={togglePush}
                                        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg cursor-pointer transition-colors duration-200 hover:bg-muted/60 dark:hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                                    >
                                        <span
                                            aria-hidden="true"
                                            className={`block h-6 w-11 rounded-full relative transition-colors duration-200 ${pushEnabled ? 'bg-sidebar' : 'bg-muted dark:bg-muted'}`}
                                        >
                                            <span className={`absolute top-1 start-1 block h-4 w-4 rounded-full bg-white dark:bg-muted shadow-sm transition-transform duration-200 ${pushEnabled ? 'rtl:-translate-x-5 translate-x-5' : 'translate-x-0'}`} />
                                        </span>
                                    </button>
                                </div>
                                {/* Browser permission state — push cannot work without it */}
                                <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card/50">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <Bell className="w-4 h-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                                        <p className="text-sm text-muted-foreground">
                                            {permission === 'granted' && 'Browser permission granted — push is active.'}
                                            {permission === 'default' && 'Browser permission not yet granted.'}
                                            {permission === 'denied' && 'Blocked by the browser — re-enable notifications for this site in your browser settings.'}
                                            {permission === 'unsupported' && 'This browser does not support push notifications.'}
                                        </p>
                                    </div>
                                    {permission === 'default' && (
                                        <Button
                                            size="sm"
                                            onClick={() => requestPermission()}
                                            className="bg-sidebar hover:bg-sidebar/90 text-primary-foreground flex-shrink-0"
                                        >
                                            Enable
                                        </Button>
                                    )}
                                    {permission === 'granted' && (
                                        <Badge variant="outline" className="text-mb-success bg-mb-success/10 border-mb-success/20 flex-shrink-0">Active</Badge>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="border-t border-sidebar/10 px-6 py-4 bg-sidebar/5">
                                <p className="text-sm text-muted-foreground">
                                    Changes apply immediately on this device.
                                </p>
                            </CardFooter>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
