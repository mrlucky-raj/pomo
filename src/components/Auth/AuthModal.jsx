import React, { useState, useEffect } from 'react';
import { X, Cloud, CloudOff, LogIn, LogOut, RefreshCw, CheckCircle2, ShieldCheck, User } from 'lucide-react';
import { auth, googleProvider, isFirebaseConfigured } from '../../firebase/config';
import { signInWithPopup, signInAnonymously, signOut, onAuthStateChanged } from 'firebase/auth';

export default function AuthModal({ isOpen, onClose, storage, syncStatus }) {
  const [currentUser, setCurrentUser] = useState(auth?.currentUser || null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    let unsubscribeAuth = () => {};
    if (auth) {
      unsubscribeAuth = onAuthStateChanged(auth, (u) => {
        setCurrentUser(u);
        if (u) {
          storage.syncWithCloud();
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeAuth();
    };
  }, [storage]);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    if (!auth || !googleProvider) {
      setError('Firebase keys are missing in .env / .env.local file.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await signInWithPopup(auth, googleProvider);
      storage.syncWithCloud();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    if (!auth) {
      setError('Firebase authentication is not configured.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await signInAnonymously(auth);
      storage.syncWithCloud();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      setCurrentUser(null);
    }
  };

  const triggerManualSync = () => {
    storage.syncWithCloud();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative border border-slate-700/60">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Status Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className={`p-3.5 rounded-2xl mb-3 border ${
            isOnline ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
          }`}>
            {isOnline ? <Cloud className="w-7 h-7" /> : <CloudOff className="w-7 h-7" />}
          </div>
          <h2 className="text-xl font-bold text-white">Cloud Sync & Account</h2>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-xs text-slate-300 font-medium">
              {isOnline ? 'Internet Connected' : 'Offline Mode (Local Storage)'}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs text-center">
            {error}
          </div>
        )}

        {/* If Logged In */}
        {currentUser ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-3">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Profile" className="w-10 h-10 rounded-full border border-slate-700" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                  <User className="w-5 h-5" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {currentUser.displayName || (currentUser.isAnonymous ? 'Guest Student' : 'Focus User')}
                </p>
                <p className="text-xs text-slate-400 truncate">{currentUser.email || 'Cloud Synced Session'}</p>
              </div>
            </div>

            {/* Sync Controls */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs">
              <span className="text-slate-300 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Auto Sync Status</span>
              </span>
              <button
                onClick={triggerManualSync}
                disabled={syncStatus?.state === 'syncing'}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold flex items-center space-x-1 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncStatus?.state === 'syncing' ? 'animate-spin' : ''}`} />
                <span>{syncStatus?.state === 'syncing' ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          /* Sign In Options */
          <div className="space-y-3">
            <p className="text-xs text-slate-300 text-center mb-4">
              Connect your account to automatically back up your study hours, task logs, and pomodoro streaks across devices.
            </p>

            {isFirebaseConfigured ? (
              <>
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading || !isOnline}
                  className="w-full py-3 px-4 rounded-xl bg-white text-slate-900 font-semibold text-xs flex items-center justify-center space-x-3 hover:bg-slate-100 transition-all shadow-lg disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Sign in with Google</span>
                </button>

                <button
                  onClick={handleAnonymousLogin}
                  disabled={loading || !isOnline}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-semibold text-xs hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  Quick Guest Sign-In
                </button>
              </>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-center space-y-1">
                <p className="font-semibold">Offline Local-First Mode</p>
                <p className="text-[11px] text-amber-200/80">
                  Your data is stored locally on this device. Add Firebase credentials to `.env` file to enable cross-device cloud sync.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
