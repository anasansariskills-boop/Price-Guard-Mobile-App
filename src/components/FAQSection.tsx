import React, { useState } from 'react';

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What documents do I need to run an audit?',
      a: 'You need two items: your agreed supplier price schedule (available as a CSV, Excel sheet, or contract PDF) and the supplier invoices you wish to verify (in PDF or image format).'
    },
    {
      q: 'Can I use this if my invoices are PDFs or scanned delivery slips?',
      a: 'Yes. For digital PDFs, PriceGuard parses the embedded text directly. For scanned delivery receipts or image files, the built-in vision pipeline extracts the invoice numbers, lines, quantities, and prices.'
    },
    {
      q: 'Does PriceGuard require access to my accounting or banking software?',
      a: 'No. PriceGuard is designed as an independent supplier audit tool. It does not require banking credentials, credit card access, or direct connections to your general ledger.'
    },
    {
      q: 'Does the system automatically contact my suppliers or deduct funds?',
      a: 'Never. You maintain complete control over vendor communications. For verified discrepancies, PriceGuard prepares a polite, editable email draft containing exact line evidence for your team to review and send.'
    },
    {
      q: 'How accurate are the price calculations?',
      a: 'All price variances and financial calculations are computed with deterministic mathematical rules, not probabilistic guesses. If an item or pack conversion is uncertain, it is flagged as Needs Review rather than presented as a confirmed overcharge.'
    },
    {
      q: 'What happens if the system cannot match an invoice item?',
      a: 'Unmatched items (such as one-off spot purchases or newly introduced seasonal specials) are grouped in an Unmatched list. You can review them, confirm the applicable product code, or dismiss them without affecting other calculations.'
    },
    {
      q: 'Are our confidential price agreements kept private?',
      a: 'Yes. Uploaded documents and price lists are isolated to your workspace and protected with authenticated access. Your negotiated rates are never shared with suppliers or competitors.'
    }
  ];

  return (
    <section id="faq" className="py-20 border-b border-[#E1E3DD] bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <div className="max-w-xl mb-12">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#BE825B] mb-2">
            Clear Answers
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202923] text-balance">
            Frequently asked questions.
          </h2>
          <p className="mt-2 text-sm text-[#202923]/70">
            Plain language answers to common procurement, privacy, and verification questions.
          </p>
        </div>

        <div className="divide-y divide-[#E1E3DD] border-t border-b border-[#E1E3DD]">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={faq.q} className="py-5">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left gap-4 font-semibold text-sm sm:text-base text-[#202923] hover:text-[#214B3D] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className="font-mono text-xs text-[#202923]/50 shrink-0">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <p className="mt-3 text-xs sm:text-sm text-[#202923]/75 leading-relaxed pr-6">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
