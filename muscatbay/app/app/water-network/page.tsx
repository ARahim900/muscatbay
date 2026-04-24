import type { Metadata } from 'next';
import WaterNetworkMap from '@/components/water/water-network-map';

export const metadata: Metadata = {
    title: 'Water Network Map — Muscat Bay',
    description: '3D map of the Muscat Bay water meter network with zone analytics, loss tracking and fault alerts.',
};

/**
 * /water-network route — full-screen 3D Cesium map of every meter in the
 * network, with per-zone analytics and fault alerts. Live-synced to Supabase.
 */
export default function WaterNetworkPage() {
    return <WaterNetworkMap />;
}
