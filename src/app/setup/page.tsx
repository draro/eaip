'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Book, UserPlus, CheckCircle } from 'lucide-react';

export default function SetupPage() {
  const [name, setName] = useState('Admin User');
  const [email, setEmail] = useState('admin@eaip.com');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasUsers, setHasUsers] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if there are already users in the system
    checkForUsers();
  }, []);

  const checkForUsers = async () => {
    try {
      const response = await fetch('/api/setup/check');
      const result = await response.json();
      if (result.hasUsers) {
        setHasUsers(true);
      }
    } catch (error) {
      console.error('Error checking users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

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
          role: 'admin',
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/signin');
        }, 2000);
      } else {
        setError(result.error || 'Setup failed');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (hasUsers) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Setup Complete</h3>
            <p className="text-gray-600 mb-4">
              The eAIP Editor has already been set up. Users exist in the system.
            </p>
            <Button onClick={() => router.push('/auth/signin')}>
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Setup Complete!</h3>
            <p className="text-gray-600 mb-4">
              Admin account created successfully. You will be redirected to sign in.
            </p>
            <Button onClick={() => router.push('/auth/signin')}>
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Book className="h-12 w-12 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">eAIP Editor</h1>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Initial Setup</h2>
            <p className="mt-2 text-sm text-gray-600">
              Create the first administrator account to get started
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="h-5 w-5 mr-2" />
                Create Admin Account
              </CardTitle>
              <CardDescription>
                Set up the initial administrator account for the eAIP Editor system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-800 bg-red-100 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}

                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1"
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 6 characters. You can change this later.
                  </p>
                </div>

                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Role:</strong> Administrator
                    <br />
                    This account will have full access to all features including user management.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    'Create Admin Account'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              This setup page will only be available until the first user is created.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}