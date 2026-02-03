
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../App';
import { UserRole, QueryStatus } from '../types';

const SUPER_ADMIN_HERO = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop";

const SuperAdminDashboard: React.FC = () => {
  const { state, updateUserRole, resetUserPassword } = useApp();
  
  // Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [modalError, setModalError] = useState('');

  const handleToggleAdmin = (userHouse: string, currentRole: UserRole) => {
    const newRole = currentRole === UserRole.ADMIN ? UserRole.RESIDENT : UserRole.ADMIN;
    updateUserRole(userHouse, newRole);
  };

  const handleResetClick = (houseNumber: string) => {
    setResetTargetUser(houseNumber);
    setNewPin('');
    setConfirmPin('');
    setModalError('');
    setIsResetModalOpen(true);
  };

  const submitReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin || newPin.length < 3) {
      setModalError('PIN must be at least 3 characters.');
      return;
    }
    if (newPin !== confirmPin) {
      setModalError('Passwords do not match.');
      return;
    }
    if (resetTargetUser) {
      const result = resetUserPassword(resetTargetUser, newPin);
      if (result.success) {
        alert(result.message);
        setIsResetModalOpen(false);
      } else {
        setModalError(result.message);
      }
    }
  };

  const getStatusBadge = (status: QueryStatus) => {
    switch(status) {
      case QueryStatus.NEW: return <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest">NEW</span>;
      case QueryStatus.UNDER_REVIEW: return <span className="bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest">REVIEW</span>;
      case QueryStatus.UNDER_PROCESS: return <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest">FIXING</span>;
      case QueryStatus.BIG_ISSUE: return <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest">BIG ISSUE</span>;
      case QueryStatus.RESOLVED: return <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest">RESOLVED</span>;
      default: return null;
    }
  };

  const nonSuperAdmins = state.users.filter(u => u.role !== UserRole.SUPER_ADMIN);

  // Statistics Calculation
  const totalQueries = state.queries.length;
  const resolvedQueries = state.queries.filter(q => q.status === QueryStatus.RESOLVED).length;
  const pendingQueries = state.queries.filter(q => q.status === QueryStatus.NEW || q.status === QueryStatus.UNDER_REVIEW).length;
  const activeQueries = state.queries.filter(q => q.status === QueryStatus.UNDER_PROCESS || q.status === QueryStatus.BIG_ISSUE).length;
  
  const totalResidents = state.users.filter(u => u.role === UserRole.RESIDENT).length;
  const totalAdmins = state.users.filter(u => u.role === UserRole.ADMIN).length;

  // Metadata Logic for Chat Monitor (Who is talking to whom)
  const conversationPairs = new Map<string, { participants: string[], lastActive: number }>();
  
  state.chatMessages.forEach(msg => {
    if (msg.type === 'DIRECT' && msg.recipientHouse) {
      const participants = [msg.senderHouse, msg.recipientHouse].sort(); // Sort to treat A->B and B->A as same
      const key = participants.join('-');
      
      const current = conversationPairs.get(key);
      if (!current || msg.timestamp > current.lastActive) {
        conversationPairs.set(key, {
          participants,
          lastActive: msg.timestamp
        });
      }
    }
  });

  const activeConversations = Array.from(conversationPairs.values()).sort((a, b) => b.lastActive - a.lastActive);

  return (
    <div className="space-y-10 pb-20">
      
       {/* Hero Section */}
       <div className="relative h-64 rounded-[3rem] overflow-hidden shadow-2xl bg-black flex items-center justify-between">
         <div className="flex-1 pl-12 pr-4 z-10">
           <p className="text-yellow-400 text-xs font-bold uppercase tracking-[0.3em] mb-2">System Oversight</p>
           <h1 className="text-5xl font-black text-white tracking-tight">Administrator Hub</h1>
           <p className="text-gray-400 text-xs font-medium mt-4 max-w-sm leading-relaxed">
             Monitor system performance, manage user roles, and oversee community resolution metrics.
           </p>
         </div>
         <div className="w-[50%] h-full relative">
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10"></div>
            <img src={SUPER_ADMIN_HERO} alt="Analytics Workflow" className="w-full h-full object-cover opacity-80" />
         </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-2">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-gray-100 border border-white flex flex-col justify-between h-44 hover:-translate-y-1 transition-transform duration-300">
           <div className="flex justify-between items-start">
             <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
             </div>
             <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Population</span>
           </div>
           <div>
             <h3 className="text-4xl font-black text-gray-900">{state.users.length}</h3>
             <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-wider">
               {totalAdmins} Admins • {totalResidents} Residents
             </p>
           </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-gray-100 border border-white flex flex-col justify-between h-44 hover:-translate-y-1 transition-transform duration-300">
           <div className="flex justify-between items-start">
             <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             </div>
             <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Resolved</span>
           </div>
           <div>
             <h3 className="text-4xl font-black text-gray-900">{resolvedQueries}</h3>
             <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-wider">
               {totalQueries > 0 ? Math.round((resolvedQueries / totalQueries) * 100) : 0}% Resolution Rate
             </p>
           </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-gray-100 border border-white flex flex-col justify-between h-44 hover:-translate-y-1 transition-transform duration-300">
           <div className="flex justify-between items-start">
             <div className="p-4 bg-orange-50 rounded-2xl text-orange-600">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
             </div>
             <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">In Progress</span>
           </div>
           <div>
             <h3 className="text-4xl font-black text-gray-900">{activeQueries}</h3>
             <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-wider">
               Under Repair
             </p>
           </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-gray-100 border border-white flex flex-col justify-between h-44 hover:-translate-y-1 transition-transform duration-300">
           <div className="flex justify-between items-start">
             <div className="p-4 bg-red-50 rounded-2xl text-red-600">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             </div>
             <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Pending</span>
           </div>
           <div>
             <h3 className="text-4xl font-black text-gray-900">{pendingQueries}</h3>
             <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-wider">
               Awaiting Review
             </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* GLOBAL ISSUE OVERSIGHT */}
        <div className="space-y-6">
            <div className="flex justify-between items-end px-4">
              <div>
                  <h2 className="text-2xl font-black text-gray-900">Issue Oversight</h2>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Audit process logs & resolutions</p>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] shadow-xl shadow-gray-200/50 border border-gray-50 overflow-hidden h-[500px] overflow-y-auto custom-scrollbar">
              <div className="p-2">
                {state.queries.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">No Active Queries</div>
                ) : (
                  state.queries.map(query => (
                    <Link to={`/query/${query.id}`} key={query.id} className="block p-4 hover:bg-gray-50 rounded-[2rem] transition-colors mb-2">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-500">
                              {query.residentHouseNumber.substring(0,3)}
                           </div>
                           <span className="text-xs font-black text-gray-900">House {query.residentHouseNumber}</span>
                        </div>
                        {getStatusBadge(query.status)}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 pl-10 mb-2 italic">
                        "{query.description || 'No written description'}"
                      </p>
                      <div className="pl-10 flex gap-4">
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${
                          query.solution?.aiVerification && !query.solution.aiVerification.isResolved ? 'text-red-600' : 
                          query.status === QueryStatus.RESOLVED ? 'text-green-600' :
                          query.status === QueryStatus.BIG_ISSUE ? 'text-purple-600' :
                          query.status === QueryStatus.UNDER_PROCESS ? 'text-orange-500' :
                          query.status === QueryStatus.UNDER_REVIEW ? 'text-yellow-600' :
                          'text-gray-400'
                        }`}>
                          STATUS: {
                            query.solution?.aiVerification && !query.solution.aiVerification.isResolved ? "FAILED AI AUDIT" :
                            query.status === QueryStatus.NEW ? "AWAITING REVIEW" :
                            query.status === QueryStatus.UNDER_REVIEW ? "UNDER REVIEW" :
                            query.status === QueryStatus.UNDER_PROCESS ? "IN PROGRESS" :
                            query.status === QueryStatus.BIG_ISSUE ? "BIG ISSUE" :
                            query.status === QueryStatus.RESOLVED ? "RESOLVED" :
                            "UNKNOWN"
                          }
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
        </div>

        {/* PRIVATE CONVERSATION MONITOR */}
        <div className="space-y-6">
            <div className="flex justify-between items-end px-4">
              <div>
                  <h2 className="text-2xl font-black text-gray-900">Chat Monitor</h2>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Active Private Channels (Metadata Only)</p>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] shadow-xl shadow-gray-200/50 border border-gray-50 overflow-hidden h-[500px] overflow-y-auto custom-scrollbar">
              {activeConversations.length === 0 ? (
                 <div className="p-24 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                       <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                    </div>
                    <p className="text-gray-300 font-bold uppercase tracking-widest text-xs">No active direct messages</p>
                 </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {activeConversations.map((conv, idx) => (
                    <div key={idx} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex -space-x-3">
                           <div className="w-10 h-10 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-indigo-600 shadow-sm z-10">
                              {conv.participants[0]}
                           </div>
                           <div className="w-10 h-10 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-purple-600 shadow-sm z-0">
                              {conv.participants[1]}
                           </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <span className="text-xs font-black text-gray-900">{conv.participants[0]}</span>
                             <span className="text-gray-300 text-[10px]">↔</span>
                             <span className="text-xs font-black text-gray-900">{conv.participants[1]}</span>
                          </div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                             Private Channel Active
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                         <span className="block text-[9px] font-bold text-gray-300 uppercase tracking-widest">Last Activity</span>
                         <span className="text-xs font-medium text-gray-600">{new Date(conv.lastActive).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                         <span className="block text-[9px] text-gray-300">{new Date(conv.lastActive).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
        </div>
      </div>

      {/* USER MANAGEMENT */}
      <div className="space-y-6">
        <div className="flex justify-between items-end px-4">
            <div>
                <h2 className="text-2xl font-black text-gray-900">Users</h2>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Manage Roles & Access</p>
            </div>
            <div className="bg-gray-900 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                {nonSuperAdmins.length} Total
            </div>
        </div>

        <div className="bg-white rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-gray-50 overflow-hidden mx-2">
          <table className="w-full text-left">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">House</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Role</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {nonSuperAdmins.map(user => (
                <tr key={user.houseNumber} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-8 py-6 font-black text-gray-900 text-sm">{user.houseNumber}</td>
                  <td className="px-8 py-6 text-sm font-medium text-gray-500 font-mono tracking-wide">{user.phone}</td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700 shadow-sm' : 'bg-gray-100 text-gray-500'}`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right flex justify-end gap-3">
                     <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleResetClick(user.houseNumber);
                        }}
                        className="px-5 py-3 rounded-xl border-2 border-gray-100 text-gray-500 hover:border-red-100 hover:text-red-500 hover:bg-red-50 text-[9px] font-black uppercase tracking-widest transition-all"
                      >
                        Reset PIN
                      </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleAdmin(user.houseNumber, user.role);
                      }}
                      className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 ${user.role === UserRole.ADMIN ? 'border-2 border-red-100 text-red-500 hover:bg-red-50' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}
                    >
                      {user.role === UserRole.ADMIN ? 'Revoke Admin' : 'Grant Admin'}
                    </button>
                  </td>
                </tr>
              ))}
              {nonSuperAdmins.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-24 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                       <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    </div>
                    <p className="text-gray-300 font-bold uppercase tracking-widest text-xs">No users registered yet</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADMIN RESET PASSWORD MODAL */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl border border-white/20">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-1">Reset Password</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-8">For House: <span className="text-indigo-600">{resetTargetUser}</span></p>
            
            <form onSubmit={submitReset} className="space-y-5">
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">New Password</label>
                <input 
                  type="password" 
                  className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-gray-800 text-lg tracking-widest"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  placeholder="Enter new PIN"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Confirm Password</label>
                <input 
                  type="password" 
                  className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-gray-800 text-lg tracking-widest"
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value)}
                  placeholder="Confirm new PIN"
                />
              </div>
              
              {modalError && <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-lg">{modalError}</p>}

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsResetModalOpen(false)} 
                  className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] transition-all"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
