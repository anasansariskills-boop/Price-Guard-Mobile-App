import React, { useState } from 'react';

interface FooterProps {
  onTryDemo: () => void;
  onRequestReview: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onTryDemo, onRequestReview }) => {
  const [modalType, setModalType] = useState<'privacy' | 'terms' | null>(null);

  return (
    <footer className="bg-[#202923] text-white">
      {/* Final Conversion Section */}
      <div className="max-w-7xl mx-auto px-5 sm:px-6 py-12 md:py-24 border-b border-white/10 text-left">
        <div className="max-w-2xl space-y-4 sm:space-y-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#BE825B]">
            Protect Purchasing Margins
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white text-balance leading-tight">
            You agreed on the price. Make sure you're billed for it.
          </h2>
          <p className="text-sm sm:text-base text-[#E7EDE5]/80 leading-relaxed">
            See how PriceGuard helps your hotel or restaurant review supplier pricing with confidence.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={onTryDemo}
              className="w-full sm:w-auto px-6 py-3.5 text-sm sm:text-xs font-semibold text-[#202923] bg-white hover:bg-[#F8F7F3] rounded-md transition-colors text-center cursor-pointer shadow-xs min-h-[48px] flex items-center justify-center active:scale-[0.99]"
            >
              Try Live Demo
            </button>
            <button
              onClick={onRequestReview}
              className="w-full sm:w-auto py-2.5 sm:px-6 sm:py-3.5 text-xs font-medium text-[#E7EDE5]/85 hover:text-white underline sm:no-underline sm:bg-transparent sm:hover:bg-white/10 sm:border sm:border-white/20 sm:rounded-md transition-colors text-center cursor-pointer min-h-[40px] sm:min-h-[48px] flex items-center justify-center"
            >
              Request an Invoice Review
            </button>
          </div>
        </div>
      </div>

      {/* Minimal Footer */}
      <div className="max-w-7xl mx-auto px-5 sm:px-6 py-6 md:py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#E7EDE5]/60">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white">PriceGuard</span>
          <span>· Independent supplier invoice audit demonstration.</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-5">
          <button
            onClick={() => setModalType('privacy')}
            className="hover:text-white transition-colors cursor-pointer min-h-[36px] flex items-center"
          >
            Privacy Notice
          </button>
          <button
            onClick={() => setModalType('terms')}
            className="hover:text-white transition-colors cursor-pointer min-h-[36px] flex items-center"
          >
            Terms of Demonstration
          </button>
          <button
            onClick={onRequestReview}
            className="hover:text-white transition-colors cursor-pointer text-[#E7EDE5] min-h-[36px] flex items-center"
          >
            Request Review
          </button>
          <span className="min-h-[36px] flex items-center">&copy; {new Date().getFullYear()} PriceGuard. All rights reserved.</span>
        </div>
      </div>

      {/* Lightbox for Privacy and Terms */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white text-[#202923] max-w-lg w-full rounded-lg p-6 space-y-4 max-h-[85vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between border-b border-[#E1E3DD] pb-3">
              <h3 className="text-sm font-bold text-[#202923]">
                {modalType === 'privacy' ? 'Privacy Notice' : 'Terms of Demonstration'}
              </h3>
              <button
                onClick={() => setModalType(null)}
                className="text-xs text-[#202923]/60 hover:text-[#202923] p-1 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="text-xs text-[#202923]/80 space-y-2.5 leading-relaxed">
              {modalType === 'privacy' ? (
                <>
                  <p>
                    PriceGuard is committed to confidentiality. Information submitted through this website is used exclusively to contact you about your invoice review request.
                  </p>
                  <p>
                    <strong>Data Privacy:</strong> We do not sell or share your contact information with suppliers, brokers, or competitors.
                  </p>
                  <p>
                    <strong>Fictional Demonstration:</strong> The public demonstration uses synthetic sample data for illustrative purposes.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    PriceGuard demonstrates supplier invoice auditing methods for hospitality businesses.
                  </p>
                  <p>
                    <strong>Independent Verification:</strong> Identified variances represent mathematical differences between reference prices and billed invoices for internal review.
                  </p>
                  <p>
                    <strong>No Banking Integration:</strong> PriceGuard does not execute payments or alter general ledgers.
                  </p>
                </>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#214B3D] hover:bg-[#1A3C31] rounded-md transition-colors cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
