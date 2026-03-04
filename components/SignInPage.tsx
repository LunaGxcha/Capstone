import { useState } from 'react';
import { Button } from './ui/button';
import { Mail } from 'lucide-react';

interface SignInPageProps {
  onSignIn: (email: string, userType: 'student' | 'teacher' | 'admin') => void;
}

export default function SignInPage({ onSignIn }: SignInPageProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSignIn = () => {
    setError('');
    
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    // Check if it's a valid email format
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    // Determine user type based on email
    const emailLower = email.toLowerCase();
    
    // Student emails
    if (emailLower === 'stardewvalley@gmail.com' || emailLower === 'dionagenshinstudent@gmail.com') {
      onSignIn(email, 'student');
    } 
    // Teacher emails
    else if (emailLower === 'jokerteacher@gmail.com' || emailLower === 'annteacher@gmail.com') {
      onSignIn(email, 'teacher');
    } 
    // Admin email
    else if (emailLower === 'admin@gmail.com') {
      onSignIn(email, 'admin');
    } 
    else {
      setError('Email not recognized. Please use a valid school email.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full border-4 border-purple-300">
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <span className="text-white font-bold text-4xl">F</span>
          </div>
          <h1 className="text-4xl font-bold text-purple-900 mb-2">FlowTrack</h1>
          <p className="text-purple-600 text-center">Sign in to manage your passes and schedule</p>
        </div>

        {/* Sign In Form */}
        <div className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-purple-900 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                placeholder="Enter your school email"
                className="w-full pl-12 pr-4 py-3 border-2 border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-purple-900"
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
          </div>

          <Button
            onClick={handleSignIn}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-xl shadow-lg text-lg font-semibold"
          >
            Sign In
          </Button>

          {/* Placeholder hints */}
          <div className="mt-6 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
            <p className="text-xs text-purple-700 font-medium mb-2">Demo Accounts:</p>
            <p className="text-xs text-purple-600">Students: stardewvalley@gmail.com, dionagenshinstudent@gmail.com</p>
            <p className="text-xs text-purple-600">Teachers: jokerteacher@gmail.com, annteacher@gmail.com</p>
            <p className="text-xs text-purple-600">Admin: admin@gmail.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
