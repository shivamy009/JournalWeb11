"use client";

import { useState, useEffect, use } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import useAuthStore from '@/utility/justAuth';
import toast, { Toaster } from 'react-hot-toast';


export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';
  const tabParam = searchParams.get('tab') || 'signin';
  
  const [activeTab, setActiveTab] = useState(tabParam);
  const [signinForm, setSigninForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ firstName: '', lastName: '', email: '', password: '', mobileNumber: '', role: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  // Update tab based on URL parameter
  useEffect(() => {
    if (tabParam && (tabParam === 'signin' || tabParam === 'signup')) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Helper to check subscription
const checkSubscription = async () => {
  try {
    const domain = window.location.hostname; // e.g., "localhost" or "mycollege.edu"
    const res = await axios.get(`https://api.digitallib.in/api/subscriptions/check`, {
      params: { domain }
    });

    if (!res.data.exists || !res.data.active) {
      toast.error("Your subscription has expired — Please contact LibKart for renewal.");
      return false;
    }
    return true;
  } catch (err) {
    toast.error("Unable to verify subscription. Please try again.");
    return false;
  }
};



  const handleSigninChange = (e) => {
    setSigninForm({ ...signinForm, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSignupChange = (e) => {
    setSignupForm({ ...signupForm, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSigninSubmit = async (e) => {
    e.preventDefault();
    if (!signinForm.email || !signinForm.password) {
      setError('Please fill in all fields');
      return;
    }
      // ✅ Check subscription first
  // const valid = await checkSubscription();
  // if (!valid) return;

    setLoading(true);
    try {
      const response = await axios.post(`/api/auth/login`, signinForm);
      setSuccess('Sign-in successful! Redirecting...');
      const token = response.data.token;
      const userData = response.data.user;
      login(token,userData);

      // console.log('Sign-in response:', response.data.user, response.data.token);
      localStorage.setItem('token', response.data.token);

      setSigninForm({ email: '', password: '' });
     setTimeout(() => {
  const role = response.data.user.role;

  // If user is admin but original path was not set, redirect to dashboard
  if (role === 'admin' && redirectPath === '/') {
    router.push('/dashboard/admin');
  } else {
    router.push(redirectPath);
  }
  // hdejdjwklndkjnwkjndjknjk
}, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!signupForm.firstName || !signupForm.lastName || !signupForm.email || !signupForm.password || !signupForm.mobileNumber || !signupForm.role) {
      setError('Please fill in all fields');
      return;
    }
      // ✅ Check subscription first
  // const valid = await checkSubscription();
  // if (!valid) return;

    setLoading(true);
    try {
      // First check if user already exists
      const checkResponse = await axios.post(`/api/auth/check-user`, {
        email: signupForm.email
      });
      
      if (checkResponse.data.exists) {
        setError('User with this email already exists. Please sign in instead.');
        setLoading(false);
        return;
      }

      // Send OTP email
      await axios.post(`/api/send-mail`, {
        email: signupForm.email,
        firstName: signupForm.firstName || signupForm.name?.split(' ')[0] || signupForm.email.split('@')[0]
      });
      
      setSuccess('OTP sent to your email! Redirecting to verification...');
      
      // Redirect to OTP verification page with user data
      setTimeout(() => {
        const userDataEncoded = encodeURIComponent(JSON.stringify(signupForm));
        router.push(`/auth/otp-verification?email=${encodeURIComponent(signupForm.email)}&userData=${userDataEncoded}`);
      }, 1500);
      
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };




  return (
    <div className="max-w-xl mx-auto mt-16">
      <Toaster/>
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-black mb-2">
          Digital Library - Dispur college
        </h1>
      </div>
      
      <div className="p-8 bg-white rounded-2xl shadow-lg border border-blue-100">
        {/* Tabs */}
        <div className="flex border-b border-gray-300 mb-6">
        {['signin', 'signup'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setError('');
              setSuccess('');
            }}
            className={`w-1/2 py-3 text-center font-semibold text-lg tracking-wide ${
              activeTab === tab
                ? 'border-b-4 border-yellow-400 text-[#003366]'
                : 'text-gray-500'
            }`}
          >
            {tab === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        ))}
      </div>

      {/* Alerts */}
      {error && <p className="text-red-600 text-sm font-medium mb-4">{error}</p>}
      {success && <p className="text-green-600 text-sm font-medium mb-4">{success}</p>}

      {/* Form */}
      <form onSubmit={activeTab === 'signin' ? handleSigninSubmit : handleSignupSubmit} className="space-y-4">
        {activeTab === 'signup' && (
          <>
            <div>
              <label htmlFor="firstName" className="text-sm font-medium text-[#003366]">First Name</label>
              <input
                type="text"
                name="firstName"
                id="firstName"
                value={signupForm.firstName}
                onChange={handleSignupChange}
                placeholder="John"
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="text-sm font-medium text-[#003366]">Last Name</label>
              <input
                type="text"
                name="lastName"
                id="lastName"
                value={signupForm.lastName}
                onChange={handleSignupChange}
                placeholder="Doe"
                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          </>
        )}

        <div>
          <label htmlFor="email" className="text-sm font-medium text-[#003366]">Email</label>
          <input
            type="email"
            name="email"
            id="email"
            value={activeTab === 'signin' ? signinForm.email : signupForm.email}
            onChange={activeTab === 'signin' ? handleSigninChange : handleSignupChange}
            placeholder="example@example.com"
            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {activeTab === 'signup' && (
          <div>
            <label htmlFor="mobileNumber" className="text-sm font-medium text-[#003366]">Mobile Number</label>
            <input
              type="tel"
              name="mobileNumber"
              id="mobileNumber"
              value={signupForm.mobileNumber}
              onChange={handleSignupChange}
              placeholder="+91 9876543210"
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
        )}

        {activeTab === 'signup' && (
          <div>
            <label htmlFor="role" className="text-sm font-medium text-[#003366]">Role</label>
            <select
              name="role"
              id="role"
              value={signupForm.role}
              onChange={handleSignupChange}
              className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="">Select your role</option>
              <option value="teachingStaff">Teaching Staff</option>
              <option value="student">Student</option>
              <option value="nonTeachingStaff">Non-Teaching Staff</option>
            </select>
          </div>
        )}

        <div>
          <label htmlFor="password" className="text-sm font-medium text-[#003366]">Password</label>
          <input
            type="password"
            name="password"
            id="password"
            value={activeTab === 'signin' ? signinForm.password : signupForm.password}
            onChange={activeTab === 'signin' ? handleSigninChange : handleSignupChange}
            placeholder="••••••••"
            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 font-semibold rounded-md transition-all duration-200 ${
            loading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-[#003366] text-white hover:bg-[#002244]'
          }`}
        >
          {loading ? (activeTab === 'signin' ? 'Signing In...' : 'Signing Up...') : activeTab === 'signin' ? 'Sign In' : 'Sign Up'}
        </button>
      </form>
      </div>
    </div>
  );
}
