'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import Google from '@/assets/socials/google.svg';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  redirectTo?: string;
}

export function AuthModal({ 
  isOpen, 
  onClose, 
  initialMode = 'login',

}: AuthModalProps) {
  const router = useRouter();
  const { login, signup, isLoading } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: '',
  });
  
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return false;
    }

    if (mode === 'signup') {
      if (!formData.username) {
        setError('Username is required for signup');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    let result;
    if (mode === 'login') {
      result = await login(formData.email, formData.password);
    } else {
      result = await signup(formData.email, formData.password, formData.username);
    }
    
    if (result.success) {
      onClose();
      // For signup, go to role selection; for login, go to dashboard or main app
      if (mode === 'signup') {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    } else {
      setError(result.error || `${mode} failed`);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
    setFormData({
      email: formData.email,
      password: '',
      username: '',
      confirmPassword: '',
    });
  };

  // TODO: Implement Google OAuth integration with backend
  const handleGoogleAuth = () => {
    // For now, just redirect to onboarding
    // In production, this should integrate with Google OAuth
    setError('Google authentication not yet implemented. Please use email/password.');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#171719] border-[#292A2E] text-white">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-semibold">
            {mode === 'login' ? 'Welcome back' : 'Welcome to Nerdwork+'}
          </DialogTitle>
          <DialogDescription className="text-[#707073]">
            {mode === 'login' 
              ? 'Sign in to your account' 
              : 'Create your account to get started'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
              <AlertDescription className="text-red-300">{error}</AlertDescription>
            </Alert>
          )}

          {/* Google Auth Button - Coming Soon */}
          <Button
            type="button"
            variant="secondary"
            className="w-full bg-[#292A2E] hover:bg-[#3A3B3F] border-[#292A2E] text-white"
            onClick={handleGoogleAuth}
            disabled={isLoading}
          >
            <Image src={Google} width={16} height={16} alt="Google logo" />
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#292A2E]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#171719] px-2 text-[#707073]">Or continue with email</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              className="bg-[#292A2E] border-[#292A2E] text-white placeholder:text-[#707073]"
            />
          </div>

          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                className="bg-[#292A2E] border-[#292A2E] text-white placeholder:text-[#707073]"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                className="bg-[#292A2E] border-[#292A2E] text-white placeholder:text-[#707073] pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-[#707073]" />
                ) : (
                  <Eye className="h-4 w-4 text-[#707073]" />
                )}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                className="bg-[#292A2E] border-[#292A2E] text-white placeholder:text-[#707073]"
              />
            </div>
          )}
        
          <Button 
            type="submit" 
            className="w-full bg-[#3373D9] hover:bg-[#2A5BC7]"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
          
          <p className="text-sm text-center text-[#707073]">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={switchMode}
              className="text-[#3373D9] hover:underline font-medium"
              disabled={isLoading}
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          {mode === 'signup' && (
            <p className="text-xs text-[#707073] text-center">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-[#3373D9] hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-[#3373D9] hover:underline">Privacy Policy</a>
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}