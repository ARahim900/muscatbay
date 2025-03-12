
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/');
      }
    };
    
    checkSession();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          navigate('/');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    
    try {
      setLoading(true);
      setAuthError(null);
      
      if (isSignUp) {
        // Sign up new user
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        
        console.log('Sign up response:', { error, data });
        
        if (error) throw error;
        
        toast.success('Registration successful! Please log in.');
        setIsSignUp(false);
      } else {
        // Sign in existing user
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        console.log('Sign in response:', { error, data });
        
        if (error) throw error;
        
        toast.success('Logged in successfully!');
        navigate('/');
      }
    } catch (error: any) {
      console.error('Auth error details:', error);
      const errorMessage = error.message || 'Authentication failed';
      setAuthError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-muscat-light to-white p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-6">
            <img 
              alt="Muscat Bay Logo" 
              className="h-12 w-auto" 
              src="/lovable-uploads/a4c6f994-ae31-40c5-a0c0-0314f091a04d.jpg"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-muscat-primary">
            {isSignUp ? 'Create an Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUp 
              ? 'Enter your details to create a new account' 
              : 'Enter your credentials to access your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {authError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Authentication Error</p>
                <p className="text-sm text-red-700">{authError}</p>
                <p className="text-xs text-red-600 mt-1">
                  Note: Email authentication might be disabled in the Supabase project settings.
                </p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required={isSignUp}
                  disabled={loading}
                  className="modern-input"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                disabled={loading}
                className="modern-input"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="modern-input"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-muscat-primary hover:bg-muscat-primary/90"
              disabled={loading}
            >
              {loading 
                ? 'Processing...'
                : isSignUp 
                  ? 'Create Account' 
                  : 'Sign In'
              }
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <div className="w-full text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muscat-primary hover:underline"
              disabled={loading}
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : 'Don\'t have an account? Sign up'}
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
