
import React, { useState, useEffect } from 'react';
import { 
  Package, ArrowUpRight, ArrowDownLeft, RefreshCcw, Search, 
  AlertCircle, Loader2, Plus, Trash2, Edit3, X, Save, 
  ShieldCheck, UserCircle, History, Box, Layers, 
  AlertTriangle, Cpu
} from 'lucide-react';
import { InventoryItem, UserAccount } from '../types';
import { storageService } from '../services/storageService';
import { generateId } from '../utils/id';

interface InventorySystemProps {
  user: UserAccount;
}

const DEFAULT_INVENTORY: InventoryItem[] = [
  { id: '1', product: 'Fashion Fabric - Silk', quantity: 120, in: 50, out: 20, balance: 150, reorderLevel: 30, responsibleParty: 'Mrs Esther', date: '2025-12-01' },
  { id: '2', product: 'Industrial Sewing Machines', quantity: 15, in: 0, out: 2, balance: 13, reorderLevel: 5, responsibleParty: 'Mr Fatai', date: '2025-12-01' },
];

export default function InventorySystem({ user }: InventorySystemProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [search, setSearch] = useState('');

  const isAuthorized = user.role === 'CEO' || user.role === 'Accountant';

  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    product: '',
    balance: 0,
    reorderLevel: 5,
    responsibleParty: '',
    in: 0,
    out: 0
  });

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

  useEffect(() => {
    const init = async () => {
      await loadInventory();
    };
    init();

    const handleSyncComplete = () => {
      loadInventory();
    };
    window.addEventListener('gmyt-sync-complete', handleSyncComplete);
    return () => window.removeEventListener('gmyt-sync-complete', handleSyncComplete);
  }, []);

  const handleSaveItem = async () => {
    if (!newItem.product || !newItem.responsibleParty) {
      alert("Product Name and Responsible Party are required.");
      return;
    }

    const itemToSave: InventoryItem = {
      ...newItem,
      id: editingItem ? editingItem.id : generateId('inv-'),
      date: new Date().toLocaleDateString(),
      quantity: newItem.balance || 0,
      in: editingItem ? editingItem.in : 0,
      out: editingItem ? editingItem.out : 0,
    } as InventoryItem;

    const updatedItems = editingItem 
      ? items.map(i => i.id === editingItem.id ? itemToSave : i)
      : [...items, itemToSave];

    await storageService.saveInventory(updatedItems);
    setItems(updatedItems);
    setIsModalOpen(false);
    setEditingItem(null);
    setNewItem({ product: '', balance: 0, reorderLevel: 5, responsibleParty: '', in: 0, out: 0 });
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Permanently decommission this asset from the warehouse registry?")) return;
    const updated = items.filter(i => i.id !== id);
    await storageService.saveInventory(updated);
    setItems(updated);
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

  const filteredItems = items.filter(i => 
    i.product.toLowerCase().includes(search.toLowerCase()) || 
    i.responsibleParty.toLowerCase().includes(search.toLowerCase())
  );

  const renderLargeTextBox = (title: string, content: string | number, color: string = "amber", icon?: React.ReactNode) => (
    <div className={`p-5 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-2 h-full shadow-inner`}>
       <div className="flex items-center gap-2 mb-1">
          {icon && <div className={`text-${color}-500`}>{icon}</div>}
          <span className={`text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]`}>{title}</span>
       </div>
       <div className={`text-sm font-black ${typeof content === 'number' ? 'text-white' : 'text-zinc-300'} leading-tight whitespace-pre-wrap`}>
          {content || <span className="text-zinc-800 italic">Unspecified</span>}
       </div>
    </div>
  );

  if (isLoading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" size={48} /></div>;

  return (
    <div className="space-y-6 relative pb-24">
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-amber-500/10 rounded-2xl">
              <Package className="text-amber-500" size={32} />
           </div>
           <div>
              <h2 className="text-2xl font-black gold-text uppercase tracking-tight">Warehouse Registry</h2>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2">
                 Inventory Persistence Node | Protocol GMYT-INV-V2
                 {isAuthorized && <span className="text-emerald-500 flex items-center gap-1"><ShieldCheck size={14} /> CRUD Protocol Authorized</span>}
              </p>
           </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <div className="relative flex-1 sm:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input 
              type="text" 
              placeholder="Filter Store Ledger..." 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-amber-500 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={loadInventory} className="p-3 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl hover:text-white transition-all">
             <RefreshCcw size={18} />
          </button>
          {isAuthorized && (
            <button onClick={() => { setEditingItem(null); setNewItem({ product: '', balance: 0, reorderLevel: 5, responsibleParty: '', in: 0, out: 0 }); setIsModalOpen(true); }} className="px-6 py-2.5 gold-gradient rounded-xl font-black text-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-amber-500/20">
              <Plus size={18} /> Deploy Asset
            </button>
          )}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
         <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-950 text-zinc-500 text-[10px] uppercase font-bold tracking-[0.2em]">
               <tr>
                  <th className="px-8 py-6 w-16 text-center border-r border-zinc-800/50">SN</th>
                  <th className="px-8 py-6 w-1/4 border-r border-zinc-800/50">Asset Blueprint</th>
                  <th className="px-8 py-6">METRIC ANALYSIS (STOCK TABLE)</th>
                  <th className="px-8 py-6 w-48 text-right">Direct Control</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
               {filteredItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-zinc-800/30 transition-all group">
                     <td className="px-8 py-6 text-center border-r border-zinc-800/50 align-top">
                        <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center font-black text-amber-500 shadow-inner text-xs">{idx + 1}</div>
                     </td>
                     <td className="px-8 py-6 border-r border-zinc-800/50 align-top">
                        <div className="space-y-4">
                           {renderLargeTextBox("Product Identification", item.product, "amber", <Box size={10} />)}
                           <div className="flex items-center gap-2 px-4">
                              <div className="p-1 bg-amber-500/10 rounded-lg"><UserCircle size={12} className="text-amber-500" /></div>
                              <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">{item.responsibleParty}</span>
                           </div>
                        </div>
                     </td>
                     <td className="px-8 py-6 align-top">
                        <div className="grid grid-cols-3 gap-3">
                           {renderLargeTextBox("Operational Balance", item.balance, item.balance <= item.reorderLevel ? "rose" : "emerald", <Layers size={10} />)}
                           {renderLargeTextBox("Inbound Flow", item.in, "blue", <ArrowUpRight size={10} />)}
                           {renderLargeTextBox("Outbound Flow", item.out, "rose", <ArrowDownLeft size={10} />)}
                        </div>
                        <div className="mt-3 flex items-center justify-between px-2">
                           <div className={`text-[8px] font-black px-3 py-1 rounded-full border ${item.balance <= item.reorderLevel ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'}`}>
                              {item.balance <= item.reorderLevel ? 'CRITICAL REORDER NODE' : 'HEALTHY ASSET POOL'}
                           </div>
                           <div className="text-[9px] text-zinc-600 font-bold flex items-center gap-1 uppercase tracking-widest">
                              <History size={10} /> Sync: {item.date}
                           </div>
                        </div>
                     </td>
                     <td className="px-8 py-6 text-right align-top">
                        <div className="flex flex-col gap-3 justify-end h-full">
                           <div className="flex justify-end gap-2">
                              <button onClick={() => handleUpdateStock(item.id, 'in', 1)} className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-black transition-all flex items-center justify-center border border-emerald-500/20"><Plus size={16} /></button>
                              <button onClick={() => handleUpdateStock(item.id, 'out', 1)} className="w-10 h-10 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center border border-rose-500/20"><AlertCircle size={16} /></button>
                           </div>
                           {isAuthorized && (
                             <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800/50">
                                <button onClick={() => { setEditingItem(item); setNewItem(item); setIsModalOpen(true); }} className="p-3 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"><Edit3 size={18} /></button>
                                <button onClick={() => handleDeleteItem(item.id)} className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"><Trash2 size={18} /></button>
                             </div>
                           )}
                        </div>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-[3rem] p-8 md:p-12 max-h-[95vh] overflow-y-auto no-scrollbar shadow-2xl animate-in zoom-in duration-500">
             <div className="flex justify-between items-center mb-10">
               <div className="flex items-center gap-6">
                 <div className="p-4 bg-amber-500/10 rounded-3xl border border-amber-500/20">
                    <Cpu className="text-amber-500" size={32} />
                 </div>
                 <div>
                   <h2 className="text-3xl font-black text-white uppercase tracking-tight">{editingItem ? 'Asset Reconfiguration' : 'Strategic Asset Deployment'}</h2>
                   <p className="text-sm text-zinc-500 mt-1 uppercase tracking-[0.3em] font-bold">Persistence Protocol | GMYT Warehouse</p>
                 </div>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-4 bg-zinc-900 border border-zinc-800 rounded-3xl text-zinc-500 hover:text-white transition-all"><X size={28}/></button>
             </div>
             
             <div className="space-y-12">
                <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] p-8 space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                      <div className="space-y-4">
                        <label className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                           <Box size={14} className="text-amber-500" /> Asset Designation
                        </label>
                        <input 
                           type="text"
                           placeholder="Full Product Name..." 
                           className="w-full bg-zinc-950 border border-zinc-800 p-5 rounded-2xl text-sm focus:border-amber-500 outline-none font-bold text-white shadow-inner" 
                           value={newItem.product} 
                           onChange={e => setNewItem({...newItem, product: e.target.value})} 
                         />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                           <UserCircle size={14} className="text-amber-500" /> Authorized Responsible Node
                        </label>
                        <input 
                           type="text"
                           placeholder="Assign Responsible Staff..." 
                           className="w-full bg-zinc-950 border border-zinc-800 p-5 rounded-2xl text-sm focus:border-amber-500 outline-none font-bold text-white shadow-inner" 
                           value={newItem.responsibleParty} 
                           onChange={e => setNewItem({...newItem, responsibleParty: e.target.value})} 
                         />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-zinc-800/50">
                      <div className="space-y-4">
                        <label className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                           <Layers size={14} className="text-emerald-500" /> Initial Stock Balance
                        </label>
                        <input 
                           type="number"
                           className="w-full bg-zinc-950 border border-zinc-800 p-5 rounded-2xl text-sm focus:border-emerald-500 outline-none font-black text-emerald-500 shadow-inner" 
                           value={newItem.balance} 
                           onChange={e => setNewItem({...newItem, balance: Number(e.target.value)})} 
                         />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                           <AlertTriangle size={14} className="text-rose-500" /> Threshold Reorder Level
                        </label>
                        <input 
                           type="number"
                           className="w-full bg-zinc-950 border border-zinc-800 p-5 rounded-2xl text-sm focus:border-rose-500 outline-none font-black text-rose-500 shadow-inner" 
                           value={newItem.reorderLevel} 
                           onChange={e => setNewItem({...newItem, reorderLevel: Number(e.target.value)})} 
                         />
                      </div>
                   </div>
                </div>

                <div className="pt-12 border-t border-zinc-900 flex flex-col sm:flex-row gap-6">
                   <button onClick={handleSaveItem} className="flex-1 py-7 gold-gradient text-black font-black rounded-[2.5rem] shadow-2xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3">
                      <Save size={20} /> {editingItem ? 'Update Asset Node' : 'Initialize Asset Entry'}
                   </button>
                   <button onClick={() => setIsModalOpen(false)} className="px-16 py-7 bg-zinc-900 text-zinc-500 font-black rounded-[2.5rem] hover:bg-zinc-800 hover:text-white transition-all uppercase text-[11px] tracking-widest border border-zinc-800">
                      Abort Protocol
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
