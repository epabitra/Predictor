import React from 'react';
import { Bell, Search, Settings, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const Header = () => {
  const { notifications } = useApp();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Search - Full width on mobile, constrained on larger screens */}
        <div className="flex-1 w-full sm:max-w-lg">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search tournaments, matches, predictors..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center justify-end space-x-2 sm:space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md">
            <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-danger-400 ring-2 ring-white" />
            )}
          </button>

          {/* Settings */}
          <button className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md">
            <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* User menu */}
          <button className="flex items-center space-x-2 p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary-600 flex items-center justify-center">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700">Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
