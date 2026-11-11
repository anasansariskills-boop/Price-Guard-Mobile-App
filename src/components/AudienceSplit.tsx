import React from 'react';

export const AudienceSplit: React.FC = () => {
  return (
    <section id="audiences" className="py-20 border-b border-[#E1E3DD] bg-[#F8F7F3]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mb-14">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#BE825B] mb-2">
            Tailored For Hospitality
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#202923] text-balance">
            Designed for the realities of hospitality purchasing.
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#202923]/80 leading-relaxed">
            Whether your operations center on kitchen ingredients or full-property guest amenities, PriceGuard adapts to your purchasing profile.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* For Restaurant Groups */}
          <div className="border border-[#E1E3DD] rounded-lg overflow-hidden bg-white flex flex-col justify-between shadow-xs">
            <div className="p-8 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#214B3D]">
                  For Restaurant Groups
                </span>
                <span className="text-xs text-[#202923]/60">
                  F&B and Culinary Procurement
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-[#202923]">
                Keep a closer eye on every ingredient cost.
              </h3>

              <p className="text-sm text-[#202923]/80 leading-relaxed">
                Restaurant groups purchase ingredients and operating supplies frequently, and prices can differ across suppliers, invoices, and locations. PriceGuard helps finance and procurement teams review those differences without slowing down kitchen operations.
              </p>

              <div className="space-y-2 pt-2 border-t border-[#E1E3DD] text-xs">
                <div className="font-semibold text-[#202923]">Key areas monitored:</div>
                <div className="grid grid-cols-2 gap-2 text-[#202923]/70">
                  <div>· Fresh poultry and meat cuts</div>
                  <div>· Daily dairy and cheese blocks</div>
                  <div>· Pantry oils and dry goods</div>
                  <div>· Specialty imported ingredients</div>
                </div>
              </div>
            </div>

            <div className="p-5 bg-[#F8F7F3] border-t border-[#E1E3DD] text-xs text-[#202923]/70 font-medium">
              Ideal for independent restaurant groups, multi-unit concepts, and culinary operators.
            </div>
          </div>

          {/* For Hotels */}
          <div className="border border-[#E1E3DD] rounded-lg overflow-hidden bg-white flex flex-col justify-between shadow-xs">
            <div className="p-8 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#214B3D]">
                  For Hotels & Lodging
                </span>
                <span className="text-xs text-[#202923]/60">
                  Multi-Department Operations
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-[#202923]">
                See where everyday purchasing costs may be slipping through.
              </h3>

              <p className="text-sm text-[#202923]/80 leading-relaxed">
                Hotels purchase food, beverages, linen, cleaning materials, and guest supplies from multiple suppliers. PriceGuard can help identify pricing discrepancies without requiring a complete replacement of hotel accounting systems.
              </p>

              <div className="space-y-2 pt-2 border-t border-[#E1E3DD] text-xs">
                <div className="font-semibold text-[#202923]">Key areas monitored:</div>
                <div className="grid grid-cols-2 gap-2 text-[#202923]/70">
                  <div>· 300TC percale sheets and duvet covers</div>
                  <div>· Commercial bath towel bundles</div>
                  <div>· Housekeeping sanitizers and drum cleaners</div>
                  <div>· Banquet and room-service food orders</div>
                </div>
              </div>
            </div>

            <div className="p-5 bg-[#F8F7F3] border-t border-[#E1E3DD] text-xs text-[#202923]/70 font-medium">
              Ideal for boutique hotels, hotel groups, and hospitality asset management companies.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
