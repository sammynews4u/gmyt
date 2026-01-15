
import React, { useState, useEffect } from 'react';
import { Package, ArrowUpRight, ArrowDownLeft, RefreshCcw, Search, AlertCircle, Loader2, Plus } from 'lucide-react';
import { InventoryItem } from '../types';
import { storageService } from '../services/storageService';

const DEFAULT_INVENTORY: InventoryItem[] = [
  { id: '1', product: 'Fashion Fabric - Silk', quantity: 120, in: 50, out: 20, balance: 150, reorderLevel: 30, responsibleParty: 'Mrs Esther', date: '2025-12-01' },
  { id: '2', product: 'Industrial Sewing Machines', quantity: 15, in: 0, out: 2, balance: 13, reorderLevel: 5, responsibleParty: 'Mr Fatai', date: '2025-12-01' },
];

const InventorySystem: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setIsLoading(true);
    const data = await storageService.getInventory();
    if (data.length === 0) {
      await storageService.saveInventory(DEFAULT_INVENTORY);
      setItems(DEFAULT_INVENTORY);
    } else {
      setItems(data);
    }
    setIsLoading(false);
  };

  const handleUpdateStock = async (id: string, type: 'in' | 'out', amount: number) => {
    const updated = items.map(item => {
      if (item.id === id) {
        const newIn = type === 'in' ? item.in + amount : item.in;
        const newOut = type === 'out' ? item.out + amount : item.out;
        const newBalance = type === 'in' ? item.balance + amount : item.balance - amount;
        return { ...item, in: newIn, out: newOut, balance: newBalance, date: new Date().toLocaleDateString() };
      }
      return item;
    });
    await storageService.saveInventory(updated);
    setItems(updated);
  };

  if (isLoading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" size={48} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Store Inventory Card</h2>
          <p className="text-sm text-zinc-500">Persistent tracking of all GMYT warehouse assets.</p>
        </div>
        <button onClick={loadInventory} className="flex items-center gap-2 px-6 py-2 gold-gradient rounded-xl font-bold text-black">
          <RefreshCcw size={16} /> Sync Stock
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
          <p className="text-zinc-400 text-sm mb-2">Total Items</p>
          <p className="text-3xl font-bold">{items.length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
          <p className="text-zinc-400 text-sm mb-2">Out of Stock</p>
          <p className="text-3xl font-bold text-rose-500">{items.filter(i => i.balance <= 0).length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
          <p className="text-zinc-400 text-sm mb-2">Low Stock Alerts</p>
          <p className="text-3xl font-bold text-amber-500">{items.filter(i => i.balance <= i.reorderLevel && i.balance > 0).length}</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-800/50 text-zinc-400 text-xs uppercase">
            <tr>
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4 text-right">Balance</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Quick Update</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-zinc-800/30">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-white">{item.product}</p>
                  <p className="text-[10px] text-zinc-500">Last updated: {item.date}</p>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-white text-right">{item.balance}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.balance <= item.reorderLevel ? 'bg-rose-500/20 text-rose-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                    {item.balance <= item.reorderLevel ? 'LOW STOCK' : 'HEALTHY'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleUpdateStock(item.id, 'in', 1)} className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20"><Plus size={14} /></button>
                    <button onClick={() => handleUpdateStock(item.id, 'out', 1)} className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500/20"><AlertCircle size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventorySystem;
