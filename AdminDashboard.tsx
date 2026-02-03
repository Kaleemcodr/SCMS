
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../App';
import { QueryStatus } from '../types';

const ADMIN_HERO = "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1974&auto=format&fit=crop";

const AdminDashboard: React.FC = () => {
  const { state } = useApp();
  const [filter, setFilter] = useState<QueryStatus | 'ALL'>('ALL');

  const filteredQueries = filter === 'ALL'
    ? state.queries
    : state.queries.filter(q => q.status === filter);

  const getStatusBadge = (status: QueryStatus) => {
    switch(status) {
      case QueryStatus.NEW: return <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">NEW</span>;
      case QueryStatus.UNDER_REVIEW: return <span className="bg-yellow-100 text-yellow-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">REVIEW</span>;
      case QueryStatus.UNDER_PROCESS: return <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">FIXING</span>;
      case QueryStatus.BIG_ISSUE: return <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">BIG ISSUE</span>;
      case QueryStatus.RESOLVED: return <span className="bg-green-100 text-green-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">RESOLVED</span>;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-8 pb-10">
      
      {/* Hero Section */}
      <div className="relative h-64 rounded-[3rem] overflow-hidden shadow-2xl bg-gray-800 flex items-center justify-between">
         <div className="flex-1 pl-12 pr-4 z-10">
           <p className="text-emerald-300 text-xs font-bold uppercase tracking-[0.3em] mb-2">Control Center</p>
           <h1 className="text-4xl font-black text-white tracking-tight">Issue Management</h1>
           <p className="text-gray-300 text-xs font-medium mt-4 max-w-sm leading-relaxed">
             Coordinate support, resolve queries, and assist residents efficiently.
           </p>
         </div>
         <div className="w-[50%] h-full relative">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-800/40 to-transparent z-10"></div>
            <img src={ADMIN_HERO} alt="Support Team" className="w-full h-full object-cover opacity-90 grayscale hover:grayscale-0 transition-all duration-700" />
         </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 px-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Active Queries</h2>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Filter by Status</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto p-1.5 bg-white rounded-2xl shadow-sm border border-gray-100">
          {(['ALL', ...Object.values(QueryStatus)] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${filter === s ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-50 divide-y divide-gray-50 overflow-hidden mx-2">
        {filteredQueries.length === 0 ? (
          <div className="p-24 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            </div>
            <p className="text-gray-300 font-bold uppercase tracking-widest text-xs">No queries found</p>
          </div>
        ) : (
          filteredQueries.map(query => (
            <Link
              key={query.id}
              to={`/query/${query.id}`}
              className="flex items-center gap-6 p-6 hover:bg-gray-50 transition-colors group relative"
            >
              <div className="flex-shrink-0 relative">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-white rounded-2xl flex items-center justify-center border border-indigo-100 shadow-sm group-hover:scale-110 transition-transform">
                  <span className="text-indigo-600 font-black text-xs">{query.residentHouseNumber.substring(0, 3)}</span>
                </div>
                {query.status === QueryStatus.NEW && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse shadow-md"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-black text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">HOUSE {query.residentHouseNumber}</h3>
                  <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{new Date(query.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-gray-500 truncate italic">
                  "{query.description || "Issue report with attachments"}"
                </p>
                <div className="flex gap-2 mt-3">
                  {getStatusBadge(query.status)}
                  {query.image && <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-400 text-[10px] font-bold">IMAGE</span>}
                  {query.voiceMail && <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-400 text-[10px] font-bold">VOICE</span>}
                </div>
              </div>
              <div className="flex-shrink-0 text-gray-200 group-hover:text-indigo-400 transition-colors group-hover:translate-x-1 duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
