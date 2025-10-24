
import React, { useState, useMemo } from 'react';
import { PunchlistItem, PunchlistItemCategory } from '../types';
import { CATEGORIES } from '../constants';
import { TrashIcon, PdfIcon } from './icons';

interface PunchlistProps {
  items: PunchlistItem[];
  onDeleteItem: (id: string) => void;
}

const Punchlist: React.FC<PunchlistProps> = ({ items, onDeleteItem }) => {
  const [filter, setFilter] = useState<PunchlistItemCategory | 'All'>('All');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const filteredItems = useMemo(() => {
    if (filter === 'All') return items;
    return items.filter((item) => item.category === filter);
  }, [items, filter]);

  const generatePdf = async () => {
    setIsGeneratingPdf(true);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.text(`Punchlist Report - ${filter}`, 14, 16);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

    const tableColumn = ["Room", "Category", "Description", "Photo"];
    const tableRows: any[][] = [];

    filteredItems.forEach(item => {
      const itemData = [
        item.room,
        item.category,
        item.description,
        '', // Placeholder for image
      ];
      tableRows.push(itemData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      didDrawCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 3) {
          const item = filteredItems[data.row.index];
          if (item.photo) {
            try {
              // The image needs to fit into the cell. Adjust dimensions as needed.
              const imgWidth = 20;
              const imgHeight = 20;
              const x = data.cell.x + 2;
              const y = data.cell.y + 2;
              doc.addImage(item.photo, 'JPEG', x, y, imgWidth, imgHeight);
            } catch (e) {
              console.error("Error adding image to PDF", e);
            }
          }
        }
      },
      rowPageBreak: 'avoid',
      bodyStyles: { minCellHeight: 25 },
    });
    
    doc.save(`punchlist_${filter.toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`);
    setIsGeneratingPdf(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-brand-gray rounded-lg">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as PunchlistItemCategory | 'All')}
          className="bg-brand-light-gray border border-gray-600 text-white text-sm rounded-lg focus:ring-brand-blue focus:border-brand-blue block w-full p-2.5"
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button
          onClick={generatePdf}
          disabled={isGeneratingPdf || filteredItems.length === 0}
          className="w-full sm:w-auto flex items-center justify-center px-4 py-2.5 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          <PdfIcon className="h-5 w-5 mr-2"/>
          {isGeneratingPdf ? 'Generating...' : `Generate PDF (${filteredItems.length})`}
        </button>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-10 px-4">
          <p className="text-gray-400">No items found.</p>
          {filter !== 'All' && <p className="text-gray-500 text-sm">Try selecting a different category.</p>}
        </div>
      ) : (
        <ul className="space-y-4">
          {filteredItems.map((item) => (
            <li key={item.id} className="bg-brand-gray rounded-lg shadow-lg overflow-hidden flex flex-col sm:flex-row">
              <img src={item.photo} alt={item.description} className="w-full sm:w-32 h-32 sm:h-auto object-cover"/>
              <div className="p-4 flex-grow">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg">Room: {item.room}</h3>
                  <span className="bg-brand-blue text-xs font-semibold px-2 py-1 rounded-full">{item.category}</span>
                </div>
                <p className="text-gray-300 mt-2">{item.description}</p>
              </div>
              <div className="p-4 bg-brand-light-gray sm:bg-transparent flex items-center justify-end sm:justify-center">
                <button
                  onClick={() => onDeleteItem(item.id)}
                  className="p-2 text-red-500 hover:text-red-400 hover:bg-red-900/50 rounded-full transition-colors"
                  aria-label="Delete item"
                >
                  <TrashIcon className="h-6 w-6"/>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Punchlist;
