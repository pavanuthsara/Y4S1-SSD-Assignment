import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api';

const BuyerResetPassword = () => {
  const { id, token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must contain at least 8 characters, one uppercase letter, and one number.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post(`/buyers/reset-password/reset/${id}/${token}`, {
        password,
      });
      setMessage(response.data.message);
      setTimeout(() => navigate('/buyer/login', { replace: true }), 1500);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to reset your password. The link may be invalid or expired.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 px-4 py-12">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-8 text-center">
          <Lock className="mx-auto mb-3 h-10 w-10 text-white" />
          <h1 className="text-2xl font-bold text-white">Choose a new password</h1>
          <p className="mt-2 text-sm text-green-100">
            Enter and confirm the new password for your buyer account.
          </p>
        </div>

        <div className="p-8">
          {message && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm">{message}</p>
            </div>
          )}

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!message && (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                  New password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    required
                    className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-10 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
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

              <div className="space-y-2">
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                  Confirm new password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    required
                    className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <p className="text-xs leading-5 text-gray-500">
                Use at least 8 characters with one uppercase letter and one number.
              </p>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center rounded-lg bg-green-600 px-4 py-3 font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-500"
              >
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {isLoading ? 'Resetting password…' : 'Reset password'}
              </button>
            </form>
          )}

          <Link
            to="/buyer/login"
            className="mt-6 block text-center text-sm font-medium text-green-600 hover:text-green-700 hover:underline"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BuyerResetPassword;
