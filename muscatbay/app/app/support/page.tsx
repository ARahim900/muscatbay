import Link from "next/link";
import { ArrowLeft, LifeBuoy } from "lucide-react";

export const metadata = {
    title: "Support — Muscat Bay Operations",
    description: "How to get help with the Muscat Bay Operations app.",
};

/** The one support address, already used on the sign-in error page. */
const SUPPORT_EMAIL = "support@muscatbay.com";

/**
 * Public support page — the App Store "Support URL" (guideline 1.5) and the
 * page the iOS app points to where it offers no self sign-up.
 */
export default function SupportPage() {
    return (
        <div className="min-h-screen bg-muted-bg py-12 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary dark:hover:text-secondary transition-colors mb-8"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to sign in
                </Link>

                <div className="bg-card rounded-xl shadow-sm border border-border p-8 sm:p-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-secondary/10 flex items-center justify-center">
                            <LifeBuoy className="h-5 w-5 text-primary dark:text-secondary" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
                            Support
                        </h1>
                    </div>
                    <p className="text-sm text-muted-foreground mb-8">
                        Muscat Bay Operations is the internal operations app for Muscat Bay staff and
                        approved contractors.
                    </p>

                    <div className="space-y-6 text-sm sm:text-base text-foreground leading-relaxed">
                        <section>
                            <h2 className="text-lg font-semibold text-foreground mb-2">
                                Contact
                            </h2>
                            <p>
                                Email{" "}
                                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary dark:text-secondary hover:underline">
                                    {SUPPORT_EMAIL}
                                </a>{" "}
                                with your name, the email you sign in with, and a short description of the
                                problem. A screenshot helps.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-foreground mb-2">
                                Getting an account
                            </h2>
                            <p>
                                Accounts are issued by Muscat Bay Operations to staff and approved
                                contractors. If you need access, email support and say which team or
                                contract you work on.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-foreground mb-2">
                                Cannot sign in
                            </h2>
                            <p>
                                Use{" "}
                                <Link href="/forgot-password" className="text-primary dark:text-secondary hover:underline">
                                    Forgot password
                                </Link>{" "}
                                to set a new password. If the reset email does not arrive, check your junk
                                folder, then contact support.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-foreground mb-2">
                                A figure looks wrong
                            </h2>
                            <p>
                                Tell support which page, which meter or asset, and the date. The app shows
                                readings exactly as recorded and marks missing ones as missing, so a
                                wrong figure usually points to a source reading that needs checking.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-foreground mb-2">
                                Deleting your account
                            </h2>
                            <p>
                                Email support from the address you sign in with and ask for your account to
                                be deleted. See the{" "}
                                <Link href="/privacy" className="text-primary dark:text-secondary hover:underline">
                                    Privacy Policy
                                </Link>{" "}
                                for how your data is handled.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
