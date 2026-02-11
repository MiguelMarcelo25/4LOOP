'use client';

import { useRouter } from 'next/navigation';
import { MdNoteAdd, MdFindInPage } from 'react-icons/md';

export default function BusinessRequestForm() {
  const router = useRouter();

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-200 mb-6">Make a Request</h1>

      {/* ✨ Request Type Cards with Routing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          onClick={() => router.push('/businessaccount/request/newbusiness')}
          className="group bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
        >
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 dark:bg-blue-900/30 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
           <div className="relative z-10 flex flex-col items-start">
             <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg text-blue-600 dark:text-blue-300 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
               <MdNoteAdd size={32} />
             </div>
             <h2 className="text-xl font-bold text-gray-800 dark:text-slate-200 mb-2">New Sanitation Permit Request</h2>
             <p className="text-gray-600 dark:text-slate-400 group-hover:text-gray-700 dark:group-hover:text-slate-300">
               Start a new business registration process and submit your application.
             </p>
           </div>
        </div>

        <div
          onClick={() => router.push('/businessaccount/request/requestsent')}
          className="group bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 dark:bg-purple-900/30 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10 flex flex-col items-start">
            <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg text-purple-600 dark:text-purple-300 mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <MdFindInPage size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-slate-200 mb-2">Check Your Request</h2>
            <p className="text-gray-600 dark:text-slate-400 group-hover:text-gray-700 dark:group-hover:text-slate-300">
              Review the status of your submitted requests or make edits if allowed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
