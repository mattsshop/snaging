
import React, { useState, useEffect } from 'react';
import Punchlist from './components/Punchlist';
import AddItemForm from './components/AddItemForm';
import { Header } from './components/Header';
import { PlusIcon } from './components/icons';
import { PunchlistItem } from './types';

type View = 'list' | 'add';

const App: React.FC = () => {
  const [items, setItems] = useState<PunchlistItem[]>([]);
  const [view, setView] = useState<View>('list');

  useEffect(() => {
    try {
      const storedItems = localStorage.getItem('punchlistItems');
      if (storedItems) {
        setItems(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error("Failed to load items from localStorage", error);
    }
  }, []);

  const saveItems = (newItems: PunchlistItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem('punchlistItems', JSON.stringify(newItems));
    } catch (error) {
      console.error("Failed to save items to localStorage", error);
    }
  };

  const addItem = (item: Omit<PunchlistItem, 'id' | 'createdAt'>) => {
    const newItem: PunchlistItem = {
      ...item,
      id: new Date().toISOString() + Math.random(),
      createdAt: new Date().toISOString(),
    };
    saveItems([newItem, ...items]);
  };

  const deleteItem = (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      const updatedItems = items.filter((item) => item.id !== id);
      saveItems(updatedItems);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark font-sans">
      <Header />
      <main className="p-4 pb-24">
        {view === 'list' ? (
          <Punchlist items={items} onDeleteItem={deleteItem} />
        ) : (
          <AddItemForm onAddItem={addItem} onCancel={() => setView('list')} />
        )}
      </main>

      {view === 'list' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-brand-dark border-t border-brand-light-gray flex justify-center">
          <button
            onClick={() => setView('add')}
            className="bg-brand-blue text-white font-bold py-4 px-8 rounded-full shadow-lg flex items-center justify-center transform hover:scale-105 transition-transform"
          >
            <PlusIcon className="h-6 w-6 mr-2" />
            Add New Snag
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
