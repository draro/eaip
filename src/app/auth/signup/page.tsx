'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Book, Eye, EyeOff } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();

  // Self-signup is disabled - redirect to signin with message
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="flex items-center justify-center mb-6">
            <Book className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">eAIP Editor</h1>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Self-Registration Disabled</CardTitle>
            <CardDescription>
              User accounts must be created by administrators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                For security reasons, self-registration is not available. User accounts can only be created by:
              </p>
              <ul className="mt-2 text-sm text-blue-800 list-disc list-inside space-y-1">
                <li>System Administrators (Super Admin)</li>
                <li>Organization Administrators</li>
              </ul>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-sm text-gray-700 font-medium mb-2">
                Need an account?
              </p>
              <p className="text-sm text-gray-600">
                Please contact your organization administrator or system administrator to request access to the eAIP Editor system.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button
                onClick={() => router.push('/auth/signin')}
                className="w-full"
              >
                Go to Sign In
              </Button>
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="w-full"
              >
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  /* DISABLED SIGNUP FORM
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('editor');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/signin');
        }, 2000);
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Account Created Successfully!</h3>
              <p className="text-gray-600 mb-4">
                Your eAIP Editor account has been created. You will be redirected to the sign-in page.
              </p>
              <Button onClick={() => router.push('/auth/signin')}>
                Go to Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center mb-6">
            <Book className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">eAIP Editor</h1>
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Join the Electronic Aeronautical Information Publication editor
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Get started</CardTitle>
            <CardDescription>Create your account to access the eAIP Editor</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-800 bg-red-100 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md mt-1"
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                  <option value="admin">Administrator</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select your role within the organization
                </p>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Already have an account?</span>
                </div>
              </div>

              <div className="mt-6">
                <Link href="/auth/signin">
                  <Button variant="outline" className="w-full">
                    Sign in instead
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our terms of service and privacy policy.
            <br />
            This system is for authorized personnel only.
          </p>
        </div>
      </div>
    </div>
  );
  */
}