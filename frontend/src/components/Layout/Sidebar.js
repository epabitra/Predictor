import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Trophy, 
  Gamepad2, 
  Target,
  Home,
  TrendingUp,
  Bell,
  Menu,
  X
} from 'lucide-react';

const Sidebar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Predictors', href: '/predictors', icon: Users },
    { name: 'Tournaments', href: '/tournaments', icon: Trophy },
    { name: 'Matches', href: '/matches', icon: Gamepad2 },
    { name: 'Predictions', href: '/predictions', icon: Target },
    { name: 'Match Reminders', href: '/match-reminders', icon: Bell },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Leaderboard', href: '/leaderboard', icon: TrendingUp },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={closeMobileMenu} />
      )}

      {/* Mobile menu */}
      <div className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full bg-gray-800">
          {/* Logo */}
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-white text-lg font-semibold">Tournament Predictor</h1>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={closeMobileMenu}
                    className={({ isActive }) =>
                      `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                        isActive
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 flex bg-gray-700 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
                  <Users className="h-4 w-4 text-gray-300" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-300">Admin Panel</p>
                <p className="text-xs text-gray-400">v1.0.0</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-gray-800">
            {/* Logo */}
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-3">
                  <h1 className="text-white text-lg font-semibold">Tournament Predictor</h1>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-2 py-4 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={({ isActive }) =>
                        `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                          isActive
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`
                      }
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 flex bg-gray-700 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
                    <Users className="h-4 w-4 text-gray-300" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-300">Admin Panel</p>
                  <p className="text-xs text-gray-400">v1.0.0</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
