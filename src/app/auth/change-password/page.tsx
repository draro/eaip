'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface PasswordStrength {
  score: number;
  isValid: boolean;
  errors: string[];
  suggestions: string[];
}

export default function ChangePasswordPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);

  // Check password strength as user types
  useEffect(() => {
    if (formData.newPassword) {
      checkPasswordStrength(formData.newPassword);
    } else {
      setPasswordStrength(null);
    }
  }, [formData.newPassword]);

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const checkPasswordStrength = async (password: string) => {
    if (password.length < 3) return; // Don't check very short passwords

    try {
      // We'll implement this client-side for immediate feedback
      const strength = calculatePasswordStrength(password);
      setPasswordStrength(strength);
    } catch (error) {
      console.error('Error checking password strength:', error);
    }
  };

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    const errors: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // Length check
    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    } else if (password.length >= 16) {
      score += 2;
    } else {
      score += 1;
      suggestions.push('Consider using a longer password (16+ characters recommended)');
    }

    // Character diversity checks
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

    if (!hasLowercase) errors.push('Password must contain lowercase letters');
    else score += 1;

    if (!hasUppercase) errors.push('Password must contain uppercase letters');
    else score += 1;

    if (!hasNumbers) errors.push('Password must contain numbers');
    else score += 1;

    if (!hasSpecialChars) errors.push('Password must contain special characters');
    else score += 1;

    // Pattern checks
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Avoid repeated characters (3+ in a row)');
      score -= 1;
    }

    if (/123|abc|qwe|password|admin/i.test(password)) {
      errors.push('Avoid common patterns or words');
      score -= 2;
    }

    score = Math.max(0, Math.min(10, score));
    const isValid = errors.length === 0 && score >= 6;

    return { score, isValid, errors, suggestions };
  };

  const getStrengthColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStrengthText = (score: number) => {
    if (score >= 8) return 'Strong';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Weak';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Password changed successfully! Redirecting...');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });

        // Redirect after success
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setError(data.error || 'Failed to change password');

        // Show detailed validation errors if available
        if (data.details?.errors) {
          setError(`${data.error}: ${data.details.errors.join(', ')}`);
        }
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Error changing password:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const isFormValid = formData.currentPassword && formData.newPassword &&
    formData.confirmPassword && formData.newPassword === formData.confirmPassword &&
    passwordStrength?.isValid;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Change Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create a secure password for your account
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Update Required
            </CardTitle>
            <CardDescription>
              Please create a new secure password to continue using your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Current Password */}
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? 'text' : 'password'}
                    value={formData.currentPassword}
                    onChange={handleInputChange('currentPassword')}
                    placeholder="Enter your current password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswords.current ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={handleInputChange('newPassword')}
                    placeholder="Enter your new password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {passwordStrength && formData.newPassword && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Password strength:</span>
                      <Badge className={getStrengthColor(passwordStrength.score)}>
                        {getStrengthText(passwordStrength.score)} ({passwordStrength.score}/10)
                      </Badge>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.score >= 8 ? 'bg-green-500' :
                          passwordStrength.score >= 6 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 10) * 100}%` }}
                      />
                    </div>

                    {passwordStrength.errors.length > 0 && (
                      <div className="space-y-1">
                        {passwordStrength.errors.map((error, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                            <XCircle className="h-3 w-3" />
                            {error}
                          </div>
                        ))}
                      </div>
                    )}

                    {passwordStrength.suggestions.length > 0 && (
                      <div className="space-y-1">
                        {passwordStrength.suggestions.map((suggestion, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-yellow-600">
                            <AlertTriangle className="h-3 w-3" />
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange('confirmPassword')}
                    placeholder="Confirm your new password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>

                {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                  <div className="mt-1 flex items-center gap-2 text-sm text-red-600">
                    <XCircle className="h-3 w-3" />
                    Passwords do not match
                  </div>
                )}

                {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
                  <div className="mt-1 flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    Passwords match
                  </div>
                )}
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating Password...
                  </div>
                ) : (
                  'Change Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}