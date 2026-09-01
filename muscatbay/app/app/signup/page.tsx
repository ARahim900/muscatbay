import Link from "next/link";
import { ArrowLeft, MailCheck, ShieldCheck } from "lucide-react";

import { AuthBrandLockup } from "@/components/auth/brand-lockup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

export default function InvitationOnlyPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <AuthBrandLockup className="mb-8 justify-center" />
                <Card className="card-elevated">
                    <CardHeader className="space-y-2 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                            <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" />
                        </div>
                        <h1 className="text-2xl font-bold">Access is invitation only</h1>
                        <CardDescription>
                            Dashboard accounts are created by a Muscat Bay administrator.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="flex gap-3 rounded-lg border border-border bg-muted/40 p-4">
                            <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                            <p className="text-sm text-muted-foreground">
                                If you received an invitation, use the link in that email. Existing invited users may also sign in with Google using the same email address.
                            </p>
                        </div>
                        <Link href="/login" className="block">
                            <Button className="min-h-11 w-full">
                                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                                Return to sign in
                            </Button>
                        </Link>
                        <p className="text-center text-xs text-muted-foreground">
                            Service providers can submit a professional application without receiving dashboard access.
                        </p>
                        <Link href="/signup/professional" className="block text-center text-sm font-medium text-primary hover:underline">
                            Submit a professional application
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
