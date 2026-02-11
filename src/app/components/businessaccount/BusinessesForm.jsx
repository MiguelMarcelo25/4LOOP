'use client';

import Link from 'next/link';
import { MdBusiness, MdAddBusiness, MdHelpOutline } from 'react-icons/md';

export default function BusinessesForm() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* 💡 Help and Guidance Section */}
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-white dark:from-slate-800 dark:to-slate-900 border border-blue-100 dark:border-slate-700 rounded-xl p-6 shadow-sm flex items-start gap-4">
        <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full text-blue-600 dark:text-blue-300">
          <MdHelpOutline size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-slate-200 mb-1">Need Help?</h3>
          <p className="text-gray-600 dark:text-slate-400">
            Learn more about the sanitation permit process and requirements. Visit our{' '}
            <Link
              href="/businessaccount/help"
              className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
            >
              Help Page
            </Link>
            .
          </p>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-200 mb-6">Manage Businesses</h1>

      {/* 🏢 Business Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          className="group bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
          onClick={() =>
            (window.location.href = '/businessaccount/businesses/businesslist')
          }
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/30 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex flex-col items-start">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg text-blue-600 dark:text-blue-300 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <MdBusiness size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-slate-200 mb-2">Business Lists</h2>
            <p className="text-gray-600 dark:text-slate-400 group-hover:text-gray-700 dark:group-hover:text-slate-300">
              View and manage your registered businesses. Check status and details.
            </p>
          </div>
        </div>

        <div
          className="group bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
          onClick={() =>
            (window.location.href = '/businessaccount/businesses/addbusiness')
          }
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 dark:bg-green-900/30 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex flex-col items-start">
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg text-green-600 dark:text-green-300 mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
              <MdAddBusiness size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-slate-200 mb-2">Add a Business</h2>
            <p className="text-gray-600 dark:text-slate-400 group-hover:text-gray-700 dark:group-hover:text-slate-300">
              Register a new business to your account. Start the application process.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
