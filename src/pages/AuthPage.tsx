import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Card, CardBody, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, loading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await signIn(email, password);
      navigate('/map');
    } catch (err) {
      // Error is handled by the store
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Sign in to access the Kigali GIS platform
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardBody className="space-y-4">
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                leftIcon={<Lock className="w-4 h-4" />}
              />

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-kigali-green focus:ring-kigali-green"
                  />
                  <span className="text-gray-600 dark:text-gray-400">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-kigali-green hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </CardBody>

            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-kigali-green hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { signUp, loading, error, clearError } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      await signUp(email, password, fullName);
      navigate('/login');
    } catch (err) {
      // Error is handled by the store
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Account</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Join the Kigali GIS platform
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardBody className="space-y-4">
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Input
                label="Full Name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                required
                leftIcon={<User className="w-4 h-4" />}
              />

              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password (min 6 characters)"
                required
                leftIcon={<Lock className="w-4 h-4" />}
                helperText="Password must be at least 6 characters"
              />

              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                leftIcon={<Lock className="w-4 h-4" />}
              />
            </CardBody>

            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-kigali-green hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
