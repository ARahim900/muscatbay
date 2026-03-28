"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { Bug } from "lucide-react";

export default function PestControlPage() {
    const embedUrl = "https://aitable.ai/embed/shrCvd8kL1KLz6p09zcrv";

    return (
        <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full">
            <PageHeader
                title="Pest Control"
                description="Monitor and manage pest control operations"
            />

            <Card className="glass-card h-[calc(100vh-12rem)] min-h-[600px] flex flex-col animate-in fade-in duration-200">
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
                <CardContent className="flex-1 p-0 overflow-hidden">
                    <iframe
                        src={embedUrl}
                        width="100%"
                        height="100%"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        allow="fullscreen"
                        className="w-full h-full"
                        style={{ border: 'none' }}
                        title="Pest Control Daily Report Database"
                    />
                </CardContent>
            </Card>
        </div>
    );
}
