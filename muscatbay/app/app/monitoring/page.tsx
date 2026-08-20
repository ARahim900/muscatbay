import { MonitoringView } from "@/components/monitoring/monitoring-view";

export const metadata = {
    title: "Monitoring | Muscat Bay",
    description:
        "Daily, monthly and renewal completeness across every module — what was recorded, what is missing, and what to check.",
};

export default function MonitoringPage() {
    return <MonitoringView />;
}
