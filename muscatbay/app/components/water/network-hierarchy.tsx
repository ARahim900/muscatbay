"use client";

import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Droplets, Building2, Home, Store, Leaf, Gauge, Search, Filter, Info, AlertTriangle, Users, DoorOpen } from 'lucide-react';

// Complete Muscat Bay Water Network Hierarchy Data with Building → Apartment Structure
import { networkData, NetworkNode } from '@/lib/water-network-data';




const getIcon = (type: string, level: string) => {
    if (level === 'L1') return Droplets;
    if (type === 'category') return Filter;
    if (type === 'Zone_Bulk') return Gauge;
    if (type === 'Residential_Villa') return Home;
    if (type === 'D_Building_Bulk') return Building2;
    if (type === 'Apartment') return DoorOpen;
    if (type === 'Common_Area') return Users;
    if (type === 'Retail') return Store;
    if (type === 'IRR_Services') return Leaf;
    return Building2;
};

const getLevelStyle = (level: string, type: string) => {
    if (type === 'Common_Area') return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', badge: 'bg-amber-500' };
    switch (level) {
        case 'L1': return { bg: 'bg-gradient-to-r from-[#4E4456] to-[#5d5366]', text: 'text-white', badge: 'bg-[#4E4456]' };
        case 'L2': return { bg: 'bg-[#4E4456]/5 dark:bg-[#4E4456]/20', text: 'text-[#4E4456] dark:text-[#E4E4E7]', badge: 'bg-[#4E4456]' };
        case 'L3': return { bg: 'bg-slate-50 dark:bg-slate-800/50', text: 'text-slate-700 dark:text-slate-300', badge: 'bg-slate-500' };
        case 'L4': return { bg: 'bg-[#00D2B3]/10 dark:bg-[#00D2B3]/20', text: 'text-[#00A08A] dark:text-[#00D2B3]', badge: 'bg-[#00D2B3]' };
        default: return { bg: 'bg-white dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', badge: 'bg-slate-400' };
    }
};

interface TreeNodeProps {
    node: NetworkNode;
    depth?: number;
    searchTerm: string;
    expandedNodes: Set<string>;
    toggleExpand: (nodeId: string) => void;
}

const TreeNode = ({ node, depth = 0, searchTerm, expandedNodes, toggleExpand }: TreeNodeProps) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const Icon = getIcon(node.type, node.level);
    const levelStyle = getLevelStyle(node.level, node.type);
    const matchesSearch = searchTerm && node.label.toLowerCase().includes(searchTerm.toLowerCase());

    const childMatches = useMemo(() => {
        if (!searchTerm) return true;
        const checkMatch = (n: NetworkNode): boolean => {
            if (n.label.toLowerCase().includes(searchTerm.toLowerCase())) return true;
            if (n.children) return n.children.some(checkMatch);
            return false;
        };
        return checkMatch(node);
    }, [node, searchTerm]);

    if (searchTerm && !childMatches) return null;

    return (
        <div className="select-none">
            <div
                className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all duration-200
          ${depth === 0 ? levelStyle.bg : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'}
          ${matchesSearch ? 'ring-2 ring-amber-400 bg-amber-50 dark:bg-amber-900/30' : ''}
          ${node.alert ? 'border-l-4 border-red-400' : ''}
          ${node.level === 'L4' ? 'py-1.5' : ''}`}
                style={{ marginLeft: depth * 20 }}
                onClick={() => hasChildren && toggleExpand(node.id)}
            >
                <div className="w-5 h-5 flex items-center justify-center">
                    {hasChildren ? (isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />) : <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />}
                </div>
                <div className={`${node.level === 'L4' ? 'w-6 h-6' : 'w-8 h-8'} rounded-lg flex items-center justify-center ${depth === 0 ? 'bg-white/20' : node.type === 'Common_Area' ? 'bg-amber-100 dark:bg-amber-800/30' : node.level === 'L4' ? 'bg-purple-100 dark:bg-purple-800/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
                    <Icon className={`${node.level === 'L4' ? 'w-3 h-3' : 'w-4 h-4'} ${depth === 0 ? 'text-white' : node.type === 'Common_Area' ? 'text-amber-600 dark:text-amber-400' : levelStyle.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`font-medium truncate ${depth === 0 ? 'text-white text-lg' : node.level === 'L4' ? 'text-sm' : ''} ${levelStyle.text}`}>{node.label}</span>
                        {node.alert && <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                    </div>
                    {node.note && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{node.note}</p>}
                </div>
                <div className="flex items-center gap-2">
                    {node.level && node.type !== 'category' && <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${levelStyle.badge}`}>{node.level}</span>}
                    {node.type === 'D_Building_Bulk' && node.children && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-800/50 text-purple-600 dark:text-purple-300">{node.children.length} L4</span>}
                    {node.meterCount && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{node.meterCount} meters</span>}
                </div>
            </div>
            {hasChildren && isExpanded && (
                <div className="mt-1">{node.children?.map(child => <TreeNode key={child.id} node={child} depth={depth + 1} searchTerm={searchTerm} expandedNodes={expandedNodes} toggleExpand={toggleExpand} />)}</div>
            )}
        </div>
    );
};

const SummaryStats = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {[
            { label: 'L1 - Main Source', count: 1, color: 'bg-[#4E4456]', icon: Droplets },
            { label: 'L2 - Zone Bulks', count: 8, color: 'bg-[#4E4456]', icon: Gauge },
            { label: 'L2 - Direct', count: 11, color: 'bg-[#5d5366]', icon: Building2 },
            { label: 'L3 - Bldg/Villa', count: 147, color: 'bg-[#00D2B3]', icon: Home },
            { label: 'L4 - Apartments', count: 183, color: 'bg-[#00A08A]', icon: DoorOpen },
        ].map((stat) => (
            <div key={stat.label} className="glass-card p-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}><stat.icon className="w-5 h-5 text-white" /></div>
                    <div><div className="text-2xl font-bold text-[#4E4456] dark:text-slate-100">{stat.count}</div><div className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</div></div>
                </div>
            </div>
        ))}
    </div>
);

