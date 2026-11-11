import React, { useState } from 'react';

interface CostCalculatorProps {
  onRequestReview: () => void;
  onExploreDemo: () => void;
}

export const CostCalculator: React.FC<CostCalculatorProps> = ({ onRequestReview, onExploreDemo }) => {
  const [monthlySpend, setMonthlySpend] = useState<number>(50000);
  const [discrepancyRate, setDiscrepancyRate] = useState<number>(1.0);

  const annualSpend = monthlySpend * 12;
  const potentialAnnualExposure = Math.round(annualSpend * (discrepancyRate / 100));
  const potentialMonthlyExposure = Math.round(monthlySpend * (discrepancyRate / 100));

  const spendPresets = [25000, 50000, 100000, 200000];

  return (
    <section id="cost-calculator" className="py-20 border-b border-[#E1E3DD] bg-[#F8F7F3]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mb-12">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#BE825B] mb-2">
            Financial Impact
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#202923] text-balance">
            Small price differences can add up.
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#202923]/80 leading-relaxed">
            Adjust your estimated monthly supplier purchasing volume to understand how subtle pricing differences across recurring deliveries could affect annual operating margins.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Controls Column */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-lg border border-[#E1E3DD] space-y-7 shadow-xs">
            {/* Monthly Spend Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-[#202923]">
                  Monthly Supplier Spending
                </label>
                <span className="font-mono tabular-nums text-lg font-bold text-[#214B3D]">
                  ${monthlySpend.toLocaleString()}
                </span>
              </div>

              <input
                type="range"
                min="10000"
                max="250000"
                step="5000"
                value={monthlySpend}
                onChange={(e) => setMonthlySpend(Number(e.target.value))}
                className="w-full accent-[#214B3D] cursor-pointer"
              />

              <div className="flex items-center justify-between text-[11px] text-[#202923]/50 mt-1">
                <span>$10,000 / month</span>
                <span>$250,000 / month</span>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2 mt-3.5">
                <span className="text-xs text-[#202923]/60 mr-1">Quick Select:</span>
                {spendPresets.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setMonthlySpend(amt)}
                    className={`text-xs px-2.5 py-1 rounded-sm border transition-colors cursor-pointer ${
                      monthlySpend === amt
                        ? 'bg-[#214B3D] text-white border-[#214B3D] font-semibold'
                        : 'bg-[#F8F7F3] text-[#202923] border-[#E1E3DD] hover:bg-[#E7EDE5]'
                    }`}
                  >
                    ${amt / 1000}k
                  </button>
                ))}
              </div>
            </div>

            {/* Illustrative Discrepancy Rate Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-[#202923]">
                  Illustrative Discrepancy Rate
                </label>
                <span className="font-mono tabular-nums text-lg font-bold text-[#BE825B]">
                  {discrepancyRate.toFixed(1)}%
                </span>
              </div>

              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={discrepancyRate}
                onChange={(e) => setDiscrepancyRate(Number(e.target.value))}
                className="w-full accent-[#BE825B] cursor-pointer"
              />

              <div className="flex items-center justify-between text-[11px] text-[#202923]/50 mt-1">
                <span>0.5% (Very Conservative)</span>
                <span>3.0% (Higher Discrepancy)</span>
              </div>
            </div>

            {/* Required Specific Disclaimer */}
            <div className="p-4 bg-[#F8F7F3] rounded-md border border-[#E1E3DD] text-xs text-[#202923]/70 leading-relaxed">
              <strong className="text-[#202923] font-medium">Please note: </strong>
              Illustrative calculation only. Actual discrepancies depend on supplier agreements and invoice data.
            </div>
          </div>

          {/* Result Display Card */}
          <div className="lg:col-span-5 bg-[#214B3D] text-white p-7 sm:p-8 rounded-lg shadow-xs flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#E7EDE5]/70 mb-1">
                  Potential Annual Exposure
                </div>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold font-mono tabular-nums text-white">
                  ${potentialAnnualExposure.toLocaleString()}
                </div>
                <p className="text-xs text-[#E7EDE5]/80 mt-1.5 leading-relaxed">
                  Calculated at {discrepancyRate.toFixed(1)}% variance across ${annualSpend.toLocaleString()} in annual supplier spending.
                </p>
              </div>

              <div className="pt-6 border-t border-white/15 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#E7EDE5]/80">Potential Monthly Variance:</span>
                  <span className="font-mono tabular-nums font-semibold text-white">
                    ${potentialMonthlyExposure.toLocaleString()} / month
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#E7EDE5]/80">Annual Supplier Purchasing:</span>
                  <span className="font-mono tabular-nums font-semibold text-white">
                    ${annualSpend.toLocaleString()} / year
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/15 flex flex-col sm:flex-row gap-3">
              <button
                onClick={onRequestReview}
                className="flex-1 py-3 px-4 text-xs font-semibold text-[#214B3D] bg-white hover:bg-[#F8F7F3] rounded-md transition-colors text-center cursor-pointer shadow-xs"
              >
                Request a Free Invoice Review
              </button>
              <button
                onClick={onExploreDemo}
                className="py-3 px-4 text-xs font-medium text-white hover:bg-white/10 border border-white/20 rounded-md transition-colors text-center cursor-pointer"
              >
                Explore Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
