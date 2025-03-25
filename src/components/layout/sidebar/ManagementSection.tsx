
import React from 'react';
import SidebarSection from './SidebarSection';
import SidebarLink from './SidebarLink';
import { LifeBuoy, GitFork, FileText, Wallet, Home } from 'lucide-react';

interface ManagementSectionProps {
  collapsed?: boolean;
}

const ManagementSection: React.FC<ManagementSectionProps> = ({ collapsed }) => {
  return (
    <SidebarSection
      title="Management"
      collapsed={collapsed}
    >
      <SidebarLink to="/alm" icon={<LifeBuoy size={20} />} label="Asset Lifecycle" collapsed={collapsed} />
      <SidebarLink to="/contracts" icon={<FileText size={20} />} label="Contracts" collapsed={collapsed} />
      <SidebarLink to="/operating-expenses" icon={<Wallet size={20} />} label="Expenses" collapsed={collapsed} />
      <SidebarLink to="/projects" icon={<GitFork size={20} />} label="Projects" collapsed={collapsed} />
      <SidebarLink to="/property-management" icon={<Home size={20} />} label="Properties" collapsed={collapsed} />
    </SidebarSection>
  );
};

export default ManagementSection;
