import React from 'react';
import { User } from '../hooks/useAuth';
import { auth } from '../services/firebaseService';
import { LogoutIcon } from './icons';

interface HeaderProps {
    jobName?: string;
    onBack?: () => void;
    user?: User | null;
}

export const Header: React.FC<HeaderProps> = ({ jobName, onBack, user }) => {
  const handleLogout = () => {
    if (auth) {
      auth.signOut();
    }
  }

  return (
    <header className="bg-brand-gray p-4 shadow-md sticky top-0 z-10 flex items-center justify-between">
      <div className="flex-1 min-w-0">
        {jobName && onBack && (
          <button onClick={onBack} className="text-brand-blue font-semibold text-lg hover:underline">
            &lt; Jobs
          </button>
        )}
      </div>

      <h1 className="text-xl font-bold text-center text-white truncate px-4">
        {jobName ? jobName : "Construction Snagging Jobs"}
      </h1>

      <div className="flex-1 flex justify-end items-center gap-4 min-w-0">
        {user && (
          <>
            <span className="text-sm text-gray-300 truncate hidden sm:inline">{user.email}</span>
            <button onClick={handleLogout} title="Logout" className="p-2 text-gray-400 hover:text-white hover:bg-brand-light-gray rounded-full transition-colors">
              <LogoutIcon className="h-6 w-6" />
            </button>
          </>
        )}
      </div>
    </header>
  );
};