import React, { useState } from 'react';
import { SAMPLE_RESTAURANT_AUDIT, SAMPLE_HOTEL_AUDIT } from '../fixtures/sampleAudits';
import { DiscrepancyFinding } from '../types';
import { generateSupplierEmailDraft } from '../utils/auditEngine';

interface InteractiveSampleAuditProps {
  onRequestReview: () => void;
}

export const InteractiveSampleAudit: React.FC<InteractiveSampleAuditProps> = ({ onRequestReview }) => {
  const [selectedIndustry, setSelectedIndustry] = useState<'restaurant' | 'hotel'>('restaurant');
  const [currentFindingIndex, setCurrentFindingIndex] = useState<number>(0);
  const [showFullTable, setShowFullTable] = useState<boolean>(false);
  const [activeEvidenceFinding, setActiveEvidenceFinding] = useState<DiscrepancyFinding | null>(null);
  const [activeEmailFinding, setActiveEmailFinding] = useState<DiscrepancyFinding | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);

  const currentAudit = selectedIndustry === 'restaurant' ? SAMPLE_RESTAURANT_AUDIT : SAMPLE_HOTEL_AUDIT;

  // Filter to significant actionable discrepancies for the progressive walkthrough
  const overchargeFindings = currentAudit.findings.filter(f => f.potentialOvercharge > 0 && f.findingType !== 'duplicate_invoice');
  const activeFinding = overchargeFindings[currentFindingIndex] || currentAudit.findings[0];

  const handleNextFinding = () => {
    setCurrentFindingIndex((prev) => (prev + 1) % overchargeFindings.length);
  };

  const handlePrevFinding = () => {
    setCurrentFindingIndex((prev) => (prev - 1 + overchargeFindings.length) % overchargeFindings.length);
  };

  const handleCopyEmail = (body: string) => {
    navigator.clipboard.writeText(body);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2200);
  };

  const handleDownloadSampleCsv = () => {
    const headers = ['Invoice Number', 'Supplier', 'Invoice Item', 'Agreed SKU', 'Contract Name', 'Agreed Rate', 'Billed Rate', 'Quantity', 'Unit', 'Unit Difference', 'Potential Overcharge', 'Finding Type', 'Calculation'];
    const rows = currentAudit.findings.map(f => [
      f.invoiceNumber,
      `"${f.supplierName}"`,
      `"${f.invoiceItem.rawDescription}"`,
      f.matchedAgreedProduct?.sku || 'N/A',
      `"${f.matchedAgreedProduct?.name || 'Unmatched'}"`,
      f.agreedPrice.toFixed(2),
      f.invoicedPrice.toFixed(2),
      f.quantity,
      f.invoiceItem.unit,
      f.unitPriceDiff.toFixed(2),
      f.potentialOvercharge.toFixed(2),
      f.findingType,
      `"${f.evidence.calculationExplanation.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PriceGuard_Sample_Audit_${selectedIndustry}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section id="sample-audit" className="py-16 md:py-24 border-b border-[#E1E3DD] bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 text-left">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#BE825B] mb-2">
              Interactive Demonstration
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#202923] text-balance">
              See what PriceGuard finds.
            </h2>
            <p className="mt-2 text-base text-[#202923]/80">
              Explore an audit result using progressive steps. All numbers use real deterministic calculations.
            </p>
          </div>

          {/* Industry Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F8F7F3] rounded-md border border-[#E1E3DD] shadow-2xs self-start md:self-end">
            <button
              onClick={() => {
                setSelectedIndustry('restaurant');
                setCurrentFindingIndex(0);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors cursor-pointer ${
                selectedIndustry === 'restaurant'
                  ? 'bg-white text-[#214B3D] font-semibold shadow-xs'
                  : 'text-[#202923]/70 hover:text-[#202923]'
              }`}
            >
              Restaurant example (F&B)
            </button>
            <button
              onClick={() => {
                setSelectedIndustry('hotel');
                setCurrentFindingIndex(0);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors cursor-pointer ${
                selectedIndustry === 'hotel'
                  ? 'bg-white text-[#214B3D] font-semibold shadow-xs'
                  : 'text-[#202923]/70 hover:text-[#202923]'
              }`}
            >
              Hotel example (Linen & Supplies)
            </button>
          </div>
        </div>

        {/* Reassuring Notice */}
        <div className="text-xs text-[#202923]/60 mb-6 flex items-center justify-between">
          <span>Interactive demonstration using fictional sample data.</span>
          <span className="font-medium text-[#214B3D]">
            We found {overchargeFindings.length} items worth reviewing
          </span>
        </div>

        {/* Progressive Spotlight Card (The Core Finding) */}
        {activeFinding && (
          <div className="bg-[#F8F7F3] rounded-lg border border-[#E1E3DD] p-6 sm:p-8 shadow-xs text-left space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E1E3DD] pb-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#BE825B] block mb-1">
                  Discrepancy {currentFindingIndex + 1} of {overchargeFindings.length}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-[#202923]">
                  {activeFinding.invoiceItem.rawDescription}
                </h3>
                <div className="text-xs text-[#202923]/60 mt-0.5">
                  Invoice #{activeFinding.invoiceNumber} · {activeFinding.supplierName}
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-xs text-[#202923]/60 uppercase tracking-wider">Potential Difference</div>
                <div className="text-2xl sm:text-3xl font-mono font-bold text-[#A7443E]">
                  +${activeFinding.potentialOvercharge.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Document Comparison Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-md border border-[#E1E3DD] space-y-2">
                <div className="text-[11px] font-semibold text-[#202923]/60 uppercase tracking-wider">
                  Agreed Price List
                </div>
                <div className="text-sm font-medium text-[#202923]">
                  {activeFinding.matchedAgreedProduct?.name || 'Contract Item'}
                </div>
                <div className="pt-2 border-t border-[#E1E3DD] flex items-baseline justify-between text-xs">
                  <span className="text-[#202923]/60">Contract rate:</span>
                  <span className="font-mono font-semibold text-[#214B3D] text-sm">
                    ${activeFinding.agreedPrice.toFixed(2)} / {activeFinding.invoiceItem.unit.toLowerCase()}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-[#FBF1F0]/50 rounded-md border border-[#A7443E]/30 space-y-2">
                <div className="text-[11px] font-semibold text-[#A7443E] uppercase tracking-wider">
                  Supplier Invoice
                </div>
                <div className="text-sm font-medium text-[#202923]">
                  Billed: {activeFinding.quantity} {activeFinding.invoiceItem.unit}
                </div>
                <div className="pt-2 border-t border-[#A7443E]/20 flex items-baseline justify-between text-xs">
                  <span className="text-[#202923]/60">Charged rate:</span>
                  <span className="font-mono font-bold text-[#A7443E] text-sm">
                    ${activeFinding.invoicedPrice.toFixed(2)} / {activeFinding.invoiceItem.unit.toLowerCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Difference Calculation Explanation */}
            <div className="p-4 bg-white rounded-md border border-[#E1E3DD] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-[#202923]/80">
                <strong>Calculation: </strong>
                (${activeFinding.invoicedPrice.toFixed(2)} billed - ${activeFinding.agreedPrice.toFixed(2)} agreed) x {activeFinding.quantity} {activeFinding.invoiceItem.unit} = ${activeFinding.potentialOvercharge.toFixed(2)}
              </div>
              <span className="text-[11px] font-mono text-[#A7443E] font-semibold">
                +${activeFinding.unitPriceDiff.toFixed(2)}/{activeFinding.invoiceItem.unit.toLowerCase()} discrepancy
              </span>
            </div>

            {/* Interactive Step Actions */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveEvidenceFinding(activeFinding)}
                  className="px-3 py-2 text-xs font-medium text-[#202923] bg-white hover:bg-[#E7EDE5] border border-[#E1E3DD] rounded-md transition-colors cursor-pointer shadow-2xs"
                >
                  View the Difference
                </button>
                <button
                  onClick={() => setActiveEmailFinding(activeFinding)}
                  className="px-3 py-2 text-xs font-medium text-[#214B3D] bg-white hover:bg-[#F2F5F0] border border-[#214B3D]/30 rounded-md transition-colors cursor-pointer shadow-2xs"
                >
                  Draft Supplier Email
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevFinding}
                  className="px-3 py-2 text-xs font-medium text-[#202923] bg-white hover:bg-[#F2F5F0] border border-[#E1E3DD] rounded-md transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <button
                  onClick={handleNextFinding}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#214B3D] hover:bg-[#1A3C31] rounded-md transition-colors cursor-pointer shadow-xs"
                >
                  Next Finding →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Optional Control to Expand All Findings */}
        <div className="mt-6 flex items-center justify-between text-xs">
          <button
            onClick={() => setShowFullTable(!showFullTable)}
            className="text-xs font-semibold text-[#214B3D] hover:underline cursor-pointer"
          >
            {showFullTable ? 'Hide detailed findings table' : `View all ${currentAudit.findings.length} findings`}
          </button>

          <button
            onClick={handleDownloadSampleCsv}
            className="text-xs text-[#202923]/70 hover:text-[#202923] underline cursor-pointer"
          >
            Download sample audit CSV
          </button>
        </div>

        {/* Expanded Full Findings Table on Desktop / Mobile Finding Rows on Phone */}
        {showFullTable && (
          <div className="mt-4">
            {/* Mobile Finding Cards (md:hidden) */}
            <div className="md:hidden space-y-2.5">
              {currentAudit.findings.map((f) => {
                const isOver = f.potentialOvercharge > 0 && f.findingType !== 'duplicate_invoice';
                const isDup = f.findingType === 'duplicate_invoice';

                return (
                  <div
                    key={f.id}
                    onClick={() => {
                      const foundIdx = overchargeFindings.findIndex(item => item.id === f.id);
                      if (foundIdx >= 0) setCurrentFindingIndex(foundIdx);
                      setActiveEvidenceFinding(f);
                    }}
                    className="p-3.5 bg-white rounded-lg border border-[#E1E3DD] shadow-2xs space-y-2 cursor-pointer active:bg-[#F8F7F3] transition-colors text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-xs text-[#202923]">
                          {f.invoiceItem.rawDescription}
                        </div>
                        <div className="text-[11px] text-[#202923]/60">
                          Inv #{f.invoiceNumber} · {f.supplierName}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {isOver ? (
                          <span className="font-mono font-bold text-xs text-[#A7443E]">
                            +${f.potentialOvercharge.toFixed(2)}
                          </span>
                        ) : isDup ? (
                          <span className="font-mono font-bold text-xs text-[#BE825B]">
                            +${f.potentialOvercharge.toFixed(2)} (dup)
                          </span>
                        ) : (
                          <span className="text-xs text-[#202923]/60">$0.00</span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E1E3DD] flex items-center justify-between text-[11px] text-[#202923]/70">
                      <span>
                        Contract: <strong>{f.matchedAgreedProduct?.name ? `$${f.agreedPrice.toFixed(2)}` : 'Unmatched'}</strong>
                      </span>
                      <span className="text-[#214B3D] font-medium flex items-center gap-1">
                        Inspect Evidence →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (hidden md:block) */}
            <div className="hidden md:block border border-[#E1E3DD] rounded-lg overflow-hidden bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8F7F3] border-b border-[#E1E3DD] text-[#202923]/70 font-semibold">
                      <th className="py-3 px-4">Invoice Line</th>
                      <th className="py-3 px-4">Contract Product</th>
                      <th className="py-3 px-4 text-right">Agreed</th>
                      <th className="py-3 px-4 text-right">Billed</th>
                      <th className="py-3 px-4 text-right">Qty</th>
                      <th className="py-3 px-4 text-right">Discrepancy</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E1E3DD]">
                    {currentAudit.findings.map((f) => {
                      const isOver = f.potentialOvercharge > 0 && f.findingType !== 'duplicate_invoice';
                      const isDup = f.findingType === 'duplicate_invoice';

                      return (
                        <tr key={f.id} className="hover:bg-[#F8F7F3]/50">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#202923]">{f.invoiceItem.rawDescription}</div>
                            <div className="text-[11px] text-[#202923]/60">Inv #{f.invoiceNumber}</div>
                          </td>
                          <td className="py-3 px-4 text-[#202923]">
                            {f.matchedAgreedProduct?.name || (isDup ? 'Duplicate Invoice' : 'Unmatched Item')}
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            {f.agreedPrice > 0 ? `$${f.agreedPrice.toFixed(2)}` : 'None'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-[#202923]">
                            ${f.invoicedPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            {f.quantity} {f.invoiceItem.unit}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            {isOver ? (
                              <span className="text-[#A7443E]">+${f.potentialOvercharge.toFixed(2)}</span>
                            ) : isDup ? (
                              <span className="text-[#BE825B]">+${f.potentialOvercharge.toFixed(2)} (dup)</span>
                            ) : (
                              <span className="text-[#202923]/60">$0.00</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                const foundIdx = overchargeFindings.findIndex(item => item.id === f.id);
                                if (foundIdx >= 0) setCurrentFindingIndex(foundIdx);
                                setActiveEvidenceFinding(f);
                              }}
                              className="px-2 py-1 text-[11px] font-medium text-[#202923] bg-[#F8F7F3] hover:bg-[#E7EDE5] border border-[#E1E3DD] rounded-sm cursor-pointer"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Immediate Post-Demo Conversion Prompt */}
        <div className="mt-10 sm:mt-12 p-5 sm:p-8 bg-[#F8F7F3] rounded-xl border border-[#E1E3DD] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-6 text-left">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-[#202923]">
              Want to check your own supplier costs?
            </h3>
            <p className="text-xs sm:text-sm text-[#202923]/70">
              Send us 2 or 3 sample invoices alongside your agreed price list for a complimentary review.
            </p>
          </div>
          <button
            onClick={onRequestReview}
            className="w-full sm:w-auto px-6 py-3 text-xs sm:text-sm font-semibold text-white bg-[#214B3D] hover:bg-[#1A3C31] rounded-md transition-colors whitespace-nowrap cursor-pointer shadow-xs min-h-[44px] flex items-center justify-center"
          >
            Request an Invoice Review
          </button>
        </div>
      </div>

      {/* Evidence Bottom Sheet / Modal */}
      {activeEvidenceFinding && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-lg border border-[#E1E3DD] shadow-xl p-5 sm:p-6 space-y-4 text-left max-h-[85vh] overflow-y-auto">
            {/* Grab handle for touch affordance on mobile */}
            <div className="sm:hidden w-10 h-1 bg-[#E1E3DD] rounded-full mx-auto -mt-1 mb-2" />

            <div className="flex items-center justify-between border-b border-[#E1E3DD] pb-3">
              <h4 className="text-sm font-bold text-[#202923]">Discrepancy Calculation & Evidence</h4>
              <button
                onClick={() => setActiveEvidenceFinding(null)}
                className="w-8 h-8 flex items-center justify-center text-[#202923]/60 hover:text-[#202923] rounded-md hover:bg-black/5 cursor-pointer text-sm"
                aria-label="Close evidence panel"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#202923]/50 block mb-1">Source Document</span>
                <div className="p-2.5 bg-[#F8F7F3] rounded-sm border border-[#E1E3DD] text-[#202923]">
                  {activeEvidenceFinding.evidence.sourceDocument}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#202923]/50 block mb-1">Invoiced Line Reference</span>
                <div className="p-2.5 bg-[#F8F7F3] rounded-sm border border-[#E1E3DD] text-[#202923]">
                  {activeEvidenceFinding.evidence.sourceLineRef}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#202923]/50 block mb-1">Contract Record Reference</span>
                <div className="p-2.5 bg-[#F8F7F3] rounded-sm border border-[#E1E3DD] text-[#202923]">
                  {activeEvidenceFinding.evidence.agreedRecordRef}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#202923]/50 block mb-1">Calculation Method</span>
                <div className="p-2.5 bg-[#F2F5F0] rounded-sm border border-[#E1E3DD] text-[#214B3D] font-mono">
                  {activeEvidenceFinding.evidence.calculationExplanation}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveEvidenceFinding(null)}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-[#202923] bg-[#F8F7F3] hover:bg-[#E7EDE5] rounded-md transition-colors cursor-pointer min-h-[44px] flex items-center justify-center"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Correction Email Modal */}
      {activeEmailFinding && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-xl rounded-t-2xl sm:rounded-lg border border-[#E1E3DD] shadow-xl p-5 sm:p-6 space-y-4 text-left max-h-[90vh] overflow-y-auto">
            <div className="sm:hidden w-10 h-1 bg-[#E1E3DD] rounded-full mx-auto -mt-1 mb-2" />

            <div className="flex items-center justify-between border-b border-[#E1E3DD] pb-3">
              <div>
                <h4 className="text-sm font-bold text-[#202923]">Polite Supplier Correction Request</h4>
                <p className="text-[11px] text-[#202923]/60 mt-0.5">Factual draft prepared for your accounts payable team</p>
              </div>
              <button
                onClick={() => setActiveEmailFinding(null)}
                className="w-8 h-8 flex items-center justify-center text-[#202923]/60 hover:text-[#202923] rounded-md hover:bg-black/5 cursor-pointer text-sm"
                aria-label="Close email modal"
              >
                ✕
              </button>
            </div>

            {(() => {
              const draft = generateSupplierEmailDraft(activeEmailFinding);
              return (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[#202923]/50 block mb-1">Subject</label>
                    <input
                      readOnly
                      value={draft.subject}
                      className="w-full p-2 bg-[#F8F7F3] border border-[#E1E3DD] rounded-sm text-[#202923] font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-[#202923]/50 block mb-1">Email Body</label>
                    <textarea
                      readOnly
                      rows={8}
                      value={draft.body}
                      className="w-full p-3 bg-[#F8F7F3] border border-[#E1E3DD] rounded-sm text-[#202923] leading-relaxed resize-none font-mono text-[11px]"
                    />
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-[11px] text-[#202923]/60">
                      PriceGuard does not contact suppliers automatically.
                    </span>

                    <button
                      onClick={() => handleCopyEmail(draft.body)}
                      className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-white bg-[#214B3D] hover:bg-[#1A3C31] rounded-md transition-colors cursor-pointer shadow-xs min-h-[44px] flex items-center justify-center"
                    >
                      {copiedEmail ? 'Copied to Clipboard!' : 'Copy Email Draft'}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </section>
  );
};
