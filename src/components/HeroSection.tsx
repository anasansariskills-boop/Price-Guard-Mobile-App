import React, { useState } from 'react';

interface HeroSectionProps {
  onTryDemo: () => void;
  onRequestReview: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onTryDemo, onRequestReview }) => {
  const [selectedItem, setSelectedItem] = useState<'chicken' | 'oil'>('chicken');

  const items = {
    chicken: {
      name: 'Boneless Chicken Breast 1 KG',
      code: 'POUL-001',
      unit: 'KG',
      qty: 600,
      agreedRate: 4.00,
      invoicedRate: 4.50,
      diff: 300.00,
      supplier: 'Artisan Meats & Poultry Co.',
      contractRef: 'Master Supply Agreement Schedule B',
      invoiceRef: 'Invoice #INV-2026-8841 (Line 1)'
    },
    oil: {
      name: 'Extra Virgin Olive Oil (4x5L)',
      code: 'OIL-012',
      unit: 'CASE',
      qty: 20,
      agreedRate: 72.00,
      invoicedRate: 84.00,
      diff: 240.00,
      supplier: 'Pacific Coast Pantry & Produce',
      contractRef: 'Contract Price Schedule 2026',
      invoiceRef: 'Invoice #INV-90422 (Line 1)'
    }
  };

  const current = items[selectedItem];

  return (
    <section className="relative pt-8 pb-14 md:pt-20 md:pb-24 border-b border-[#E1E3DD] bg-[#F8F7F3]">
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Left Column: Direct Hook & CTAs */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-6 text-left">
            {/* 1. Small PriceGuard Identity */}
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#BE825B]">
              <span>PriceGuard</span>
              <span aria-hidden="true">·</span>
              <span>Independent Supplier Auditing</span>
            </div>

            {/* 2. Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#202923] leading-[1.15] text-balance">
              Are your suppliers charging you more than you agreed?
            </h1>

            {/* 3. One concise supporting sentence */}
            <p className="text-base sm:text-lg text-[#202923]/80 leading-relaxed max-w-xl">
              Spot differences between supplier invoices and agreed prices before they go unnoticed.
            </p>

            {/* 4. Primary CTA & Secondary Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={onTryDemo}
                className="w-full sm:w-auto px-6 py-3.5 text-base sm:text-sm font-semibold text-white bg-[#214B3D] hover:bg-[#1A3C31] rounded-md transition-colors text-center shadow-xs cursor-pointer min-h-[48px] flex items-center justify-center active:scale-[0.99]"
              >
                Try Live Demo
              </button>

              <button
                onClick={onRequestReview}
                className="w-full sm:w-auto py-2.5 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-medium text-[#202923]/75 hover:text-[#214B3D] underline sm:no-underline sm:bg-white sm:hover:bg-[#F2F5F0] sm:border sm:border-[#E1E3DD] sm:rounded-md transition-colors text-center cursor-pointer min-h-[40px] sm:min-h-[48px] flex items-center justify-center sm:shadow-2xs"
              >
                Request an Invoice Review
              </button>
            </div>

            <div className="pt-1 text-xs text-[#202923]/60 flex items-center gap-2">
              <span>Interactive demonstration using fictional sample data. No registration or uploads required.</span>
            </div>
          </div>

          {/* Right Column: Visual Document Comparison Preview */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-xl border border-[#E1E3DD] p-4 sm:p-7 shadow-xs space-y-4">
              {/* Item Toggle */}
              <div className="flex items-center justify-between border-b border-[#E1E3DD] pb-3 text-xs">
                <span className="font-semibold text-[#202923] uppercase tracking-wider text-[11px]">
                  Document Comparison
                </span>
                <div className="flex items-center gap-1 bg-[#F8F7F3] p-1 rounded-md border border-[#E1E3DD]">
                  <button
                    onClick={() => setSelectedItem('chicken')}
                    className={`px-3 py-1.5 text-xs rounded-sm transition-colors cursor-pointer min-h-[32px] ${
                      selectedItem === 'chicken'
                        ? 'bg-white text-[#214B3D] font-semibold shadow-2xs'
                        : 'text-[#202923]/70 hover:text-[#202923]'
                    }`}
                  >
                    Fresh Poultry
                  </button>
                  <button
                    onClick={() => setSelectedItem('oil')}
                    className={`px-3 py-1.5 text-xs rounded-sm transition-colors cursor-pointer min-h-[32px] ${
                      selectedItem === 'oil'
                        ? 'bg-white text-[#214B3D] font-semibold shadow-2xs'
                        : 'text-[#202923]/70 hover:text-[#202923]'
                    }`}
                  >
                    Pantry Oil
                  </button>
                </div>
              </div>

              {/* Mobile-Specific Comparison Visual (Compact & Vertical Flow on Phone) */}
              <div className="sm:hidden space-y-2.5 text-left">
                {/* 1. Agreed Price Fragment */}
                <div className="p-3.5 rounded-lg border border-[#E1E3DD] bg-[#F8F7F3] space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-[#202923]/60">
                    <span className="font-semibold text-[#202923]">Supplier Agreement</span>
                    <span className="font-mono text-[10px]">{current.code}</span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-xs text-[#202923]/70">Agreed price:</span>
                    <span className="font-mono tabular-nums text-base font-bold text-[#214B3D]">
                      ${current.agreedRate.toFixed(2)} / {current.unit.toLowerCase()}
                    </span>
                  </div>
                </div>

                {/* Connector */}
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#202923]/50 font-medium py-0.5">
                  <span aria-hidden="true">↓</span>
                  <span>Compared with</span>
                </div>

                {/* 2. Billed Price Fragment */}
                <div className="p-3.5 rounded-lg border border-[#A7443E]/30 bg-[#FBF1F0]/50 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-[#202923]/60">
                    <span className="font-semibold text-[#A7443E]">Supplier Invoice</span>
                    <span className="font-mono text-[10px]">{current.qty} {current.unit}</span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-xs text-[#202923]/70">Billed price:</span>
                    <span className="font-mono tabular-nums text-base font-bold text-[#A7443E]">
                      ${current.invoicedRate.toFixed(2)} / {current.unit.toLowerCase()}
                    </span>
                  </div>
                </div>

                {/* Connector */}
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#202923]/50 font-medium py-0.5">
                  <span aria-hidden="true">↓</span>
                  <span>Result</span>
                </div>

                {/* 3. Discrepancy Result Fragment */}
                <div className="p-3.5 bg-[#214B3D] text-white rounded-lg space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-[#E7EDE5]">Potential difference:</span>
                    <span className="text-lg font-mono font-bold text-white tabular-nums">
                      +${current.diff.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#E7EDE5]/75 pt-1 border-t border-white/15 flex justify-between">
                    <span>Rate variance:</span>
                    <span className="font-mono">+${(current.invoicedRate - current.agreedRate).toFixed(2)}/{current.unit.toLowerCase()}</span>
                  </div>
                </div>
              </div>

              {/* Desktop Side-by-Side Document Comparison (sm and above) */}
              <div className="hidden sm:grid sm:grid-cols-2 gap-3.5">
                {/* Agreed Price Schedule Document */}
                <div className="p-4 rounded-md border border-[#E1E3DD] bg-[#F8F7F3]/70 space-y-2.5 text-left">
                  <div className="flex items-center justify-between text-[11px] text-[#202923]/60">
                    <span className="font-semibold text-[#202923]">Supplier Agreement</span>
                    <span className="font-mono">{current.code}</span>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-[#202923] truncate">{current.name}</div>
                    <div className="text-[11px] text-[#202923]/60 truncate">{current.contractRef}</div>
                  </div>

                  <div className="pt-2 border-t border-[#E1E3DD] flex items-baseline justify-between">
                    <span className="text-[11px] text-[#202923]/70">Agreed price:</span>
                    <span className="font-mono tabular-nums text-sm font-semibold text-[#214B3D]">
                      ${current.agreedRate.toFixed(2)} / {current.unit.toLowerCase()}
                    </span>
                  </div>
                </div>

                {/* Billed Invoice Document */}
                <div className="p-4 rounded-md border border-[#A7443E]/30 bg-[#FBF1F0]/40 space-y-2.5 text-left">
                  <div className="flex items-center justify-between text-[11px] text-[#202923]/60">
                    <span className="font-semibold text-[#A7443E]">Supplier Invoice</span>
                    <span className="font-mono">{current.qty} {current.unit}</span>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-[#202923] truncate">{current.name}</div>
                    <div className="text-[11px] text-[#202923]/60 truncate">{current.invoiceRef}</div>
                  </div>

                  <div className="pt-2 border-t border-[#A7443E]/20 flex items-baseline justify-between">
                    <span className="text-[11px] text-[#202923]/70">Billed price:</span>
                    <span className="font-mono tabular-nums text-sm font-bold text-[#A7443E]">
                      ${current.invoicedRate.toFixed(2)} / {current.unit.toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Desktop Difference Banner */}
              <div className="hidden sm:flex p-4 bg-[#F8F7F3] rounded-md border border-[#E1E3DD] flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-[#202923]">
                    Potential difference: ${current.diff.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-[#202923]/70">
                    (${current.invoicedRate.toFixed(2)} charged - ${current.agreedRate.toFixed(2)} agreed) x {current.qty} {current.unit}
                  </div>
                </div>

                <span className="self-start sm:self-center px-2.5 py-1 text-[11px] font-semibold text-[#A7443E] bg-[#FBF1F0] border border-[#A7443E]/30 rounded-sm">
                  +${(current.invoicedRate - current.agreedRate).toFixed(2)}/{current.unit.toLowerCase()} discrepancy
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
