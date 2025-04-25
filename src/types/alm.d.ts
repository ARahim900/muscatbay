
// Asset Lifecycle Management types
interface Asset {
  id: string;
  name: string;
  category: string;
  location: string;
  installDate: string;
  expectedLifespan: number;
  currentAge: number;
  condition: string;
  maintenanceStatus: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  lastMaintenance: string;
  nextMaintenance: string;
  replacementCost: number;
}

interface AssetLifecycleForecast {
  id: string;
  assetName: string;
  category: string;
  expectedReplacement: string;
  estimatedCost: number;
  priority: 'Low' | 'Medium' | 'High';
}
