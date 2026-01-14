import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// ✅ ADDED: ArrowLeft
import { Monitor, Mail, Lock, Sparkles, Eye, EyeOff, CheckCircle, AlertCircle, Loader, ArrowLeft } from 'lucide-react';

const Auth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    console.log('📝 [AUTH_PAGE] Form submitted');

    try {
      const result = await login(email, password);
      if (result.success) {
        console.log('✅ [AUTH_PAGE] Login successful, redirecting to dashboard');
        setSuccess('✓ Login successful! Redirecting...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      } else {
        const errorMsg = result.msg || 'Login failed. Please check your credentials.';
        console.error('❌ [AUTH_PAGE] Login failed:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'An unexpected error occurred. Please try again.';
      console.error('❌ [AUTH_PAGE] Exception:', err);
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = email.trim() !== '' && password.trim() !== '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-black flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8 overflow-hidden relative">

      {/* ✅ NEW: Back to Home Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-50 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group animate-fade-in"
      >
        <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 group-hover:border-white/20 transition-all">
          <ArrowLeft className="h-5 w-5" />
        </div>
        <span className="text-sm font-medium">Back to Home</span>
      </button>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-900 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-800 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-700 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-4000"></div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full sm:max-w-md">
        {/* Header Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-blue-900 rounded-full blur opacity-75 animate-pulse"></div>
              <div className="relative bg-black p-4 rounded-full">
                <Monitor className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-2">
            SignCraft
          </h1>
          <p className="text-gray-300 text-lg flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-400" />
            Creative Design Playground
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-blue-900/20 shadow-2xl overflow-hidden animate-scale-in">
          {/* Form Container */}
          <div className="p-8 sm:p-10">
            {/* Status Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-3 items-start animate-slide-down">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex gap-3 items-start animate-slide-down">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-300">{success}</p>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                  Email Address
                </label>
                <div className={`relative transition-all duration-300 ${focusedField === 'email' ? 'ring-2 ring-blue-600/50' : ''} rounded-lg`}>
                  <Mail className={`absolute left-4 top-3.5 h-5 w-5 transition-colors ${focusedField === 'email' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-11 pr-4 py-3 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all duration-300 text-sm"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
                  Password
                </label>
                <div className={`relative transition-all duration-300 ${focusedField === 'password' ? 'ring-2 ring-blue-600/50' : ''} rounded-lg`}>
                  <Lock className={`absolute left-4 top-3.5 h-5 w-5 transition-colors ${focusedField === 'password' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-11 pr-12 py-3 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all duration-300 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 mt-8 ${isSubmitting || !isFormValid
                  ? 'bg-gray-400 opacity-50 cursor-not-allowed'
                  : 'bg-blue-900 hover:bg-blue-800 shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 active:scale-95'
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer Badge */}
          <div className="px-8 py-4 bg-gradient-to-r from-blue-100 to-blue-50 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-600">
              Secure sign-in powered by advanced encryption
            </p>
          </div>
        </div>

        {/* Bottom Text */}
        <p className="mt-8 text-center text-sm text-gray-300">
          Part of the <span className="text-blue-400 font-semibold">SignCraft</span> ecosystem
        </p>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }

        .delay-2000 {
          animation-delay: 2s;
        }

        .delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Auth;