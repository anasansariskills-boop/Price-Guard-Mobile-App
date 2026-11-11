import React, { useState, useEffect } from 'react';
import { UserAccount } from '../types/index.ts';

interface NavbarProps {
  currentView: 'landing' | 'demo' | 'dashboard' | 'new-audit';
  currentUser: UserAccount | null;
  onNavigate: (view: 'landing' | 'demo' | 'dashboard' | 'new-audit') => void;
  onTryDemo: () => void;
  onRequestReview: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  currentUser,
  onNavigate,
  onTryDemo,
  onRequestReview,
  onOpenAuth
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Prevent background scrolling when mobile menu drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const handleNavLinkClick = (hash?: string) => {
    setMobileMenuOpen(false);
    if (currentView !== 'landing') {
      onNavigate('landing');
      if (hash) {
        setTimeout(() => {
          const el = document.querySelector(hash);
          el?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F8F7F3]/95 backdrop-blur-md border-b border-[#E1E3DD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 md:h-18 flex items-center justify-between gap-3 sm:gap-6">
        {/* Brand Wordmark */}
        <button
          onClick={() => {
            setMobileMenuOpen(false);
            onNavigate('landing');
          }}
          className="text-lg sm:text-xl font-bold tracking-tight text-[#214B3D] hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 text-left focus:outline-hidden cursor-pointer"
        >
          PriceGuard
        </button>

        {/* Desktop Sales Navigation Links */}
        {currentView === 'landing' ? (
          <nav className="hidden lg:flex items-center gap-7 text-xs font-medium text-[#202923]/80">
            <a href="#problem" className="hover:text-[#214B3D] transition-colors whitespace-nowrap">
              The Problem
            </a>
            <a href="#how-it-works" className="hover:text-[#214B3D] transition-colors whitespace-nowrap">
              How It Works
            </a>
            <a href="#showcase" className="hover:text-[#214B3D] transition-colors whitespace-nowrap">
              Showcase
            </a>
            <button
              onClick={onTryDemo}
              className="hover:text-[#214B3D] transition-colors whitespace-nowrap font-semibold text-[#214B3D] cursor-pointer"
            >
              Interactive Demo
            </button>
            <a href="#benefits" className="hover:text-[#214B3D] transition-colors whitespace-nowrap">
              Benefits
            </a>
          </nav>
        ) : (
          <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-[#202923]/70">
            <button
              onClick={() => onNavigate('landing')}
              className="hover:text-[#214B3D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              ← Back to Product Showcase
            </button>
          </nav>
        )}

        {/* Header Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Mobile Try Demo Button: compact and prominent */}
          <button
            onClick={onTryDemo}
            className="lg:hidden px-3 py-1.5 text-xs font-semibold text-white bg-[#214B3D] hover:bg-[#1A3C31] rounded-md transition-colors whitespace-nowrap shadow-2xs min-h-[36px] flex items-center cursor-pointer"
          >
            Try Demo
          </button>

          {/* Desktop Try Live Demo Button */}
          <button
            onClick={onTryDemo}
            className="hidden lg:inline-flex px-3.5 py-2 text-xs font-semibold text-[#214B3D] bg-white hover:bg-[#F2F5F0] border border-[#214B3D]/30 rounded-md transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
          >
            Try Live Demo
          </button>

          {currentUser && currentUser.id !== 'demo-user' ? (
            <button
              onClick={() => onNavigate('dashboard')}
              className="hidden lg:inline-flex text-xs font-semibold text-[#214B3D] hover:underline cursor-pointer"
            >
              {currentUser.name}
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="hidden lg:inline-flex text-xs text-[#202923]/60 hover:text-[#202923] px-2 py-1 transition-colors cursor-pointer"
            >
              Client Login
            </button>
          )}

          {/* Desktop Request a Review */}
          <button
            onClick={onRequestReview}
            className="hidden lg:inline-flex px-4 py-2 text-xs font-semibold text-white bg-[#214B3D] hover:bg-[#1A3C31] rounded-md transition-colors whitespace-nowrap shadow-xs cursor-pointer"
          >
            Request a Review
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-11 h-11 flex items-center justify-center rounded-md text-[#202923] hover:text-[#214B3D] hover:bg-black/5 transition-colors cursor-pointer"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop & Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-14 bottom-0 z-50 flex flex-col">
          {/* Semi-transparent Backdrop */}
          <div
            className="fixed inset-0 top-14 bg-black/30 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Menu Drawer Content */}
          <div className="relative z-10 bg-white border-b border-[#E1E3DD] shadow-lg px-5 py-5 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            <nav className="flex flex-col space-y-1 text-sm font-medium text-[#202923]">
              <a
                href="#problem"
                onClick={() => handleNavLinkClick('#problem')}
                className="min-h-[44px] flex items-center px-3 rounded-md hover:bg-[#F8F7F3] hover:text-[#214B3D] transition-colors"
              >
                The Problem
              </a>
              <a
                href="#how-it-works"
                onClick={() => handleNavLinkClick('#how-it-works')}
                className="min-h-[44px] flex items-center px-3 rounded-md hover:bg-[#F8F7F3] hover:text-[#214B3D] transition-colors"
              >
                How It Works
              </a>
              <a
                href="#showcase"
                onClick={() => handleNavLinkClick('#showcase')}
                className="min-h-[44px] flex items-center px-3 rounded-md hover:bg-[#F8F7F3] hover:text-[#214B3D] transition-colors"
              >
                Product Showcase
              </a>
              <a
                href="#sample-audit"
                onClick={() => handleNavLinkClick('#sample-audit')}
                className="min-h-[44px] flex items-center px-3 rounded-md hover:bg-[#F8F7F3] hover:text-[#214B3D] transition-colors"
              >
                Interactive Walkthrough
              </a>
              <a
                href="#benefits"
                onClick={() => handleNavLinkClick('#benefits')}
                className="min-h-[44px] flex items-center px-3 rounded-md hover:bg-[#F8F7F3] hover:text-[#214B3D] transition-colors"
              >
                Business Benefits
              </a>

              <div className="pt-3 my-2 border-t border-[#E1E3DD] space-y-2.5">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onTryDemo();
                  }}
                  className="w-full min-h-[44px] px-4 py-2.5 text-sm font-semibold text-white bg-[#214B3D] hover:bg-[#1A3C31] rounded-md transition-colors flex items-center justify-center shadow-xs cursor-pointer"
                >
                  Launch Live Demo Dashboard
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onRequestReview();
                  }}
                  className="w-full min-h-[44px] px-4 py-2.5 text-sm font-medium text-[#202923] bg-[#F8F7F3] hover:bg-[#E7EDE5] border border-[#E1E3DD] rounded-md transition-colors flex items-center justify-center cursor-pointer"
                >
                  Request an Invoice Review
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};
