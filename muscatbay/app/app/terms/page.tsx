import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export const metadata = {
    title: "Terms of Service — Muscat Bay Operations",
    description: "Terms governing use of the Muscat Bay Operations platform.",
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-secondary transition-colors mb-8"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to sign in
                </Link>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 sm:p-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-secondary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary dark:text-secondary" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100">
                            Terms of Service
                        </h1>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                        Last updated: April 2026
                    </p>

                    <div className="space-y-6 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                        <section>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                1. Acceptance
                            </h2>
                            <p>
                                By signing in to Muscat Bay Operations you agree to these terms. The
                                platform is provided for the internal use of Muscat Bay staff and
                                authorized contractors. If you do not agree with these terms, do not use
                                the platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                2. Accounts &amp; access
                            </h2>
                            <p>
                                You are responsible for maintaining the confidentiality of your account
                                credentials and for all activity that occurs under your account. Access is
                                granted on a per-role basis. Sharing credentials, attempting to impersonate
                                another user, or accessing data beyond your authorized role is prohibited.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                3. Acceptable use
                            </h2>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Use the platform only for legitimate Muscat Bay operational purposes.</li>
                                <li>Do not upload malicious files or attempt to disrupt service availability.</li>
                                <li>Do not export, copy, or redistribute operational data outside of authorized channels.</li>
                                <li>Report bugs, security issues, and suspicious activity through your internal contact.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                4. Data ownership
                            </h2>
                            <p>
                                All operational data entered into the platform remains the property of
                                Muscat Bay. Account holders are granted access to view and work with this
                                data in proportion to their assigned role.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                5. Availability
                            </h2>
                            <p>
                                The platform is provided on a best-effort basis. Planned maintenance and
                                infrastructure updates may cause short interruptions. We make no guarantee
                                of uninterrupted service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                6. Changes
                            </h2>
                            <p>
                                These terms may be updated from time to time. Continued use of the platform
                                after an update constitutes acceptance of the revised terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                7. Contact
                            </h2>
                            <p>
                                Questions about these terms should be directed to the Muscat Bay operations
                                team through your usual internal channels.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
