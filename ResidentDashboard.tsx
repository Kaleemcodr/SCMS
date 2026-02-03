
import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../App';
import QueryCard from '../components/QueryCard';

const RESIDENT_HERO = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop";

const ResidentDashboard: React.FC = () => {
  const { state } = useApp();
  const residentQueries = state.queries.filter(q => q.residentHouseNumber === state.currentUser?.houseNumber);

  return (
    <div className="space-y-8 pb-20">
      
      {/* Hero Section */}
      <div className="relative h-64 rounded-[3rem] overflow-hidden shadow-2xl bg-[#F5F5DC] flex items-center justify-between">
        <div className="flex-1 pl-12 pr-4 z-10">
          <p className="text-indigo-600 text-xs font-bold uppercase tracking-[0.3em] mb-2">Welcome Home</p>
          <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">House {state.currentUser?.houseNumber}</h1>
          <p className="text-gray-600 text-sm font-medium max-w-md leading-relaxed">
            Report issues, track progress, and communicate with society administration seamlessly.
          </p>
        </div>
        <div className="w-[60%] h-full relative">
           <div className="absolute inset-0 bg-gradient-to-r from-[#F5F5DC] via-[#F5F5DC]/60 to-transparent z-10"></div>
           <img src={RESIDENT_HERO} alt="Community" className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="flex justify-between items-end px-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Your Reports</h2>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
            {residentQueries.length} Total Submissions
          </p>
        </div>
        <Link to="/new-query" className="hidden md:inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold uppercase text-xs hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
          Lodge Complaint
        </Link>
      </div>

      {residentQueries.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[3rem] shadow-xl border border-gray-100 mx-4">
          <div className="bg-gradient-to-br from-indigo-50 to-white w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-indigo-50">
            <svg className="w-10 h-10 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">All Clear!</h3>
          <p className="text-gray-400 mb-8 text-sm">You haven't reported any issues yet.</p>
          <Link to="/new-query" className="inline-flex items-center px-8 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black shadow-xl transition-transform hover:scale-105">
            Lodge New Query
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {residentQueries.map(query => (
            <Link key={query.id} to={`/query/${query.id}`} className="block transition-transform hover:scale-[1.01]">
              <QueryCard query={query} />
            </Link>
          ))}
        </div>
      )}

      {/* Floating Action Button for mobile */}
      <Link
        to="/new-query"
        className="md:hidden fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl shadow-indigo-400/50 flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-90 z-40 border-4 border-white/20 backdrop-blur-sm"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
      </Link>
    </div>
  );
};

export default ResidentDashboard;
