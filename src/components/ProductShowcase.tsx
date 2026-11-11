import React, { useState } from 'react';

interface ProductShowcaseProps {
  onExploreDemo: () => void;
}

export const ProductShowcase: React.FC<ProductShowcaseProps> = ({ onExploreDemo }) => {
  const [mobileTab, setMobileTab] = useState<'discrepancy' | 'evidence' | 'metrics'>('discrepancy');

  return (
    <section id="showcase" className="py-12 md:py-24 border-b border-[#E1E3DD] bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-12 text-left">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#BE825B] mb-2">
              Product Showcase
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#202923] text-balance">
              See exactly where the numbers don't match.
            </h2>
            <p className="mt-2 text-base text-[#202923]/80 leading-relaxed">
              PriceGuard cross-references every line against your contract and isolates discrepancies with supporting mathematical proof.
            </p>
          </div>

          <button
            onClick={onExploreDemo}
            className="w-full sm:w-auto px-5 py-3 text-xs sm:text-sm font-semibold text-white bg-[#214B3D] hover:bg-[#1A3C31] rounded-md transition-colors whitespace-nowrap self-start md:self-end shadow-xs cursor-pointer min-h-[44px] flex items-center justify-center"
          >
            Explore the Live Dashboard →
          </button>
        </div>

        {/* Polished Product Interface Showcase Composition */}
        <div className="border border-[#E1E3DD] rounded-xl bg-[#F8F7F3] p-4 sm:p-7 shadow-xs space-y-5">
          {/* Top Bar Annotation / System Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E1E3DD] pb-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#202923] text-xs sm:text-sm truncate">Audit Session: The Brass Palm Group</span>
              <span className="text-[#202923]/60 hidden sm:inline">· 3 Locations · October Deliveries</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="px-2 py-0.5 bg-white border border-[#E1E3DD] rounded-xs text-[#202923] font-medium">
                Deterministic Audit Engine
              </span>
              <span className="px-2 py-0.5 bg-[#F2F5F0] border border-[#214B3D]/30 rounded-xs text-[#214B3D] font-medium">
                100% Verified Math
              </span>
            </div>
          </div>

          {/* Mobile Showcase Tab Switcher */}
          <div className="lg:hidden flex items-center gap-1 p-1 bg-white rounded-lg border border-[#E1E3DD]">
            <button
              onClick={() => setMobileTab('discrepancy')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors text-center cursor-pointer min-h-[36px] ${
                mobileTab === 'discrepancy'
                  ? 'bg-[#214B3D] text-white font-semibold shadow-2xs'
                  : 'text-[#202923]/70 hover:text-[#202923]'
              }`}
            >
              Flagged Discrepancy
            </button>
            <button
              onClick={() => setMobileTab('evidence')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors text-center cursor-pointer min-h-[36px] ${
                mobileTab === 'evidence'
                  ? 'bg-[#214B3D] text-white font-semibold shadow-2xs'
                  : 'text-[#202923]/70 hover:text-[#202923]'
              }`}
            >
              Audit Evidence
            </button>
            <button
              onClick={() => setMobileTab('metrics')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors text-center cursor-pointer min-h-[36px] ${
                mobileTab === 'metrics'
                  ? 'bg-[#214B3D] text-white font-semibold shadow-2xs'
                  : 'text-[#202923]/70 hover:text-[#202923]'
              }`}
            >
              Session Totals
            </button>
          </div>

          {/* Mobile Content Display (1 Focus at a Time) */}
          <div className="lg:hidden">
            {mobileTab === 'discrepancy' && (
              <div className="bg-white p-4 rounded-lg border border-[#E1E3DD] text-left space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-[#E1E3DD] pb-2.5">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#202923]">INV-2026-8841</span>
                    <span className="text-xs text-[#202923]/60 ml-2">Artisan Meats</span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-[#A7443E] bg-[#FBF1F0] border border-[#A7443E]/20 rounded-xs">
                    Rate Discrepancy
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-semibold text-[#202923]">
                    Boneless Chicken Breast (600 KG)
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-[#F8F7F3] rounded-sm border border-[#E1E3DD]">
                      <span className="text-[10px] text-[#202923]/60 uppercase block">Agreed Contract</span>
                      <span className="font-mono font-bold text-[#214B3D] text-sm">$4.00 / kg</span>
                    </div>
                    <div className="p-2.5 bg-[#FBF1F0] rounded-sm border border-[#A7443E]/30">
                      <span className="text-[10px] text-[#A7443E] uppercase block">Charged Invoice</span>
                      <span className="font-mono font-bold text-[#A7443E] text-sm">$4.50 / kg</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#F8F7F3] rounded-md border border-[#E1E3DD] text-xs flex items-center justify-between">
                  <span className="text-[#202923]/80">Variance: +$0.50 per kg</span>
                  <span className="font-mono font-bold text-[#A7443E]">+$300.00 Overcharge</span>
                </div>
              </div>
            )}

            {mobileTab === 'evidence' && (
              <div className="bg-white p-4 rounded-lg border border-[#214B3D]/30 text-left space-y-3 shadow-2xs">
                <div className="text-xs font-bold text-[#214B3D] uppercase tracking-wider">
                  Audit Evidence & Documentation
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[#202923]/50 uppercase block">Matched Contract Clause</span>
                    <div className="p-2 bg-[#F8F7F3] rounded-xs font-mono text-[11px] text-[#202923]">
                      SKU: POUL-001 · Schedule B Section 4.2
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#202923]/50 uppercase block">Invoice Reference</span>
                    <div className="p-2 bg-[#F8F7F3] rounded-xs font-mono text-[11px] text-[#202923]">
                      Line 1: 600 KG @ $4.50 = $2,700.00
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#202923]/50 uppercase block">Exact Mathematical Proof</span>
                    <div className="p-2 bg-[#F2F5F0] rounded-xs font-mono text-[11px] text-[#214B3D] font-medium">
                      ($4.50 billed - $4.00 agreed) x 600 = $300.00
                    </div>
                  </div>
                </div>
              </div>
            )}

            {mobileTab === 'metrics' && (
              <div className="space-y-2.5">
                <div className="p-3.5 bg-white rounded-lg border border-[#A7443E]/30 bg-[#FBF1F0]/40 text-left">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#A7443E]">
                    Rate Overcharges
                  </div>
                  <div className="text-2xl font-mono font-bold text-[#A7443E] mt-1">
                    $654.00
                  </div>
                  <div className="text-[11px] text-[#202923]/60 mt-0.5">
                    Verified unit price inflation
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-lg border border-[#BE825B]/30 bg-[#FAF4ED]/50 text-left">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#BE825B]">
                    Duplicate Exposure
                  </div>
                  <div className="text-2xl font-mono font-bold text-[#BE825B] mt-1">
                    $4,620.00
                  </div>
                  <div className="text-[11px] text-[#202923]/60 mt-0.5">
                    Separated duplicate submissions
                  </div>
                </div>

                <div className="p-3.5 bg-white rounded-lg border border-[#E1E3DD] text-left">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#202923]/60">
                    Items Requiring Review
                  </div>
                  <div className="text-2xl font-mono font-bold text-[#202923] mt-1">
                    2 Items
                  </div>
                  <div className="text-[11px] text-[#202923]/60 mt-0.5">
                    Unmatched catalog or pack differences
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Full Composition (lg and above) */}
          <div className="hidden lg:block space-y-6">
            {/* Metric Summary Showcase */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-lg border border-[#A7443E]/30 bg-[#FBF1F0]/40 text-left">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#A7443E]">
                  Rate Overcharges
                </div>
                <div className="text-3xl font-mono font-bold text-[#A7443E] mt-1">
                  $654.00
                </div>
                <div className="text-[11px] text-[#202923]/60 mt-1">
                  Verified unit price inflation
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg border border-[#BE825B]/30 bg-[#FAF4ED]/50 text-left">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#BE825B]">
                  Duplicate Exposure
                </div>
                <div className="text-3xl font-mono font-bold text-[#BE825B] mt-1">
                  $4,620.00
                </div>
                <div className="text-[11px] text-[#202923]/60 mt-1">
                  Separated duplicate submissions
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg border border-[#E1E3DD] text-left">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#202923]/60">
                  Items Requiring Review
                </div>
                <div className="text-3xl font-mono font-bold text-[#202923] mt-1">
                  2 Items
                </div>
                <div className="text-[11px] text-[#202923]/60 mt-1">
                  Unmatched catalog or pack differences
                </div>
              </div>
            </div>

            {/* Detailed Evidence Inspector Showcase */}
            <div className="grid grid-cols-12 gap-6 items-start">
              {/* Left: Highlighted Finding Card */}
              <div className="col-span-7 bg-white p-6 rounded-lg border border-[#E1E3DD] text-left space-y-4">
                <div className="flex items-center justify-between border-b border-[#E1E3DD] pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#202923]">INV-2026-8841</span>
                    <span className="text-xs text-[#202923]/60 ml-2">Artisan Meats & Poultry Co.</span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-[#A7443E] bg-[#FBF1F0] border border-[#A7443E]/20 rounded-xs">
                    Rate Discrepancy Flagged
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-semibold text-[#202923]">
                    Boneless Chicken Breast (600 KG)
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-[#F8F7F3] rounded-sm border border-[#E1E3DD]">
                      <span className="text-[10px] text-[#202923]/60 uppercase block">Agreed Contract</span>
                      <span className="font-mono font-bold text-[#214B3D] text-sm">$4.00 / kg</span>
                    </div>
                    <div className="p-2.5 bg-[#FBF1F0] rounded-sm border border-[#A7443E]/30">
                      <span className="text-[10px] text-[#A7443E] uppercase block">Charged Invoice</span>
                      <span className="font-mono font-bold text-[#A7443E] text-sm">$4.50 / kg</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#F8F7F3] rounded-md border border-[#E1E3DD] text-xs flex items-center justify-between">
                  <span className="text-[#202923]/80">Variance: +$0.50 per kg across 600 kg</span>
                  <span className="font-mono font-bold text-[#A7443E]">+$300.00 Overcharge</span>
                </div>
              </div>

              {/* Right: Transparent Audit Evidence Inspector */}
              <div className="col-span-5 bg-white p-6 rounded-lg border border-[#214B3D]/30 text-left space-y-3.5">
                <div className="text-xs font-bold text-[#214B3D] uppercase tracking-wider">
                  Audit Evidence & Documentation
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[#202923]/50 uppercase block">Matched Contract Clause</span>
                    <div className="p-2 bg-[#F8F7F3] rounded-xs font-mono text-[11px] text-[#202923]">
                      SKU: POUL-001 · Schedule B Section 4.2
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#202923]/50 uppercase block">Invoice Reference</span>
                    <div className="p-2 bg-[#F8F7F3] rounded-xs font-mono text-[11px] text-[#202923]">
                      Line 1: 600 KG @ $4.50 = $2,700.00
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#202923]/50 uppercase block">Exact Mathematical Proof</span>
                    <div className="p-2 bg-[#F2F5F0] rounded-xs font-mono text-[11px] text-[#214B3D] font-medium">
                      ($4.50 billed - $4.00 agreed) x 600 = $300.00
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-[#202923]/60 italic">
                  Ready to review in the live interactive dashboard.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
