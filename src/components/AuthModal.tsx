import React, { useState } from 'react';
import { registerAccount, loginAccount } from '../services/api';
import { UserAccount } from '../types/index.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserAccount) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Restaurant');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'register') {
      const res = await registerAccount({
        email,
        password,
        name,
        businessName: businessName || 'Hospitality Business',
        businessType
      });
      setLoading(false);
      if (res.success && res.user) {
        onSuccess(res.user);
        onClose();
      } else {
        setError(res.error || 'Failed to create account.');
      }
    } else {
      const res = await loginAccount({ email, password });
      setLoading(false);
      if (res.success && res.user) {
        onSuccess(res.user);
        onClose();
      } else {
        setError(res.error || 'Invalid email or password.');
      }
    }
  };

  const handleDemoLogin = () => {
    const demoUser: UserAccount = {
      id: 'demo-user',
      email: 'demo@priceguard.audit',
      name: 'Hospitality Procurement Demo',
      businessName: 'The Brass Palm Hospitality Group',
      businessType: 'Restaurant',
      createdAt: new Date().toISOString()
    };
    onSuccess(demoUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-lg border border-[#E1E3DD] shadow-xl p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between border-b border-[#E1E3DD] pb-3">
          <div>
            <h3 className="text-base font-bold text-[#202923]">
              {mode === 'register' ? 'Create Your Account' : 'Sign In to PriceGuard'}
            </h3>
            <p className="text-xs text-[#202923]/60 mt-0.5">
              Secure, private supplier invoice auditing workspace
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-[#202923]/60 hover:text-[#202923] p-1 cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border border-[#E1E3DD] rounded-md p-1 bg-[#F8F7F3] text-xs">
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-1.5 font-medium rounded-sm transition-colors cursor-pointer ${
              mode === 'register' ? 'bg-white text-[#214B3D] font-semibold shadow-xs' : 'text-[#202923]/70'
            }`}
          >
            New Account
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-1.5 font-medium rounded-sm transition-colors cursor-pointer ${
              mode === 'login' ? 'bg-white text-[#214B3D] font-semibold shadow-xs' : 'text-[#202923]/70'
            }`}
          >
            Existing Sign In
          </button>
        </div>

        {error && (
          <div className="p-3 bg-[#FBF1F0] text-[#A7443E] rounded-md border border-[#A7443E]/20 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {mode === 'register' && (
            <>
              <div>
                <label className="block font-medium text-[#202923] mb-1">Your Full Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g., David Miller"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-[#F8F7F3] border border-[#E1E3DD] rounded-md text-[#202923] focus:border-[#214B3D] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-medium text-[#202923] mb-1">Business / Property Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g., Grandview Hotel & Suites"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full p-2.5 bg-[#F8F7F3] border border-[#E1E3DD] rounded-md text-[#202923] focus:border-[#214B3D] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-medium text-[#202923] mb-1">Sector</label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full p-2.5 bg-[#F8F7F3] border border-[#E1E3DD] rounded-md text-[#202923] focus:border-[#214B3D] focus:outline-hidden cursor-pointer"
                >
                  <option value="Restaurant">Restaurant or Culinary Group</option>
                  <option value="Hotel">Hotel or Resort Property</option>
                  <option value="Catering">Catering / Foodservice</option>
                  <option value="Other">Hospitality Management</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block font-medium text-[#202923] mb-1">Work Email Address *</label>
            <input
              required
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 bg-[#F8F7F3] border border-[#E1E3DD] rounded-md text-[#202923] focus:border-[#214B3D] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-medium text-[#202923] mb-1">Password *</label>
            <input
              required
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 bg-[#F8F7F3] border border-[#E1E3DD] rounded-md text-[#202923] focus:border-[#214B3D] focus:outline-hidden"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-xs font-semibold text-white bg-[#214B3D] hover:bg-[#1A3C31] disabled:opacity-50 rounded-md transition-colors cursor-pointer shadow-xs"
            >
              {loading ? 'Processing...' : mode === 'register' ? 'Create Workspace Account' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="pt-2 border-t border-[#E1E3DD] text-center space-y-2 text-xs">
          <span className="text-[#202923]/60 block text-[11px]">
            Want to test immediately without registering?
          </span>
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-2 text-xs font-medium text-[#202923] bg-[#F8F7F3] hover:bg-[#E7EDE5] border border-[#E1E3DD] rounded-md transition-colors cursor-pointer"
          >
            Continue as Demo Operator
          </button>
        </div>
      </div>
    </div>
  );
};
