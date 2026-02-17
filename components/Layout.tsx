
import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">EduGen <span className="text-indigo-600">AI</span></h1>
          </div>
          <div className="text-sm font-medium text-slate-500">
            Intelligent Exam Designer
          </div>
        </div>
      </header>
      <main className="flex-grow">
        {children}
      </main>
      <footer className="bg-slate-50 border-t border-slate-200 py-8 no-print">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} EduGen AI. Professional Suite.
        </div>
      </footer>
    </div>
  );
};
