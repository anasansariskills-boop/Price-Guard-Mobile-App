import React, { useState } from 'react';

export const ProblemSection: React.FC = () => {
  const [activeInvoice, setActiveInvoice] = useState<number>(0);

  const sampleInvoices = [
    {
      invoiceNum: 'INV-8841',
      supplier: 'Artisan Meats Co.',
      item: 'Ground Chuck 80/20 (100 KG)',
      category: 'Fresh Meat',
      agreed: 6.20,
      billed: 6.50,
      qty: 100,
      unit: 'KG',
      diff: 30.00,
      note: '+$0.30 per KG rate creep'
    },
    {
      invoiceNum: 'INV-9042',
      supplier: 'Pacific Harvest Seafood',
      item: 'Atlantic Salmon Fillet (5 Cases)',
      category: 'Seafood',
      agreed: 120.00,
      billed: 135.00,
      qty: 5,
      unit: 'CASE',
      diff: 75.00,
      note: '+$15.00 per Case variance'
    },
    {
      invoiceNum: 'INV-9118',
      supplier: 'Coastal Pantry Supply',
      item: 'Extra Virgin Olive Oil (10 Cases)',
      category: 'Dry Goods',
      agreed: 72.00,
      billed: 84.00,
      qty: 10,
      unit: 'CASE',
      diff: 120.00,
      note: '+$12.00 per Case variance'
    }
  ];

  const totalDiscrepancy = sampleInvoices.reduce((acc, curr) => acc + curr.diff, 0);
  const currentInv = sampleInvoices[activeInvoice];

  return (
    <section id="problem" className="py-12 md:py-24 border-b border-[#E1E3DD] bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <div className="max-w-2xl mb-8 md:mb-10 text-left">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#BE825B] mb-2">
            The Problem
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#202923] text-balance">
            Small pricing mistakes can add up.
          </h2>
          <p className="mt-2.5 text-base text-[#202923]/80 leading-relaxed">
            Small pricing differences on recurring deliveries quietly accumulate across your suppliers and locations.
          </p>
        </div>

        {/* Mobile View: Show one compelling example at a time */}
        <div className="lg:hidden space-y-4 text-left">
          {/* Example Selector Segmented Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F8F7F3] rounded-lg border border-[#E1E3DD]">
            {sampleInvoices.map((inv, idx) => (
              <button
                key={inv.invoiceNum}
                onClick={() => setActiveInvoice(idx)}
                className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors text-center cursor-pointer min-h-[36px] ${
                  activeInvoice === idx
                    ? 'bg-white text-[#214B3D] font-bold shadow-2xs'
                    : 'text-[#202923]/70 hover:text-[#202923]'
                }`}
              >
                {inv.category}
              </button>
            ))}
          </div>

          {/* Single Focused Example Card */}
          <div className="p-4 rounded-xl border border-[#214B3D]/30 bg-[#F2F5F0] shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-xs font-bold text-[#202923]">
                  {currentInv.invoiceNum}
                </div>
                <div className="text-xs text-[#202923]/70 font-medium">
                  {currentInv.supplier}
                </div>
                <div className="text-sm font-semibold text-[#202923] mt-1">
                  {currentInv.item}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xl font-mono tabular-nums font-bold text-[#A7443E]">
                  +${currentInv.diff.toFixed(2)}
                </div>
                <div className="text-[11px] text-[#A7443E] font-medium">
                  {currentInv.note}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E1E3DD] text-xs text-[#202923]/80 flex items-center justify-between">
              <span>Agreed: <strong>${currentInv.agreed.toFixed(2)}</strong></span>
              <span>Billed: <strong className="text-[#A7443E]">${currentInv.billed.toFixed(2)}</strong></span>
              <span className="font-mono text-[11px] text-[#214B3D] font-semibold">
                x {currentInv.qty} {currentInv.unit}
              </span>
            </div>
          </div>

          {/* Compact Cumulative Summary on Mobile */}
          <div className="bg-[#214B3D] text-white p-5 rounded-xl shadow-xs space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#E7EDE5]/70">
              Accumulated Discrepancy
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-mono tabular-nums font-bold text-white">
                ${totalDiscrepancy.toFixed(2)}
              </div>
              <span className="text-xs text-[#E7EDE5]/80">Across 3 sample deliveries</span>
            </div>
            <p className="text-xs text-[#E7EDE5]/75 leading-relaxed pt-1 border-t border-white/15">
              Over dozens of weekly shipments, unnoticed differences become thousands in lost margin every year.
            </p>
          </div>
        </div>

        {/* Desktop View: Full 2-column layout (lg and above) */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: 3 Invoice Cards */}
          <div className="lg:col-span-7 space-y-3">
            {sampleInvoices.map((inv, idx) => {
              const isSelected = activeInvoice === idx;
              return (
                <div
                  key={inv.invoiceNum}
                  onClick={() => setActiveInvoice(idx)}
                  className={`p-5 rounded-lg border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'border-[#214B3D] bg-[#F2F5F0] shadow-xs'
                      : 'border-[#E1E3DD] bg-[#F8F7F3] hover:border-[#202923]/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#202923]">
                          {inv.invoiceNum}
                        </span>
                        <span className="text-xs text-[#202923]/60 truncate">
                          · {inv.supplier}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-[#202923] truncate">
                        {inv.item}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-mono tabular-nums font-bold text-[#A7443E]">
                        +${inv.diff.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-[#202923]/60">
                        {inv.note}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-[#E1E3DD] text-[11px] text-[#202923]/70 flex items-center justify-between">
                      <span>Agreed: ${inv.agreed.toFixed(2)} · Invoiced: ${inv.billed.toFixed(2)}</span>
                      <span className="font-mono text-[#214B3D] font-semibold">
                        (${inv.billed.toFixed(2)} - ${inv.agreed.toFixed(2)}) x {inv.qty} = ${inv.diff.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right: Cumulative Impact Card */}
          <div className="lg:col-span-5 bg-[#214B3D] text-white p-8 rounded-lg shadow-xs flex flex-col justify-between text-left">
            <div className="space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#E7EDE5]/70 block">
                Accumulated Discrepancy
              </span>
              <div className="text-5xl font-mono tabular-nums font-bold text-white">
                ${totalDiscrepancy.toFixed(2)}
              </div>
              <p className="text-sm text-[#E7EDE5]/80 leading-relaxed">
                Found across just 3 delivery invoices. Over dozens of weekly shipments, unnoticed differences become thousands in lost margin every year.
              </p>
            </div>

            <div className="pt-6 border-t border-white/15 text-xs text-[#E7EDE5]/70">
              PriceGuard checks every line so your team does not have to.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
