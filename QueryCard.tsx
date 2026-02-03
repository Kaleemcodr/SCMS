
import React from 'react';
import { Query, QueryStatus } from '../types';

interface QueryCardProps {
  query: Query;
}

const QueryCard: React.FC<QueryCardProps> = ({ query }) => {
  const getStatusStyle = (status: QueryStatus) => {
    switch (status) {
      case QueryStatus.NEW: return 'bg-blue-50 text-blue-600 border-blue-100';
      case QueryStatus.UNDER_REVIEW: return 'bg-yellow-50 text-yellow-600 border-yellow-100';
      case QueryStatus.UNDER_PROCESS: return 'bg-orange-50 text-orange-600 border-orange-100';
      case QueryStatus.BIG_ISSUE: return 'bg-purple-50 text-purple-600 border-purple-100';
      case QueryStatus.RESOLVED: return 'bg-green-50 text-green-600 border-green-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const getStatusDot = (status: QueryStatus) => {
      switch (status) {
      case QueryStatus.NEW: return 'bg-blue-500';
      case QueryStatus.UNDER_REVIEW: return 'bg-yellow-500';
      case QueryStatus.UNDER_PROCESS: return 'bg-orange-500';
      case QueryStatus.BIG_ISSUE: return 'bg-purple-500';
      case QueryStatus.RESOLVED: return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  }

  return (
    <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-100 border border-white p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-100/50 hover:-translate-y-1 group relative overflow-hidden">
      {/* Decorative gradient blob */}
      <div className="absolute -right-10 -top-10 w-24 h-24 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div className="flex justify-between items-start mb-4 relative">
        <div className={`px-3 py-1.5 rounded-xl border ${getStatusStyle(query.status)} flex items-center gap-2`}>
           <div className={`w-1.5 h-1.5 rounded-full ${getStatusDot(query.status)} animate-pulse`}></div>
           <span className="text-[10px] font-black uppercase tracking-widest">{query.status.replace('_', ' ')}</span>
        </div>
        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{new Date(query.createdAt).toLocaleDateString()}</span>
      </div>

      <div className="mb-6 relative">
          <h3 className="text-gray-900 font-bold text-lg mb-1 leading-tight line-clamp-2">
            {query.description || "Issue Report"}
          </h3>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">House {query.residentHouseNumber}</p>
      </div>

      <div className="flex justify-between items-center relative">
        <div className="flex gap-2">
          {query.image && (
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100" title="Photo Attached">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
          )}
          {query.voiceMail && (
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100" title="Voice Note Attached">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
              </div>
          )}
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm group-hover:shadow-indigo-300">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7-7 7"></path></svg>
        </div>
      </div>
    </div>
  );
};

export default QueryCard;