const Legend = () => (
    <div className="flex flex-wrap gap-4 mb-4 p-3 bg-[#4E4456]/5 dark:bg-slate-800/50 rounded-lg border border-border">
        {[
            { icon: Droplets, label: 'Main Source', color: 'text-[#4E4456]' },
            { icon: Gauge, label: 'Zone Bulk', color: 'text-[#4E4456]' },
            { icon: Home, label: 'Villa', color: 'text-[#00D2B3]' },
            { icon: Building2, label: 'Building Bulk (L3)', color: 'text-[#5d5366]' },
            { icon: DoorOpen, label: 'Apartment (L4)', color: 'text-[#00A08A]' },
            { icon: Users, label: 'Common Area (L4)', color: 'text-amber-500' },
            { icon: Store, label: 'Retail', color: 'text-[#4E4456]' },
            { icon: Leaf, label: 'Irrigation', color: 'text-[#00D2B3]' },
        ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5"><item.icon className={`w-4 h-4 ${item.color}`} /><span className="text-xs text-slate-600 dark:text-slate-400">{item.label}</span></div>
        ))}
        <div className="flex items-center gap-1.5 ml-auto"><div className="w-3 h-3 border-l-4 border-red-400 rounded-sm" /><span className="text-xs text-slate-600 dark:text-slate-400">Alert Zone</span></div>
    </div>
);

export function WaterNetworkHierarchy() {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['C43659', 'DC']));

    const toggleExpand = (nodeId: string) => setExpandedNodes(prev => { const next = new Set(prev); next.has(nodeId) ? next.delete(nodeId) : next.add(nodeId); return next; });
    const expandAll = () => {
        const getAllIds = (n: NetworkNode): string[] => [n.id, ...(n.children?.flatMap(getAllIds) || [])];
        setExpandedNodes(new Set(getAllIds(networkData)));
    };
    const collapseAll = () => setExpandedNodes(new Set(['C43659']));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header with Search and Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-[#4E4456] dark:text-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4E4456] to-[#5d5366] flex items-center justify-center">
                            <Droplets className="w-5 h-5 text-white" />
                        </div>
                        Water Network Hierarchy
                    </h2>
                    <p className="text-muted-foreground mt-1">Muscat Bay • 349 Meters • 4-Level Structure (L1→L2→L3→L4)</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search meters..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-lg border border-border bg-white dark:bg-slate-800 text-foreground focus:outline-none focus:ring-2 focus:ring-[#4E4456]/50 w-full sm:w-64"
                        />
                    </div>
                    <button onClick={expandAll} className="px-4 py-2 text-sm font-medium text-[#4E4456] dark:text-slate-300 bg-white dark:bg-slate-800 border border-border rounded-lg hover:bg-[#4E4456]/5 dark:hover:bg-slate-700 transition-colors">Expand All</button>
                    <button onClick={collapseAll} className="px-4 py-2 text-sm font-medium text-[#4E4456] dark:text-slate-300 bg-white dark:bg-slate-800 border border-border rounded-lg hover:bg-[#4E4456]/5 dark:hover:bg-slate-700 transition-colors">Collapse</button>
                </div>
            </div>

            {/* Summary Stats */}
            <SummaryStats />

            {/* Building Hierarchy Info */}
            <div className="bg-[#4E4456]/5 dark:bg-[#4E4456]/20 border border-[#4E4456]/20 dark:border-[#4E4456]/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-[#4E4456] mt-0.5" />
                    <div>
                        <h3 className="font-medium text-[#4E4456] dark:text-[#E4E4E7]">Building Hierarchy</h3>
                        <p className="text-sm text-[#4E4456]/80 dark:text-slate-300 mt-1"><strong>L3 Building Bulk</strong> meters are parents of <strong>L4 Apartment + Common Area</strong> meters</p>
                        <p className="text-xs text-[#4E4456]/70 dark:text-slate-400 mt-1">Stage 3 Loss = Building Bulk (L3) − Sum(Apartments + Common Area in L4)</p>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <Legend />

            {/* Tree View */}
            <div className="glass-card p-4">
                <TreeNode node={networkData} searchTerm={searchTerm} expandedNodes={expandedNodes} toggleExpand={toggleExpand} />
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-muted-foreground">Muscat Bay Water Management System • v2.1 • Building→Apartment Hierarchy</div>
        </div>
    );
}

export default WaterNetworkHierarchy;
