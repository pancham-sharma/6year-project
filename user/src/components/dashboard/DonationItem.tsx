import React from 'react';
import { CheckCircle, Download } from 'lucide-react';

interface DonationItemProps {
  donation: any;
  dark: boolean;
  onDownload: (id: number) => void;
}

export const DonationItem = React.memo(({ donation: d, dark, onDownload }: DonationItemProps) => {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${dark ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-gray-50 hover:bg-gray-100'} group hover:scale-[1.01]`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm transition-transform group-hover:rotate-6 ${
        d.category === 'Food' ? 'bg-orange-100 text-orange-600' :
        d.category === 'Clothes' ? 'bg-blue-100 text-blue-600' :
        d.category === 'Books' ? 'bg-purple-100 text-purple-600' :
        (d.category === 'Monetary' || d.category === 'Money') ? 'bg-green-100 text-green-600' :
        d.category === 'Gift' ? 'bg-pink-100 text-pink-600' :
        'bg-teal-100 text-teal-600'
      }`}>
        {(d.category === 'Food' || d.category === 'Meals') ? '🍲' : 
         d.category === 'Clothes' ? '👕' : 
         d.category === 'Books' ? '📚' : 
         (d.category === 'Monetary' || d.category === 'Money') ? '💰' : 
         d.category === 'Gift' ? '🎁' : 
         '🌱'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-bold text-sm ${dark ? 'text-white' : 'text-gray-900'}`}>{d.category} Donation</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${
            d.status === 'Completed' ? (dark ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-green-100 text-green-700') : 
            d.status === 'Scheduled' ? (dark ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-blue-100 text-blue-700') : 
            (dark ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-amber-100 text-amber-700')
          }`}>
            <CheckCircle className="w-3 h-3" />{d.status === 'Scheduled' ? 'Approved' : d.status}
          </span>
        </div>
        <p className={`text-xs ${dark ? 'text-slate-400' : 'text-gray-400'} mt-1`}>#DON-{d.id} • {new Date(d.timestamp).toLocaleDateString()} • {d.quantity_description}</p>
        <div className={`mt-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-tighter ${dark ? 'text-brand-light' : 'text-primary-600'}`}>
          <span className={dark ? 'text-slate-400/80' : 'opacity-60'}>Impact:</span>
          <span className={dark ? 'text-white' : ''}>
            {d.category?.toLowerCase() === 'food' ? `${d.quantity * 5} Meals provided` : 
             d.category?.toLowerCase() === 'environment' ? `${d.quantity} Trees supported` : 
             d.category?.toLowerCase() === 'monetary' || d.category?.toLowerCase() === 'money' ? `Directly funding missions` :
             `Making a difference with ${d.category}`}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => onDownload(d.id)}
          className={`p-2.5 rounded-xl transition-all ${dark ? 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white' : 'bg-white hover:bg-gray-200 text-gray-500 hover:text-gray-900 shadow-sm'}`} 
          title="Download Receipt"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

DonationItem.displayName = 'DonationItem';
