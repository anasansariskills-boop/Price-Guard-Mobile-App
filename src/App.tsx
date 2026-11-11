import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ProblemSection } from './components/ProblemSection';
import { SolutionWorkflow } from './components/SolutionWorkflow';
import { ProductShowcase } from './components/ProductShowcase';
import { InteractiveSampleAudit } from './components/InteractiveSampleAudit';
import { DetectionGrid } from './components/DetectionGrid';
import { Footer } from './components/Footer';
import { DemoDashboard } from './components/DemoDashboard';
import { PilotRequestModal } from './components/PilotRequestModal';
import { AuthModal } from './components/AuthModal';
import { AuditDashboard } from './components/AuditDashboard';
import { getStoredAuth, logoutAccount } from './services/api';
import { UserAccount } from './types/index.ts';

type AppView = 'landing' | 'demo' | 'dashboard' | 'new-audit';

export function App() {
  // Initialize view from URL path
  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/demo')) return 'demo';
      if (path.startsWith('/workspace') || path.startsWith('/dashboard')) return 'dashboard';
    }
    return 'landing';
  });

  const [demoIndustry, setDemoIndustry] = useState<'restaurant' | 'hotel'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.includes('hotel')) return 'hotel';
    }
    return 'restaurant';
  });

  const [isPilotModalOpen, setIsPilotModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Restore stored session on mount
  useEffect(() => {
    const { user } = getStoredAuth();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/demo')) {
        setCurrentView('demo');
        if (path.includes('hotel')) setDemoIndustry('hotel');
        else setDemoIndustry('restaurant');
      } else if (path.startsWith('/workspace') || path.startsWith('/dashboard')) {
        setCurrentView('dashboard');
      } else {
        setCurrentView('landing');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (view: AppView, industry?: 'restaurant' | 'hotel') => {
    setCurrentView(view);
    let targetPath = '/';

    if (view === 'demo') {
      const targetInd = industry || demoIndustry;
      if (industry) setDemoIndustry(industry);
      targetPath = targetInd === 'hotel' ? '/demo/hotel' : '/demo';
    } else if (view === 'dashboard' || view === 'new-audit') {
      targetPath = '/workspace';
    }

    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDemoIndustryChange = (ind: 'restaurant' | 'hotel') => {
    setDemoIndustry(ind);
    const targetPath = ind === 'hotel' ? '/demo/hotel' : '/demo/restaurant';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  const handleLogout = async () => {
    await logoutAccount();
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-[#F8F7F3] text-[#202923] flex flex-col selection:bg-[#214B3D]/15 selection:text-[#214B3D] overflow-x-hidden w-full max-w-full">
      {/* Top Navigation Bar on Landing & Workspace */}
      {currentView !== 'demo' && (
        <Navbar
          currentView={currentView}
          currentUser={currentUser}
          onNavigate={handleNavigate}
          onTryDemo={() => handleNavigate('demo')}
          onRequestReview={() => setIsPilotModalOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden w-full max-w-full">
        {currentView === 'landing' ? (
          <>
            {/* Section 1: Hero */}
            <HeroSection
              onTryDemo={() => handleNavigate('demo')}
              onRequestReview={() => setIsPilotModalOpen(true)}
            />

            {/* Section 2: The Problem (Small mistakes. Real money.) */}
            <ProblemSection />

            {/* Section 3: How PriceGuard Works (From invoices to answers.) */}
            <SolutionWorkflow />

            {/* Section 4: Product Showcase (See exactly where the numbers don't match.) */}
            <ProductShowcase
              onExploreDemo={() => handleNavigate('demo')}
            />

            {/* Section 5: Interactive Demo Walkthrough (See what PriceGuard finds.) */}
            <InteractiveSampleAudit
              onRequestReview={() => setIsPilotModalOpen(true)}
            />

            {/* Section 6: Business Benefits (More control. Less manual checking.) */}
            <DetectionGrid />

            {/* Section 7: Final Conversion & Minimal Footer */}
            <Footer
              onTryDemo={() => handleNavigate('demo')}
              onRequestReview={() => setIsPilotModalOpen(true)}
            />
          </>
        ) : currentView === 'demo' ? (
          /* Experience B: Full Screen Dedicated Interactive Demo Dashboard */
          <DemoDashboard
            initialIndustry={demoIndustry}
            onNavigateHome={() => handleNavigate('landing')}
            onRequestReview={() => setIsPilotModalOpen(true)}
            onIndustryChange={handleDemoIndustryChange}
          />
        ) : (
          /* Enterprise / Authenticated Workspace */
          <AuditDashboard
            initialMode={currentView}
            currentUser={currentUser}
            onNavigateHome={() => handleNavigate('landing')}
            onRequestPilot={() => setIsPilotModalOpen(true)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Verified Lead Capture Modal */}
      <PilotRequestModal
        isOpen={isPilotModalOpen}
        onClose={() => setIsPilotModalOpen(false)}
      />

      {/* Client Sign In Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          handleNavigate('dashboard');
        }}
      />
    </div>
  );
}

export default App;
