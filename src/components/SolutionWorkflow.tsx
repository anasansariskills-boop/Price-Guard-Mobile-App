import React, { useState } from 'react';

export const SolutionWorkflow: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      step: '01',
      title: 'Agreed supplier prices',
      shortText: 'Your negotiated contract rates and catalogs.',
      previewTitle: 'Agreed Price Schedule',
      previewContent: [
        { label: 'POUL-001 Chicken Breast', value: '$4.00/kg' },
        { label: 'BEEF-105 Ground Chuck 80/20', value: '$6.20/kg' },
        { label: 'OIL-012 Olive Oil 4x5L Case', value: '$72.00/case' }
      ]
    },
    {
      step: '02',
      title: 'Incoming supplier invoices',
      shortText: 'The actual delivery bills sent by vendors.',
      previewTitle: 'Incoming Delivery Invoices',
      previewContent: [
        { label: 'Invoice #8841 (600 kg Chicken)', value: '$4.50/kg' },
        { label: 'Invoice #8910 (100 kg Chuck)', value: '$6.50/kg' },
        { label: 'Invoice #9042 (20 cases Oil)', value: '$84.00/case' }
      ]
    },
    {
      step: '03',
      title: 'Clear findings and evidence',
      shortText: 'Exact mathematical variances ready for review.',
      previewTitle: 'Audit Findings & Evidence',
      previewContent: [
        { label: 'POUL-001 (+$0.50/kg diff)', value: '+$300.00 Overcharge' },
        { label: 'BEEF-105 (+$0.30/kg diff)', value: '+$30.00 Overcharge' },
        { label: 'OIL-012 (+$12.00/case diff)', value: '+$240.00 Overcharge' }
      ]
    }
  ];

  return (
    <section id="how-it-works" className="py-12 md:py-24 border-b border-[#E1E3DD] bg-[#F8F7F3]">
      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        <div className="max-w-2xl mb-8 md:mb-12 text-left">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#BE825B] mb-2">
            How It Works
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#202923] text-balance">
            From invoices to answers.
          </h2>
          <p className="mt-2 text-base text-[#202923]/80">
            A simple three-stage workflow to catch price differences automatically.
          </p>
        </div>

        {/* Mobile View: Connected Vertical Sequence */}
        <div className="md:hidden space-y-4 text-left">
          {steps.map((s, idx) => (
            <div
              key={s.step}
              className="relative bg-white rounded-xl border border-[#E1E3DD] p-4 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#214B3D] text-white text-xs font-mono font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <h3 className="text-sm font-bold text-[#202923]">
                    {s.title}
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#202923]/50">
                  STAGE {s.step}
                </span>
              </div>

              <p className="text-xs text-[#202923]/70 pl-8">
                {s.shortText}
              </p>

              {/* Compact meaningful visual */}
              <div className="ml-8 p-2.5 bg-[#F8F7F3] rounded-lg border border-[#E1E3DD] space-y-1.5 text-[11px]">
                {s.previewContent.slice(0, 2).map((row, rIdx) => (
                  <div key={rIdx} className="flex items-center justify-between gap-2">
                    <span className="text-[#202923]/80 truncate">{row.label}</span>
                    <span className={`font-mono tabular-nums shrink-0 font-medium ${
                      idx === 2 ? 'text-[#A7443E] font-bold' : 'text-[#202923]'
                    }`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Interactive 3-Stage Visual Document Workflow (md and above) */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          {steps.map((s, idx) => {
            const isActive = activeStep === idx;
            return (
              <div
                key={s.step}
                onClick={() => setActiveStep(idx)}
                className={`p-6 rounded-lg border transition-all cursor-pointer text-left flex flex-col justify-between space-y-5 bg-white ${
                  isActive
                    ? 'border-[#214B3D] shadow-xs ring-1 ring-[#214B3D]/10'
                    : 'border-[#E1E3DD] hover:border-[#202923]/30'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#214B3D]">
                      STAGE {s.step}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#214B3D]' : 'bg-[#E1E3DD]'}`} />
                  </div>

                  <h3 className="text-base font-bold text-[#202923]">
                    {s.title}
                  </h3>

                  <p className="text-xs text-[#202923]/70 leading-relaxed">
                    {s.shortText}
                  </p>
                </div>

                {/* Mini Interface Simulation Box */}
                <div className="p-3 bg-[#F8F7F3] rounded-md border border-[#E1E3DD] space-y-2 text-[11px]">
                  <div className="text-[10px] font-semibold text-[#202923]/60 uppercase tracking-wider border-b border-[#E1E3DD] pb-1">
                    {s.previewTitle}
                  </div>
                  {s.previewContent.map((row, rIdx) => (
                    <div key={rIdx} className="flex items-center justify-between gap-2">
                      <span className="text-[#202923]/80 truncate">{row.label}</span>
                      <span className={`font-mono tabular-nums shrink-0 font-medium ${
                        idx === 2 ? 'text-[#A7443E] font-bold' : 'text-[#202923]'
                      }`}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
