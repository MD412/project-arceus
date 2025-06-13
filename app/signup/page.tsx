'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import './signup.css'; // Import the CSS file
import { Input } from '@/components/forms/Input';
import { Button } from '@/components/ui/Button';

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

const SignupPage: React.FC = () => {
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    return newErrors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess(false);
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          // Skip email confirmation for now since Supabase email is down
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          setErrors({ general: 'An account with this email already exists. Try logging in instead.' });
        } else {
          setErrors({ general: error.message });
        }
        return;
      }

      // Success!
      if (data.user) {
        console.log('Successfully signed up:', data.user.email);
        setSuccess(true);
        
        // If the user is immediately confirmed (no email verification needed)
        if (data.session) {
          setTimeout(() => {
            router.push('/');
          }, 2000);
        }
      }

    } catch (error) {
      console.error('Signup error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="signup-container">
        <div className="signup-card">
          <div className="success-message">
            <h1>Welcome to Project Arceus!</h1>
            <p>Your account has been created successfully.</p>
            <p>Redirecting you to the home page...</p>
            <Link href="/login" className="auth-link">
              Or click here to login now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="signup-container">
      <div className="signup-card-wrapper">
      <div className="signup-card">
        <div className="signup-header">
          <h1>Create Account</h1>
          <p>Join Project Arceus to start collecting</p>
        </div>
        
        <form onSubmit={handleSubmit} className="signup-form">
          {errors.general && (
            <div className="error-message general-error">
              {errors.general}
            </div>
          )}
          
          <Input
            type="email"
            id="email"
            name="email"
            label="Email Address"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email"
            disabled={isLoading}
            error={errors.email}
            required
          />
          
          <Input
            type="password"
            id="password"
            name="password"
            label="Password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Choose a password (min. 6 characters)"
            disabled={isLoading}
            error={errors.password}
            required
          />
          
          <Input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Confirm your password"
            disabled={isLoading}
            error={errors.confirmPassword}
            required
          />
          
          <Button
            type="submit"
            disabled={isLoading}
            variant="primary"
            className="signup-form-button" // For potential specific targeting
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>
        
        <div className="signup-footer">
          <p>
            Already have an account?{' '}
            <Link href="/login" className="auth-link">
              Log in
            </Link>
          </p>
        </div>
        </div>
        <div className="signup-back-button">
          <Link href="/login" className="back-link">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage; 