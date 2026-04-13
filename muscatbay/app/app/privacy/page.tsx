import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export const metadata = {
    title: "Privacy Policy — Muscat Bay Operations",
    description: "How Muscat Bay Operations collects, uses, and protects your data.",
};

export default function PrivacyPage() {
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
                            <Shield className="h-5 w-5 text-primary dark:text-secondary" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100">
                            Privacy Policy
                        </h1>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                        Last updated: April 2026
                    </p>

                    <div className="space-y-6 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                        <section>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                1. Scope
                            </h2>
                            <p>
                                Muscat Bay Operations is an internal operations platform used by Muscat Bay
                                staff and authorized contractors to monitor community infrastructure (water,
                                electricity, STP, assets, and related services). This policy describes how
                                we handle personal data within that platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                2. Data we collect
                            </h2>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Account information you provide at sign-up (name, email, role).</li>
                                <li>Authentication metadata managed by Supabase Auth (session tokens, login timestamps).</li>
                                <li>
                                    Operational data you enter or upload in the course of your work
                                    (meter readings, contractor records, asset logs, notes).
                                </li>
                                <li>Standard web telemetry (browser type, device, IP) used for security and debugging.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                3. How we use it
                            </h2>
                            <p>
                                Data is used solely to deliver and secure the platform: authenticating you,
                                showing the dashboards and reports you are authorized to see, and keeping an
                                audit trail of operational changes. We do not sell or share personal data
                                with third parties for marketing.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                4. Where data is stored
                            </h2>
                            <p>
                                Application data is stored in Supabase (PostgreSQL) and served through
                                Vercel. Both providers apply encryption in transit and at rest. Access is
                                restricted to authorized Muscat Bay personnel.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                5. Your rights
                            </h2>
                            <p>
                                You may request access to, correction of, or deletion of your account data
                                by contacting the Muscat Bay operations administrator. Deletion requests
                                will be honored subject to operational record-keeping requirements.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                6. Contact
                            </h2>
                            <p>
                                Questions about this policy should be directed to the Muscat Bay operations
                                team through your usual internal channels.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
