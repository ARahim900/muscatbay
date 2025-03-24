
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Home,
  Droplets,
  Zap, 
  Factory, 
  Shield, 
  FileText, 
  FolderKanban,
  Clock,
  AirVent,
  X,
  ChevronRight
} from 'lucide-react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from 'framer-motion';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  openEmbeddedApp?: (url: string, title: string) => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, openEmbeddedApp }) => {
  // External app URLs
  const externalApps = {
    electricity: "https://electrical-muscatbay.lovable.app/",
    stpPlant: "https://stp.lovable.app/", 
    pumpingStation: "https://muscat-bay-pumping-stations.lovable.app/", 
    hvac: "https://hvac0.lovable.app/", 
    contracts: "https://contracts-tracker.lovable.app/", 
    projects: "/projects", // Internal route
    security: "https://security-manager.lovable.app/", 
  };

  const handleEmbeddedAppClick = (url: string, title: string) => {
    if (openEmbeddedApp) {
      openEmbeddedApp(url, title);
      onClose();
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <Link to="/" className="flex items-center" onClick={onClose}>
          <img 
            alt="Muscat Bay Logo" 
            className="h-8 w-auto mr-2" 
            src="/lovable-uploads/a4c6f994-ae31-40c5-a0c0-0314f091a04d.jpg" 
            style={{ objectFit: 'contain' }}
          />
          <div className="text-lg font-semibold text-primary">
            Muscat Bay <span className="ml-1">Asset Manager</span>
          </div>
        </Link>
        <button 
          onClick={onClose}
          className="p-2 rounded-full bg-accent/50 hover:bg-accent text-primary"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <motion.div 
          className="space-y-2"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item}>
            <Link 
              to="/"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
              onClick={onClose}
            >
              <Home className="h-5 w-5 text-primary" />
              <span className="font-medium">Dashboard</span>
            </Link>
          </motion.div>
          
          <motion.div variants={item}>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="utilities" className="border-0">
                <AccordionTrigger className="py-3 px-3 hover:bg-accent rounded-lg transition-all">
                  <div className="flex items-center gap-3">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Utilities</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-0">
                  <div className="space-y-1 pl-11">
                    <Link 
                      to="/water-system"
                      className="flex items-center justify-between p-2 rounded-md hover:bg-accent/80 transition-colors text-sm"
                      onClick={onClose}
                    >
                      <span>Water System</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                    <Link 
                      to="/electricity-system"
                      className="flex items-center justify-between p-2 rounded-md hover:bg-accent/80 transition-colors text-sm"
                      onClick={onClose}
                    >
                      <span>Electricity System</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
          
          <motion.div variants={item}>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="facilities" className="border-0">
                <AccordionTrigger className="py-3 px-3 hover:bg-accent rounded-lg transition-all">
                  <div className="flex items-center gap-3">
                    <Factory className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Facilities</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-0">
                  <div className="space-y-1 pl-11">
                    <button 
                      className="flex items-center justify-between w-full p-2 rounded-md hover:bg-accent/80 transition-colors text-sm text-left"
                      onClick={() => handleEmbeddedAppClick(externalApps.stpPlant, "STP Plant")}
                    >
                      <span>STP Plant</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button 
                      className="flex items-center justify-between w-full p-2 rounded-md hover:bg-accent/80 transition-colors text-sm text-left"
                      onClick={() => handleEmbeddedAppClick(externalApps.pumpingStation, "Pumping Stations")}
                    >
                      <span>Pumping Stations</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button 
                      className="flex items-center justify-between w-full p-2 rounded-md hover:bg-accent/80 transition-colors text-sm text-left"
                      onClick={() => handleEmbeddedAppClick(externalApps.hvac, "HVAC/BMS")}
                    >
                      <span>HVAC/BMS</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
          
          <motion.div variants={item}>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="management" className="border-0">
                <AccordionTrigger className="py-3 px-3 hover:bg-accent rounded-lg transition-all">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muscat-primary" />
                    <span className="font-medium">Management</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-0">
                  <div className="space-y-1 pl-11">
                    <button 
                      className="flex items-center justify-between w-full p-2 rounded-md hover:bg-accent/80 transition-colors text-sm text-left"
                      onClick={() => handleEmbeddedAppClick(externalApps.contracts, "Contracts")}
                    >
                      <span>Contracts</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <Link 
                      to="/projects"
                      className="flex items-center justify-between p-2 rounded-md hover:bg-accent/80 transition-colors text-sm"
                      onClick={onClose}
                    >
                      <span>Projects</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                    <Link 
                      to="/alm"
                      className="flex items-center justify-between p-2 rounded-md hover:bg-accent/80 transition-colors text-sm"
                      onClick={onClose}
                    >
                      <span>Asset Lifecycle</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                    <button 
                      className="flex items-center justify-between w-full p-2 rounded-md hover:bg-accent/80 transition-colors text-sm text-left"
                      onClick={() => handleEmbeddedAppClick(externalApps.security, "Security")}
                    >
                      <span>Security</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
          
          <motion.div variants={item}>
            <Link 
              to="/admin"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
              onClick={onClose}
            >
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-medium">Admin</span>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default MobileMenu;
