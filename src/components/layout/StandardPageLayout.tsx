
import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StandardPageLayoutProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

const StandardPageLayout: React.FC<StandardPageLayoutProps> = ({
  title,
  description,
  icon,
  children,
  actions,
  className,
}) => {
  return (
    <div className={cn('flex flex-col min-h-screen p-6 animate-fadeIn', className)}>
      {/* Logo and header area */}
      <div className="flex items-center mb-2">
        <img 
          src="/lovable-uploads/a892f5a4-a5d2-46a4-a405-876b6a3d5bf8.png" 
          alt="Muscat Bay Logo" 
          className="h-10 mr-2"
        />
      </div>
      
      {/* Page header */}
      <header className="mb-6">
        <div className="flex items-center justify-between rounded-lg bg-[#4E4456] p-6 shadow-lg">
          <div className="flex items-center space-x-4">
            {icon && (
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 text-white">
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
              {description && (
                <p className="text-sm text-white/70 mt-1">{description}</p>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      </header>
      
      {/* Page content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
        <p>© 2025 Muscat Bay Asset Manager. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default StandardPageLayout;
