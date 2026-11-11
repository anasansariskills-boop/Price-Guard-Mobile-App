import React, { useState } from 'react';
import { submitLeadRequest } from '../services/api';
import { LeadSubmission } from '../types';

interface PilotRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PilotRequestModal: React.FC<PilotRequestModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<LeadSubmission>({
    name: '',
    email: '',
    businessName: '',
    businessType: 'Restaurant',
    locationsCount: '1',
    estimatedMonthlySpend: '$25,000 to $75,000',
    reviewMethod: 'Finance verifies invoice totals only',
    message: ''
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [submittedLeadId, setSubmittedLeadId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    const res = await submitLeadRequest(formData);
    setLoading(false);

    if (res.success && res.leadId) {
      setSubmittedLeadId(res.leadId);
    } else {
      setErrorMessage(res.error || 'Unable to submit request. Please try again.');
    }
  };

  const handleResetAndClose = () => {
    setSubmittedLeadId(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleResetAndClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pilot-modal-title"
    >
      <div className="bg-white max-w-lg w-full rounded-t-2xl sm:rounded-lg border-t sm:border border-[#E1E3DD] shadow-2xl p-5 sm:p-7 space-y-4 sm:space-y-5 max-h-[88vh] overflow-y-auto">
        {/* Mobile Drag Indicator Handle */}
        <div className="w-10 h-1 bg-[#202923]/20 rounded-full mx-auto mb-1 sm:hidden" aria-hidden="true" />

        <div className="flex items-center justify-between border-b border-[#E1E3DD] pb-3">
          <div>
            <h3 id="pilot-modal-title" className="text-base font-bold text-[#202923]">Request a Free Invoice Review</h3>
            <p className="text-xs text-[#202923]/70 mt-0.5">Share 2 or 3 sample invoices alongside your agreed price list</p>
          </div>
          <button
            onClick={handleResetAndClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-end text-xs font-medium text-[#202923]/70 hover:text-[#202923] cursor-pointer touch-manipulation"
            aria-label="Close dialog"
          >
            Close
          </button>
        </div>

        {submittedLeadId ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#F2F5F0] border border-[#214B3D]/30 flex items-center justify-center text-[#214B3D] font-bold text-lg">
              ✓
            </div>
            <h4 className="text-base font-bold text-[#202923]">Review Request Received</h4>
            <p className="text-xs text-[#202923]/80 leading-relaxed max-w-sm mx-auto">
              Thank you for contacting PriceGuard. We received your request for <strong>{formData.businessName}</strong>. Our team will review your requirements and reach out within 1 business day with your secure document upload link.
            </p>
            <div className="p-3 bg-[#F8F7F3] rounded-md border border-[#E1E3DD] text-[11px] font-mono text-[#202923]/70">
              Reference Code: {submittedLeadId}
            </div>
            <div className="pt-2">
              <button
                onClick={handleResetAndClose}
                className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 text-xs font-semibold text-white bg-[#214B3D] hover:bg-[#1A3C31] rounded-md transition-colors cursor-pointer shadow-xs touch-manipulation"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-[#FBF1F0] text-[#A7443E] rounded-md border border-[#A7443E]/20 text-xs">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-medium text-[#202923] mb-1">Your Full Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full min-h-[44px] p-2.5 bg-[#F8F7F3] border border-[#E1E3DD] rounded-md text-[#202923] text-base sm:text-xs focus:border-[#214B3D] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#202923] mb-1">Work Email *</label>
                <input
                  required
                  type="email"
                  placeholder="s.jenkins@hotelgroup.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full min-h-[44px] p-2.5 bg-[#F8F7F3] border border-[#E1E3DD] rounded-md text-[#202923] text-base sm:text-xs focus:border-[#214B3D] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-medium text-[#202923] mb-1">Business Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. The Brass Palm Group"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full min-h-[44px] p-2.5 bg-[#F8F7F3] border border-[#E1E3DD] rounded-md text-[#202923] text-base sm:text-xs focus:border-[#214B3D] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#202923] mb-1">Business Sector</label>
                <select
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value as any })}
                  className="w-full min-h-[44px] p-2.5 bg-[#F8F7F3] border border-[#E1E3DD] rounded-md text-[#202923] text-base sm:text-xs focus:border-[#214B3D] focus:outline-hidden cursor-pointer"
                >
                  <option value="Restaurant">Restaurant or Culinary Group</option>
                  <option value="Hotel">Hotel or Lodging Property</option>
                  <option value="Hospitality Group">Multi-Property Hospitality Group</option>
                  <option value="Catering">Catering or Foodservice</option>
                  <option value="Other">Other Business</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-medium text-[#202923] mb-1">Number of Locations</label>
                <select
                  value={formData.locationsCount}
                  onChange={(e) => setFormData({ ...formData, locationsCount: e.target.value })}
                  className="w-full min-h-[44px] p-2.5 bg-[#F8F7F3] border border-[#E1E3DD] rounded-md text-[#202923] text-base sm:text-xs focus:border-[#214B3D] focus:outline-hidden cursor-pointer"
                >
                  <option value="1">1 Location</option>
                  <option value="2-4">2 to 4 Locations</option>
                  <option value="5-10">5 to 10 Locations</option>
                  <option value="11+">11+ Locations</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#202923] mb-1">Estimated Monthly Purchasing</label>
                <select
                  value={formData.estimatedMonthlySpend}
                  onChange={(e) => setFormData({ ...formData, estimatedMonthlySpend: e.target.value })}
                  className="w-full min-h-[44px] p-2.5 bg-[#F8F7F3] border border-[#E1E3DD] rounded-md text-[#202923] text-base sm:text-xs focus:border-[#214B3D] focus:outline-hidden cursor-pointer"
                >
                  <option value="Under $25,000">Under $25,000 / month</option>
                  <option value="$25,000 to $75,000">$25,000 to $75,000 / month</option>
                  <option value="$75,000 to $150,000">$75,000 to $150,000 / month</option>
                  <option value="Over $150,000">Over $150,000 / month</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#202923] mb-1">
                How do you currently review supplier invoice prices?
              </label>
              <select
                value={formData.reviewMethod}
                onChange={(e) => setFormData({ ...formData, reviewMethod: e.target.value })}
                className="w-full min-h-[44px] p-2.5 bg-[#F8F7F3] border border-[#E1E3DD] rounded-md text-[#202923] text-base sm:text-xs focus:border-[#214B3D] focus:outline-hidden cursor-pointer"
              >
                <option value="Finance verifies invoice totals only">Finance verifies invoice totals and payment details only</option>
                <option value="Manual spot checking by managers">Managers manually spot-check occasional line items</option>
                <option value="Kitchen or receiving staff checks counts only">Kitchen or receiving staff checks physical goods only</option>
                <option value="We do not regularly verify line items">We do not currently verify line item contract prices</option>
                <option value="Other">Other method</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#202923] mb-1">Optional Message</label>
              <textarea
                rows={2}
                placeholder="Specific suppliers, categories, or questions you would like addressed..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full p-2.5 bg-[#F8F7F3] border border-[#E1E3DD] rounded-md text-[#202923] text-base sm:text-xs focus:border-[#214B3D] focus:outline-hidden resize-none"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#E1E3DD]">
              <span className="text-[11px] text-[#202923]/60 leading-tight">
                Confidential. No banking or accounting passwords required.
              </span>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 text-sm sm:text-xs font-semibold text-white bg-[#214B3D] hover:bg-[#1A3C31] disabled:opacity-50 rounded-md transition-colors cursor-pointer shadow-xs whitespace-nowrap flex items-center justify-center touch-manipulation"
              >
                {loading ? 'Submitting...' : 'Request Free Invoice Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
