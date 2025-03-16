
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface ExportPDFButtonProps {
  selector: string;
  filename?: string;
}

const ExportPDFButton: React.FC<ExportPDFButtonProps> = ({ 
  selector, 
  filename = 'dashboard-export.pdf' 
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    const element = document.querySelector(selector);
    
    if (!element) {
      toast.error('Export failed: Could not find content to export');
      return;
    }
    
    setIsExporting(true);
    toast.info('Preparing PDF export...');
    
    try {
      // Create a new jsPDF instance
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // margin in mm
      
      // Get all tab content elements
      const tabs = element.querySelectorAll('.tab-content');
      
      if (tabs.length > 0) {
        // Export each tab as a separate page
        for (let i = 0; i < tabs.length; i++) {
          const tab = tabs[i];
          
          if (i > 0) {
            pdf.addPage();
          }
          
          // Create canvas from the tab content
          const canvas = await html2canvas(tab as HTMLElement, {
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true
          });
          
          const imgData = canvas.toDataURL('image/png');
          
          // Calculate aspect ratio to fit within page margins
          const imgWidth = pdfWidth - (margin * 2);
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Add image to PDF
          pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
          
          // If the image is taller than the page, handle pagination
          let heightLeft = imgHeight;
          let position = margin;
          
          while (heightLeft > 0) {
            position = pdfHeight - heightLeft + margin;
            heightLeft -= (pdfHeight - (margin * 2));
            
            if (heightLeft > 0) {
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
            }
          }
        }
      } else {
        // If no tab-content elements, export the entire selector
        const canvas = await html2canvas(element as HTMLElement, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        // Calculate aspect ratio to fit within page margins
        const imgWidth = pdfWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Add image to PDF
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
        
        // Handle pagination for tall content
        let heightLeft = imgHeight;
        let position = margin;
        
        while (heightLeft > (pdfHeight - (margin * 2))) {
          position = pdfHeight - heightLeft + margin;
          heightLeft -= (pdfHeight - (margin * 2));
          
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        }
      }
      
      // Save the PDF
      pdf.save(filename);
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Export failed: An error occurred during export');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleExport} 
      disabled={isExporting}
      className="text-xs h-8"
    >
      <Download className="h-3 w-3 mr-1" />
      {isExporting ? 'Exporting...' : 'Export as PDF'}
    </Button>
  );
};

export default ExportPDFButton;
