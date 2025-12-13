import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Monitor, Mail, Lock, User, ArrowRight, Zap, Layers, Grid3x3 } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, isLogin ? 'User' : name);
    navigate('/dashboard');
  };

  const handleDemoLogin = () => {
    login('demo@signcraft.com', 'Demo User');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory via-vanilla to-ivory flex flex-col">
      {/* Header Navigation */}
      <header className="border-b border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-75 transition">
            <Monitor className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-primary">SignCraft</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-gray-600 hover:text-primary transition">Home</Link>
            <Link to="/product" className="text-gray-600 hover:text-primary transition">Info</Link>
            <Link to="/templates" className="text-gray-600 hover:text-primary transition">Templates</Link>
            <Link to="/legal" className="text-gray-600 hover:text-primary transition">Legal</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Side - Features */}
        <div className="lg:flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-12 py-12">
          <div className="max-w-md">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Create Beautiful Digital Signage
            </h1>
            <p className="text-lg text-gray-600 mb-12">
              Design, schedule, and manage your displays from anywhere. Perfect for retail, offices, and more.
            </p>

            {/* Features List */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Easy to Use</h3>
                  <p className="text-gray-600 text-sm">Intuitive editor with drag-and-drop functionality</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-purple-100">
                  <Layers className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Organize Content</h3>
                  <p className="text-gray-600 text-sm">Create playlists and manage your creative assets</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-orange-100">
                  <Grid3x3 className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Multiple Screens</h3>
                  <p className="text-gray-600 text-sm">Control multiple displays from a single dashboard</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="lg:flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-12 py-12">
          <div className="w-full max-w-sm mx-auto lg:mx-0">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                {isLogin ? 'Welcome Back' : 'Get Started'}
              </h2>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {!isLogin && (
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="flex items-center gap-2">
                        <User size={16} />
                        Full Name
                      </span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <Mail size={16} />
                      Email Address
                    </span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center gap-2">
                      <Lock size={16} />
                      Password
                    </span>
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-primary text-white font-semibold hover:bg-primaryLight transition-colors"
                >
                  {isLogin ? 'Sign In' : 'Sign Up'}
                  <ArrowRight size={18} />
                </button>
              </form>

              {/* Demo Login Button */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleDemoLogin}
                  className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Try Demo Account
                </button>
              </div>

              {/* Toggle Form */}
              <div className="mt-6 text-center">
                <p className="text-gray-600 text-sm">
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}
                  {' '}
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-primary font-semibold hover:text-primaryLight transition"
                  >
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </div>

              {/* Links Section */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center mb-4">Quick Access</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Link
                    to="/"
                    className="text-gray-600 hover:text-primary transition text-center py-2 rounded hover:bg-gray-50"
                  >
                    Home
                  </Link>
                  <Link
                    to="/templates"
                    className="text-gray-600 hover:text-primary transition text-center py-2 rounded hover:bg-gray-50"
                  >
                    Templates
                  </Link>
                  <Link
                    to="/product"
                    className="text-gray-600 hover:text-primary transition text-center py-2 rounded hover:bg-gray-50"
                  >
                    Info
                  </Link>
                  <Link
                    to="/legal"
                    className="text-gray-600 hover:text-primary transition text-center py-2 rounded hover:bg-gray-50"
                  >
                    Legal
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
