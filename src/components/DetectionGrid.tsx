import React from 'react';

export const DetectionGrid: React.FC = () => {
  const benefits = [
    {
      title: 'Spot potential overcharges',
      desc: 'Identify prices that differ from supplier agreements.',
      visual: (
        <div className="p-3 bg-[#F8F7F3] rounded-md border border-[#E1E3DD] space-y-1.5 text-xs text-left">
          <div className="flex items-center justify-between">
            <span className="text-[#202923] font-medium">Billed Price</span>
            <span className="font-mono font-bold text-[#A7443E]">$4.50/kg</span>
          </div>
          <div className="flex items-center justify-between border-t border-[#E1E3DD] pt-1 text-[11px] text-[#202923]/70">
            <span>Agreed Rate</span>
            <span className="font-mono text-[#214B3D]">$4.00/kg</span>
          </div>
        </div>
      )
    },
    {
      title: 'Save time',
      desc: 'Focus on invoices that need attention.',
      visual: (
        <div className="p-3 bg-[#F8F7F3] rounded-md border border-[#E1E3DD] space-y-1.5 text-xs text-left">
          <div className="flex items-center justify-between">
            <span className="text-[#202923]">120 line items</span>
            <span className="text-[#214B3D] font-medium">117 matched</span>
          </div>
          <div className="flex items-center justify-between border-t border-[#E1E3DD] pt-1 text-[11px]">
            <span className="text-[#A7443E] font-semibold">3 need attention</span>
            <span className="text-[#202923]/60">97% manual time saved</span>
          </div>
        </div>
      )
    },
    {
      title: 'Resolve issues with evidence',
      desc: 'Review the supporting numbers before contacting suppliers.',
      visual: (
        <div className="p-3 bg-[#F8F7F3] rounded-md border border-[#E1E3DD] space-y-1.5 text-xs text-left">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#202923] font-mono">Invoice #INV-8841</span>
            <span className="text-[#214B3D] font-mono">Schedule B</span>
          </div>
          <div className="border-t border-[#E1E3DD] pt-1 text-[11px] font-mono text-[#A7443E] font-semibold">
            Proof: ($4.50 - $4.00) x 600 = $300
          </div>
        </div>
      )
    }
  ];

  return (
    <section id="benefits" className="py-12 md:py-24 border-b border-[#E1E3DD] bg-[#F8F7F3]">
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <div className="max-w-2xl mb-8 md:mb-12 text-left">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#BE825B] mb-2">
            Business Benefits
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#202923] text-balance">
            More control. Less manual checking.
          </h2>
          <p className="mt-2 text-base text-[#202923]/80">
            Spend minutes reviewing flagged variances instead of hours checking rows by hand.
          </p>
        </div>

        {/* Mobile View: Compact Editorial Layout with Hairline Separators */}
        <div className="md:hidden bg-white rounded-xl border border-[#E1E3DD] divide-y divide-[#E1E3DD] overflow-hidden text-left shadow-2xs">
          {benefits.map((b) => (
            <div key={b.title} className="p-4 space-y-2.5">
              <div>
                <h3 className="text-sm font-bold text-[#202923]">
                  {b.title}
                </h3>
                <p className="text-xs text-[#202923]/70 mt-0.5 leading-relaxed">
                  {b.desc}
                </p>
              </div>
              <div className="pt-1">
                {b.visual}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: 3 Outcome Visuals (md and above) */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="p-6 rounded-lg border border-[#E1E3DD] bg-white text-left flex flex-col justify-between space-y-5 shadow-xs"
            >
              <div className="space-y-2.5">
                <h3 className="text-base sm:text-lg font-bold text-[#202923]">
                  {b.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#202923]/75 leading-relaxed">
                  {b.desc}
                </p>
              </div>

              <div>
                {b.visual}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
