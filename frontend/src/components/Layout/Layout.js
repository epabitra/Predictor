import React from 'react';
import Header from './Header';

const Layout = ({ children }) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
