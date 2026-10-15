import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  User,
} from 'lucide-react';
import { login } from '../../api';

const BuyerLogin = ({ setIsAuthenticated, setUser }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isWSO2Redirecting, setIsWSO2Redirecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await login(
        formData.email,
        formData.password,
        formData.remember
      );

      setUser({
        userId: response.data.userId,
        name: response.data.name,
        email: response.data.email,
        role: 'user',
      });
      setIsAuthenticated(true);
      setSuccessMsg(response.data.message || 'Login successful.');
      navigate('/buyer/dashboard', { replace: true });
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithWSO2 = () => {
    setIsWSO2Redirecting(true);
    window.location.assign('/api/buyers/auth/wso2');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 px-4 py-12">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="bg-gradient-to-r from-green-600 to-green-700 py-8 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="mt-1 text-green-100">Sign in to your buyer account</p>
        </div>

        <div className="p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="flex items-center space-x-3 rounded-lg border-l-4 border-red-600 bg-red-50 p-4 text-red-700">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">{errorMsg}</p>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center space-x-3 rounded-lg border-l-4 border-green-600 bg-green-50 p-4 text-green-700">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">{successMsg}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="buyer-email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  id="buyer-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                  className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="buyer-password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link
                  to="/buyer/forgot-password"
                  className="text-xs font-medium text-green-600 hover:text-green-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  id="buyer-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                  className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-10 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <label className="flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                name="remember"
                checked={formData.remember}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="ml-2">Remember me</span>
            </label>

            <button
              type="submit"
              disabled={isLoading || isWSO2Redirecting}
              className="flex w-full items-center justify-center rounded-lg bg-green-600 px-4 py-3 font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-500"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign in
                </>
              )}
            </button>
          </form>

          <div className="my-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">or</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <button
            type="button"
            onClick={loginWithWSO2}
            disabled={isLoading || isWSO2Redirecting}
            className="flex w-full items-center justify-center rounded-lg border border-green-600 bg-white px-4 py-3 font-medium text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isWSO2Redirecting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 h-5 w-5" />
            )}
            {isWSO2Redirecting ? 'Redirecting to WSO2…' : 'Continue with WSO2'}
          </button>

          <p className="mt-7 text-center text-sm text-gray-600">
            Don&apos;t have an account?
            <Link
              to="/buyer/register"
              className="ml-1 font-medium text-green-600 hover:text-green-700 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BuyerLogin;
