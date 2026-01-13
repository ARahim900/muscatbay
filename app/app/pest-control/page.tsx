"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { Bug } from "lucide-react";

export default function PestControlPage() {
    const embedUrl = "https://aitable.ai/share/shrCvd8kL1KLz6p09zcrv";

    return (
        <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full">
            <PageHeader
                title="Pest Control"
                description="Monitor and manage pest control operations"
            />

            <Card className="glass-card h-[800px] animate-in fade-in duration-500">
                <CardHeader className="glass-card-header">
                    <div className="flex items-center gap-4">
                        <Bug className="w-6 h-6 text-mb-primary" />
                        <div>
                            <CardTitle>Daily Report Database</CardTitle>
                            <CardDescription>
                                Live data from the pest control operations team.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="h-full p-0 overflow-hidden">
                    <iframe
                        src={embedUrl}
                        frameBorder="0"
                        width="100%"
                        height="100%"
                        className="w-full h-full"
                        title="Pest Control Daily Report Database"
                    />
                </CardContent>
            </Card>
        </div>
    );
}
