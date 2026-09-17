import React from 'react';
import { Sliders, Cpu, Check, FileText } from 'lucide-react';

export const ProductSpecs = ({ specs = {}, brand = '', category = '' }) => {
  const specEntries = Object.entries(specs);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-card">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
          <Sliders className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Technical Specifications</h3>
          <p className="text-xs text-slate-500">Verified hardware attributes and dimensions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3.5 divide-y sm:divide-y-0 divide-slate-100 text-sm">
        {specEntries.map(([key, value]) => (
          <div key={key} className="pt-2 sm:pt-0 flex items-start justify-between py-2 border-b border-slate-100/80">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/3">
              {key}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 w-2/3 text-right">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
