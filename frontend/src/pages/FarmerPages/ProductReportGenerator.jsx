import React, { useState } from 'react';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, File } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const ProductReportGenerator = () => {
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportFormat, setReportFormat] = useState('excel');
  const [isLoading, setIsLoading] = useState(false);

  const generateReport = async (format) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('farmerToken');

      // Fetch farmer profile
      const profileResponse = await fetch('/api/farmers/profile', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!profileResponse.ok) {
        throw new Error('Failed to fetch farmer profile');
      }
      const profileData = await profileResponse.json();
      const farmer = profileData.farmer || {};
      console.log('Farmer profile:', farmer);

      // Fetch products
      const productResponse = await fetch('/api/farmerProducts', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!productResponse.ok) {
        throw new Error('Failed to fetch products');
      }
      const productData = await productResponse.json();
      const products = productData.data || [];
      console.log('Farmer products:', products);

      const reportData = products.map((product) => ({
        Name: product.name || 'Unknown',
        Category: product.category || 'N/A',
        Price: `LKR ${product.price?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}`,
        Stock: `${product.countInStock ?? 0} kg`,
        Certification: product.certification || 'N/A',
        Description: product.description || 'No description',
      }));

      const columns = [
        'Name',
        'Category',
        'Price',
        'Stock (kg)',
        'Certification',
        'Description',
      ];

      const rows = reportData.map((item) => [
        item.Name,
        item.Category,
        item.Price,
        item.Stock,
        item.Certification,
        item.Description,
      ]);

      // Generate report ID using timestamp
      const reportId = `FR-${Date.now()}`;
      const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'numeric', 
        day: 'numeric' 
      });

      if (format === 'excel') {
        const coverSheetData = [
          ['Freshly.lk'],
          ['Delivering Freshness Across Sri Lanka'],
          ['123 Green Harvest Road, Colombo 00700, Sri Lanka'],
          ['Email: support@freshly.lk'],
          ['Phone: +94 112345678'],
          ['Website: www.freshly.lk'],
          [],
          ['Product Report'],
          ['Prepared for:', farmer.name || 'Unknown'],
          ['Date:', currentDate],
          ['Report ID:', reportId],
          ['Confidential: For internal use only.'],
          [],
          ['Product Summary'],
          ['This report provides an overview of your product inventory with Freshly.lk.'],
        ];

        const workbook = new ExcelJS.Workbook();
        const coverSheet = workbook.addWorksheet('Cover');
        coverSheetData.forEach((row) => coverSheet.addRow(row));
        coverSheet.getColumn(1).width = 20;
        coverSheet.getColumn(2).width = 50;

        const worksheet = workbook.addWorksheet('Products');
        worksheet.columns = [
          { header: 'Name', key: 'Name', width: 20 },
          { header: 'Category', key: 'Category', width: 15 },
          { header: 'Price', key: 'Price', width: 15 },
          { header: 'Stock (kg)', key: 'Stock', width: 10 },
          { header: 'Certification', key: 'Certification', width: 15 },
          { header: 'Description', key: 'Description', width: 30 },
        ];
        reportData.forEach((item) => {
          worksheet.addRow(item);
        });

        const headerRow = worksheet.getRow(1);
        headerRow.font = { name: 'Helvetica', bold: true };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Freshly_Product_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(`Excel report generated successfully!`, {
          style: {
            background: '#34D399',
            color: '#FFFFFF',
            fontWeight: 'bold',
          },
          duration: 3000,
        });
      } else {
        const doc = new jsPDF('portrait');

        // Cover page styling similar to the Driver Report
        // ======= LOGO PLACEMENT - ADD YOUR LOGO HERE =======
        // Uncomment and replace the path with your actual logo path
        const logoPath = '/src/assets/freshly-logo.png';
        doc.addImage(logoPath, 'PNG', 20, 15, 40, 40);
        // For now, we'll add a placeholder text
        //doc.setFontSize(10);
        //doc.setTextColor(150, 150, 150);
        //doc.text('LOGO PLACEHOLDER', 20, 25);
        // ===================================================

        //doc.setFontSize(20);
        //doc.setFont('helvetica', 'bold');
        //doc.setTextColor(34, 139, 34);
        //doc.text('Freshly.lk', 20, 40);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text('Delivering Freshness Across Sri Lanka', 20, 48);
        doc.text('123 Green Harvest Road, Colombo 00700, Sri Lanka', 20, 56);
        doc.text('Email: support@freshly.lk', 20, 64);
        doc.text('Phone: +94 11 234 5678', 20, 72);
        doc.text('Website: www.freshly.lk', 20, 80);

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Product Report', 20, 96);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Prepared for: ${farmer.name || 'Unknown'}`, 20, 112);
        doc.text(`Date: ${currentDate}`, 20, 120);
        doc.text(`Report ID: ${reportId}`, 20, 128);
        doc.text('Confidential: For internal use only.', 20, 136);

        // Add a horizontal line
        doc.setDrawColor(34, 139, 34);
        doc.setLineWidth(0.5);
        doc.line(20, 146, 190, 146);

        // Product summary section
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Product Summary', 20, 160);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('This report provides an overview of your product inventory with Freshly.lk,', 20, 170);
        doc.text('including product details, pricing, and stock information.', 20, 178);

        // Create statistical summary boxes similar to Driver Report
        if (products.length > 0) {
          // Simple metrics calculation
          const totalProducts = products.length;
          const totalStock = products.reduce((sum, product) => sum + (product.countInStock || 0), 0);
          const avgPrice = products.reduce((sum, product) => sum + (product.price || 0), 0) / totalProducts;
          
          // Create metrics table
          const metricsData = [
            ['Metric', 'Value'],
            ['Total Products', totalProducts.toString()],
            ['Total Stock', `${totalStock} kg`],
            ['Average Price', `LKR ${avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`]
          ];
          
          autoTable(doc, {
            head: [metricsData[0]],
            body: metricsData.slice(1),
            startY: 190,
            theme: 'grid',
            styles: {
              fontSize: 10,
              cellPadding: 4,
              lineColor: [200, 200, 200],
              lineWidth: 0.1,
            },
            headStyles: {
              fillColor: [34, 139, 34],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
            },
            columnStyles: {
              0: { cellWidth: 60 },
              1: { cellWidth: 60 },
            },
            margin: { left: 20 }
          });
        }

        // Add second page with product details
        doc.addPage();

        // Main products table
        autoTable(doc, {
          head: [columns],
          body: rows,
          startY: 20,
          styles: {
            fontSize: 9,
            cellPadding: 3,
            overflow: 'linebreak',
            font: 'helvetica',
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
          },
          headStyles: {
            fillColor: [34, 139, 34],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 25 },
            2: { cellWidth: 25 },
            3: { cellWidth: 20 },
            4: { cellWidth: 25 },
            5: { cellWidth: 45 },
          },
          didDrawPage: (data) => {
            // Header
            doc.setFontSize(8);
            doc.setTextColor(34, 139, 34);
            doc.text('Freshly.lk', doc.internal.pageSize.width / 2, 10, { align: 'center' });
            
            // Footer on each page
            const pageCount = doc.internal.getNumberOfPages();
            const currentPage = data.pageNumber;
            
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            
            // Left side of footer
            doc.text('Freshly.lk', 20, doc.internal.pageSize.height - 10);
            
            // Center of footer
            doc.text(`www.freshly.lk`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { 
              align: 'center' 
            });
            
            // Right side of footer
            doc.text(
              `Page ${currentPage - 1} of ${pageCount - 1}`,
              doc.internal.pageSize.width - 20,
              doc.internal.pageSize.height - 10,
              { align: 'right' }
            );
            
            // Report ID in footer
            doc.text(`Report ID: ${reportId}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 16, { 
              align: 'right' 
            });
          },
        });

        const pdfOutput = doc.output('blob');
        const url = URL.createObjectURL(pdfOutput);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Freshly_Product_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(`PDF report generated successfully!`, {
          style: {
            background: '#34D399',
            color: '#FFFFFF',
            fontWeight: 'bold',
          },
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report. Please try again.', {
        style: {
          background: '#EF4444',
          color: '#FFFFFF',
          fontWeight: 'bold',
        },
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <button
        onClick={() => setIsReportDialogOpen(true)}
        className="flex items-center px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
      >
        <Download className="mr-2" size={20} /> Generate Report
      </button>

      {isReportDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-green-800">
                Generate Product Report
              </h2>
              <button
                onClick={() => setIsReportDialogOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-green-700 mb-2">
                  Select Report Format
                </label>
                <select
                  value={reportFormat}
                  onChange={(e) => setReportFormat(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="excel">Excel (.xlsx)</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => generateReport(reportFormat)}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? (
                    'Generating...'
                  ) : reportFormat === 'excel' ? (
                    <>
                      <File className="mr-2" /> Generate Excel Report
                    </>
                  ) : (
                    <>
                      <File className="mr-2" /> Generate PDF Report
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsReportDialogOpen(false)}
                  disabled={isLoading}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductReportGenerator;