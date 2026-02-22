import { useState } from 'react';
import { Scale, Eye, EyeOff, Lock, Mail } from 'lucide-react';

interface JudgeLoginProps {
  onBack: () => void;
  onLogin: () => void;
}

export function JudgeLogin({ onBack, onLogin }: JudgeLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - in real app, would authenticate
    onLogin();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-xl">
        {/* Logo and Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1a1f2e] rounded-lg mb-4">
            <Scale className="size-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Judicial Analytics Portal
          </h1>
          <p className="text-sm text-gray-600">
            Commonwealth of Massachusetts
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Judge Sign In
            </h2>
            <p className="text-sm text-gray-600">
              Access your professional development dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5">
            {/* Email Field */}
            <div className="mb-4">
              <label 
                htmlFor="email" 
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Mail className="size-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="judge@courts.state.ma.us"
                  className="w-full pl-12 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="mb-5">
              <label 
                htmlFor="password" 
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Lock className="size-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-14 py-2.5 bg-white border border-gray-300 rounded-lg text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              className="w-full bg-[#1a1f2e] hover:bg-[#252b3d] text-white font-medium py-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
            >
              Sign In
            </button>

            {/* Forgot Password Link */}
            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Forgot password?
              </button>
            </div>
          </form>

          {/* Confidential Notice */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1.5">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                This is a <span className="font-semibold">confidential professional development dashboard</span> designed 
                to support continuous improvement in judicial decision-making. All data is anonymized and aggregated 
                for learning purposes. This system is intended to promote fairness and consistency across the judiciary.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Public Dashboard */}
        <div className="mt-5 text-center">
          <button
            onClick={onBack}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center gap-2"
          >
            <span>←</span>
            <span>Back to Public Dashboard</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            © 2026 Commonwealth of Massachusetts • Judicial Branch
          </p>
        </div>
      </div>
    </div>
  );
}