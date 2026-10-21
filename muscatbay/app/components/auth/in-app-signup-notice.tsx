import Link from "next/link";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Shown in place of the sign-up forms inside the iOS app.
 *
 * Apple requires an app that lets people create an account to also let them
 * delete it in the app (guideline 5.1.1(v)). Muscat Bay accounts are issued by
 * invitation, so the app offers no sign-up at all; the browser keeps the forms.
 * Hidden everywhere except under the `in-app` class (lib/theme.ts).
 */
export function InAppSignupNotice() {
    return (
        <Card className="card-elevated hidden in-app:flex">
            <CardHeader className="pb-2">
                <h1 className="text-2xl leading-normal font-bold text-center">Accounts are by invitation</h1>
            </CardHeader>
            <CardContent className="space-y-4 text-center text-sm text-muted-foreground">
                <p>
                    Muscat Bay Operations issues accounts to staff and approved contractors.
                    If you need access, contact support and we will arrange it.
                </p>
                <div className="flex justify-center gap-4">
                    <Link href="/login" className="text-primary dark:text-secondary hover:underline font-medium">
                        Sign in
                    </Link>
                    <Link href="/support" className="text-primary dark:text-secondary hover:underline font-medium">
                        Contact support
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
