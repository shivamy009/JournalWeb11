'use client';
import axios from "axios";
import Navbar from "./Navbar";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { BookOpen, Database, FileText, Clock, Search } from "lucide-react";
import useAuthStore from '@/utility/justAuth';
import ProfileDropdown from './ProfileDropdown';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    articles: 0,
    books: 0,
    journals: 0,
    loading: true
  });
  const [animatedNumbers, setAnimatedNumbers] = useState({
    articles: 0,
    books: 0,
    journals: 0
  });
  const [recentSearches, setRecentSearches] = useState([]);

  const { isLoggedIn, logout, hasHydrated } = useAuthStore();

  // Memoized logout handler with error handling
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      localStorage.clear();
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Failed to logout. Please try again.');
    }
  }, [logout]);

  // Memoized search handler
  const handleSearch = useCallback(() => {
    if (searchTerm.trim()) {
      const newSearch = searchTerm.trim();
      setRecentSearches(prev => {
        const updated = [newSearch, ...prev.filter(s => s !== newSearch)].slice(0, 5);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
        return updated;
      });
      window.location.href = `/search/${encodeURIComponent(newSearch)}`;
    }
  }, [searchTerm]);

  // Load recent searches from localStorage
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);

  // Animated counter while loading
  useEffect(() => {
    let interval;
    if (stats.loading) {
      interval = setInterval(() => {
        setAnimatedNumbers(prev => ({
          articles: Math.floor(Math.random() * 999999) + 100000,
          books: Math.floor(Math.random() * 99999) + 10000,
          journals: Math.floor(Math.random() * 9999) + 1000
        }));
      }, 150);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [stats.loading]);

  // Number formatting
  const formatNumber = (num) => {
    if (num >= 100000) return Math.floor(num / 100000) + "L+";
    if (num >= 1000) return Math.floor(num / 1000) + "K+";
    return num + "+";
  };

  // Data fetching functions
  const fetchDOAJCount = async () => {
    try {
      const response = await axios.get('/api/doaj-stats');
      return {
        articles: response.data?.articles || 0,
        journals: response.data?.journals || 0,
        total: response.data?.total || 0
      };
    } catch {
      return { articles: 0, journals: 0, total: 0 };
    }
  };

  const fetchLocalCount = async () => {
    try {
      const response = await axios.get(`/api/journal`);
      const journals = response.data?.journals || [];
      const articleCount = journals.filter(j => j.type && !j.type.toLowerCase().includes('book')).length;
      const bookCount = journals.filter(j => j.type && j.type.toLowerCase().includes('book')).length;
      return { articles: articleCount, books: bookCount, total: journals.length };
    } catch {
      return { articles: 0, books: 0, total: 0 };
    }
  };

  const fetchStats = useCallback(async () => {
    try {
      const [doajData, localData] = await Promise.all([
        fetchDOAJCount(),
        fetchLocalCount()
      ]);
      setStats({
        articles: localData.articles + doajData.articles,
        books: localData.books,
        journals: doajData.journals,
        loading: false
      });
    } catch {
      setStats(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Initialize data
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Early return if store hasn't hydrated
  if (!hasHydrated) {
    return null;
  }

  return (
    <>
      <div
        className="min-h-screen relative overflow-hidden"
        style={{
          backgroundImage: "linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4)), url('/library.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <Navbar />

        {/* Hero Section */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-24 pb-10">
          <div className="bg-white/20 backdrop-blur-md rounded-full px-5 py-2 border border-white/40 shadow-2xl shadow-black/30 ring-1 ring-white/20">
            <span className="text-sm text-white font-semibold drop-shadow-lg">
              Digital Library - Dispur College
            </span>
          </div>

          <h1 className="mt-6 text-5xl md:text-6xl font-bold text-white leading-tight drop-shadow-2xl" style={{textShadow: '0 0 30px rgba(255,255,255,0.8), 0 0 60px rgba(255,255,255,0.4), 3px 3px 6px rgba(0,0,0,1)'}}>
            Unlock Ancient{" "}
            <span className="text-white">
              Wisdom
            </span>
            <br />
            <span className="text-white">
              Today
            </span>
          </h1>

          <p className="mt-4 text-gray-100 text-lg max-w-2xl drop-shadow-lg font-medium" style={{textShadow: '2px 2px 4px rgba(0,0,0,1)'}}>
            Access millions of academic resources, research papers, and digital collections. 
            Your gateway to unlimited knowledge in the digital age.
          </p>

          {/* Search Bar */}
          <div className="mt-8 flex w-full max-w-2xl bg-white/15 backdrop-blur-lg rounded-xl border border-white/40 overflow-hidden shadow-2xl shadow-black/40 ring-1 ring-white/20">
            <input
              type="text"
              placeholder="Search books, articles, research papers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              className="px-5 py-4 w-full bg-transparent text-white placeholder-gray-200 focus:outline-none"
              aria-label="Search for academic resources"
            />
            <button
              onClick={handleSearch}
              className={`transition-all font-bold px-6 py-4 text-white shadow-xl drop-shadow-lg ${
                !searchTerm.trim() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{
                backgroundColor: '#0ebcf5',
                boxShadow: '0 25px 50px -12px rgba(14, 188, 245, 0.5)',
              }}
              onMouseEnter={(e) => {
                if (searchTerm.trim()) {
                  e.target.style.backgroundColor = '#0aa5d9';
                  e.target.style.boxShadow = '0 25px 50px -12px rgba(14, 188, 245, 0.6)';
                }
              }}
              onMouseLeave={(e) => {
                if (searchTerm.trim()) {
                  e.target.style.backgroundColor = '#0ebcf5';
                  e.target.style.boxShadow = '0 25px 50px -12px rgba(14, 188, 245, 0.5)';
                }
              }}
              disabled={!searchTerm.trim()}
              aria-label="Submit search"
            >
              SEARCH
            </button>
          </div>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {recentSearches.map((search, index) => (
                <Link
                  key={index}
                  href={`/search/${encodeURIComponent(search)}`}
                  className="px-3 py-1 bg-white/15 hover:bg-white/30 text-white text-xs sm:text-sm rounded-full transition-all shadow-lg shadow-black/20 drop-shadow-md hover:shadow-black/30 border border-white/20"
                >
                  {search}
                </Link>
              ))}
            </div>
          )}

          {/* Advanced Search Button */}
          <Link
            href="/advanceSearch"
            className="mt-4 px-5 py-2 bg-white/15 hover:bg-white/25 border border-white/40 backdrop-blur-md text-white rounded-full transition flex items-center gap-2 shadow-xl shadow-black/30 ring-1 ring-white/20 drop-shadow-lg hover:shadow-black/40"
            aria-label="Advanced Search"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            Advanced Search
          </Link>

          {/* Categories Below Advanced Search */}
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            <Link
              href="/type/book"
              className="px-6 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-white font-semibold hover:bg-white/25 transition shadow-lg shadow-black/20 ring-1 ring-white/10 drop-shadow-md hover:shadow-black/30"
            >
              E-Books
            </Link>
            <Link
              href="/type/journal"
              className="px-6 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-white font-semibold hover:bg-white/25 transition shadow-lg shadow-black/20 ring-1 ring-white/10 drop-shadow-md hover:shadow-black/30"
            >
              Journals
            </Link>
            <Link
              href="/type/archive"
              className="px-6 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-white font-semibold hover:bg-white/25 transition shadow-lg shadow-black/20 ring-1 ring-white/10 drop-shadow-md hover:shadow-black/30"
            >
              Archives
            </Link>
            <Link
              href="/type/dataset"
              className="px-6 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-white font-semibold hover:bg-white/25 transition shadow-lg shadow-black/20 ring-1 ring-white/10 drop-shadow-md hover:shadow-black/30"
            >
              Datasets
            </Link>
          </div>

          {/* Stats Section */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-5 w-full max-w-5xl">
            <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl shadow-2xl shadow-black/50 text-center border border-white/30 ring-1 ring-white/10">
              <div className="text-white text-3xl mb-2 drop-shadow-lg">
                <FileText className="w-8 h-8 mx-auto" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-blue-400 drop-shadow-lg">
                {stats.loading ? formatNumber(animatedNumbers.articles) : "115L+"}
              </h3>
              <p className="text-gray-100 text-sm mt-2 font-medium drop-shadow-md">Articles</p>
            </div>
            <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl shadow-2xl shadow-black/50 text-center border border-white/30 ring-1 ring-white/10">
              <div className="text-white text-3xl mb-2 drop-shadow-lg">
                <BookOpen className="w-8 h-8 mx-auto" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-purple-400 drop-shadow-lg">
                 {stats.loading ? formatNumber(animatedNumbers.books) : formatNumber(stats.books)}
              </h3>
              <p className="text-gray-100 text-sm mt-2 font-medium drop-shadow-md">Books</p>
            </div>
            <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl shadow-2xl shadow-black/50 text-center border border-white/30 ring-1 ring-white/10">
              <div className="text-white text-3xl mb-2 drop-shadow-lg">
                <Database className="w-8 h-8 mx-auto" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-green-400 drop-shadow-lg">
                {stats.loading ? formatNumber(animatedNumbers.journals) : "21K+"}
              </h3>
              <p className="text-gray-100 text-sm mt-2 font-medium drop-shadow-md">Journals</p>
            </div>
            <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl shadow-2xl shadow-black/50 text-center border border-white/30 ring-1 ring-white/10">
              <div className="text-white text-3xl mb-2 drop-shadow-lg">
                <Clock className="w-8 h-8 mx-auto" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-pink-400 drop-shadow-lg">
                24/7
              </h3>
              <p className="text-gray-100 text-sm mt-2 font-medium drop-shadow-md">Access Always Available</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}