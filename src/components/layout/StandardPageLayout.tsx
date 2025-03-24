
import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  color?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  description, 
  icon, 
  actions,
  color = 'bg-gradient-to-r from-primary/20 to-primary/5' 
}) => {
  return (
    <div className={`px-4 py-6 sm:px-6 md:px-8 rounded-xl mb-6 ${color}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2 rounded-full bg-primary/10 dark:bg-primary/20">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex-shrink-0 w-full sm:w-auto">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children, className = '' }) => {
  return (
    <div className={`p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  );
};

interface PageBreadcrumbsProps {
  items?: Array<{
    label: string;
    href?: string;
  }>;
}

export const PageBreadcrumbs: React.FC<PageBreadcrumbsProps> = ({ items = [] }) => {
  const location = useLocation();
  
  // If no items are provided, generate them from the current path
  const breadcrumbItems = items.length > 0 ? items : generateBreadcrumbs(location.pathname);
  
  return (
    <Breadcrumb className="mb-4 px-4 sm:px-6 md:px-8">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/">
              <Home className="h-3.5 w-3.5" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <ChevronRight className="h-3.5 w-3.5" />
        </BreadcrumbSeparator>
        
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={index}>
            {index === breadcrumbItems.length - 1 ? (
              <BreadcrumbItem>
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              </BreadcrumbItem>
            ) : (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={item.href || '#'}>{item.label}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-3.5 w-3.5" />
                </BreadcrumbSeparator>
              </>
            )}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

interface StandardPageLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  headerColor?: string;
  breadcrumbItems?: Array<{
    label: string;
    href?: string;
  }>;
}

// Helper function to generate breadcrumbs from path
function generateBreadcrumbs(path: string) {
  const parts = path.split('/').filter(Boolean);
  const breadcrumbs = parts.map((part, index) => {
    const href = '/' + parts.slice(0, index + 1).join('/');
    const formattedLabel = part
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return {
      label: formattedLabel,
      href
    };
  });
  
  return breadcrumbs;
}

const StandardPageLayout: React.FC<StandardPageLayoutProps> = ({
  children,
  title,
  description,
  icon,
  actions,
  headerColor,
  breadcrumbItems,
}) => {
  return (
    <motion.div 
      className="pb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <PageBreadcrumbs items={breadcrumbItems} />
      <PageHeader 
        title={title} 
        description={description} 
        icon={icon} 
        actions={actions}
        color={headerColor}
      />
      <PageContainer>
        {children}
      </PageContainer>
    </motion.div>
  );
};

export default StandardPageLayout;
