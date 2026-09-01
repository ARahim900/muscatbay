"use client";

import { FormEvent, useState } from "react";
import { Loader2, MailPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MODULES = [
    ["water", "Water"],
    ["electricity", "Electricity"],
    ["stp", "STP"],
    ["assets", "Assets"],
    ["contractors", "Contractors"],
    ["firefighting", "Fire safety"],
    ["hvac", "HVAC / BMS"],
    ["alerts", "Alerts"],
] as const;

export function InviteUserForm() {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("viewer");
    const [moduleScope, setModuleScope] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const toggleModule = (module: string) => {
        setModuleScope((current) => current.includes(module)
            ? current.filter((item) => item !== module)
            : [...current, module]);
    };

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await fetch("/api/admin/invitations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, role, moduleScope }),
            });
            const body: unknown = await response.json();
            const message = body && typeof body === "object" && "error" in body
                && typeof body.error === "string" ? body.error : null;
            if (!response.ok) throw new Error(message ?? "The invitation could not be sent.");
            setSuccess(`Invitation sent to ${email.trim().toLowerCase()}.`);
            setEmail("");
            setModuleScope([]);
        } catch (submitError: unknown) {
            console.error("Invitation request failed:", submitError);
            setError(submitError instanceof Error ? submitError.message : "The invitation could not be sent.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4" aria-labelledby="invite-user-heading">
            <div>
                <h2 id="invite-user-heading" className="text-sm font-semibold text-foreground">Invite dashboard user</h2>
                <p className="mt-1 text-xs text-muted-foreground">The link expires after seven days. New users receive only the selected role.</p>
            </div>
            {error && <p role="alert" className="rounded-lg bg-mb-danger-light p-3 text-sm text-mb-danger-text">{error}</p>}
            {success && <p role="status" className="rounded-lg bg-mb-success-light p-3 text-sm text-mb-success-text">{success}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="invite-email">Email address</Label>
                    <Input
                        id="invite-email"
                        type="email"
                        autoComplete="off"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="name@muscatbay.com"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="invite-role">Role</Label>
                    <select
                        id="invite-role"
                        value={role}
                        onChange={(event) => setRole(event.target.value)}
                        className="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <option value="viewer">Viewer — read only</option>
                        <option value="contractor">Contractor — scoped read only</option>
                        <option value="operator">Operator — read and update</option>
                        <option value="manager">Manager — read and update</option>
                        <option value="admin">Admin — full access</option>
                    </select>
                </div>
            </div>
            {role === "contractor" && (
                <fieldset className="space-y-2">
                    <legend className="text-sm font-medium text-foreground">Contractor module access</legend>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {MODULES.map(([value, label]) => (
                            <label key={value} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 text-sm">
                                <input
                                    type="checkbox"
                                    checked={moduleScope.includes(value)}
                                    onChange={() => toggleModule(value)}
                                />
                                {label}
                            </label>
                        ))}
                    </div>
                </fieldset>
            )}
            <Button type="submit" disabled={submitting || !email.trim()} className="min-h-11 gap-2">
                {submitting ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : <MailPlus className="h-4 w-4" aria-hidden="true" />}
                {submitting ? "Sending…" : "Send invitation"}
            </Button>
        </form>
    );
}
