
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { User, UserRole, Query, AppState, Notice, ChatMessage } from './types';
import AuthPage from './pages/AuthPage';
import ResidentDashboard from './pages/ResidentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import NewQueryPage from './pages/NewQueryPage';
import QueryDetailPage from './pages/QueryDetailPage';
import CommunityPage from './pages/CommunityPage';

// Context for global state
interface AppContextType {
  state: AppState;
  login: (houseNumber: string, password?: string) => { success: boolean; message?: string };
  signup: (houseNumber: string, phone: string, role: UserRole, password?: string) => void;
  logout: () => void;
  addQuery: (query: Omit<Query, 'id' | 'createdAt' | 'timeline' | 'status'>) => void;
  updateQuery: (queryId: string, updates: Partial<Query>) => void;
  updateUserRole: (houseNumber: string, role: UserRole) => void;
  changePassword: (oldPin: string, newPin: string) => { success: boolean; message: string };
  resetUserPassword: (houseNumber: string, newPin?: string) => { success: boolean; message: string };
  postNotice: (title: string, content: string, type: 'INFO' | 'ALERT' | 'EVENT') => void;
  postChatMessage: (content: string, type: 'GROUP' | 'DIRECT', recipientHouse?: string) => void;
  deleteNotice: (id: string) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const isAuthPage = location.pathname === '/login';
    return (
        <div className={`min-h-screen flex flex-col relative font-sans ${isAuthPage ? '' : 'bg-gray-50'}`}>
            {children}
        </div>
    );
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('society_app_data_v4');
    return saved ? JSON.parse(saved) : {
      users: [
        { houseNumber: 'SA01', phone: '00000000000', role: UserRole.SUPER_ADMIN, password: '123' }
      ],
      queries: [],
      notices: [],
      chatMessages: [],
      currentUser: null
    };
  });

  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [pinForm, setPinForm] = useState({ old: '', new: '', confirm: '' });
  const [pinMsg, setPinMsg] = useState('');

  useEffect(() => {
    localStorage.setItem('society_app_data_v4', JSON.stringify(state));
  }, [state]);

  const login = (houseNumber: string, password?: string) => {
    const user = state.users.find(u => u.houseNumber === houseNumber);
    if (!user) {
      return { success: false, message: 'User not found.' };
    }
    
    if (user.password) {
      if (user.password !== password) {
        return { success: false, message: 'Invalid Credentials.' };
      }
    }

    setState(prev => ({ ...prev, currentUser: user }));
    return { success: true };
  };

  const signup = (houseNumber: string, phone: string, role: UserRole, password?: string) => {
    const newUser: User = {
      houseNumber,
      phone,
      role: role,
      password 
    };
    setState(prev => ({
      ...prev,
      users: [...prev.users, newUser],
      currentUser: newUser
    }));
  };

  const logout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
    setShowChangePinModal(false);
  };

  const addQuery = (queryData: any) => {
    const newQuery: Query = {
      ...queryData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
      status: 'NEW' as any,
      timeline: [{ status: 'NEW' as any, timestamp: Date.now(), message: 'Query submitted successfully.' }]
    };
    setState(prev => ({
      ...prev,
      queries: [newQuery, ...prev.queries]
    }));
  };

  const updateQuery = (queryId: string, updates: Partial<Query>) => {
    setState(prev => ({
      ...prev,
      queries: prev.queries.map(q => q.id === queryId ? { ...q, ...updates } : q)
    }));
  };

  const updateUserRole = (houseNumber: string, role: UserRole) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.houseNumber === houseNumber ? { ...u, role } : u)
    }));
  };

  const changePassword = (oldPin: string, newPin: string) => {
    if (!state.currentUser) return { success: false, message: "Not logged in" };
    
    if (state.currentUser.password !== oldPin) {
      return { success: false, message: "Old PIN is incorrect." };
    }

    const updatedUser = { ...state.currentUser, password: newPin };
    
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.houseNumber === state.currentUser?.houseNumber ? updatedUser : u),
      currentUser: updatedUser
    }));

    return { success: true, message: "PIN changed successfully." };
  };

  const resetUserPassword = (houseNumber: string, newPin?: string) => {
    const target = houseNumber.trim().toUpperCase();
    const passwordToSet = newPin || '1234';
    
    const userExists = state.users.some(u => u.houseNumber === target);
    if (!userExists) {
      return { success: false, message: `User ${target} not found.` };
    }

    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.houseNumber === target ? { ...u, password: passwordToSet } : u)
    }));
    
    return { success: true, message: `Password for ${target} has been reset.` };
  };

  const postNotice = (title: string, content: string, type: 'INFO' | 'ALERT' | 'EVENT') => {
    if (!state.currentUser) return;
    const newNotice: Notice = {
      id: Date.now().toString(),
      title,
      content,
      type,
      timestamp: Date.now(),
      author: state.currentUser.houseNumber
    };
    setState(prev => ({ ...prev, notices: [newNotice, ...prev.notices] }));
  };

  const postChatMessage = (content: string, type: 'GROUP' | 'DIRECT', recipientHouse?: string) => {
    if (!state.currentUser) return;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderHouse: state.currentUser.houseNumber,
      senderRole: state.currentUser.role,
      type,
      recipientHouse,
      content,
      timestamp: Date.now()
    };
    setState(prev => ({ ...prev, chatMessages: [...prev.chatMessages, newMessage] }));
  };

  const deleteNotice = (id: string) => {
    setState(prev => ({ ...prev, notices: prev.notices.filter(n => n.id !== id) }));
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinForm.new !== pinForm.confirm) {
      setPinMsg("New PINs do not match.");
      return;
    }
    if (pinForm.new.length < 3) {
      setPinMsg("PIN must be at least 3 characters.");
      return;
    }

    const result = changePassword(pinForm.old, pinForm.new);
    if (result.success) {
      alert("Success! Your PIN has been updated.");
      setShowChangePinModal(false);
      setPinForm({ old: '', new: '', confirm: '' });
      setPinMsg('');
    } else {
      setPinMsg(result.message);
    }
  };

  return (
    <AppContext.Provider value={{ state, login, signup, logout, addQuery, updateQuery, updateUserRole, changePassword, resetUserPassword, postNotice, postChatMessage, deleteNotice }}>
      <HashRouter>
        <Layout>
          {state.currentUser && (
            <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl rounded-full bg-white/80 backdrop-blur-md shadow-2xl shadow-indigo-500/10 border border-white/50 px-6 py-3 flex justify-between items-center z-50 transition-all duration-300">
              <div className="flex items-center gap-6">
                <Link to="/" className="text-xl font-black text-indigo-600 flex items-center gap-2 tracking-tighter hover:scale-105 transition-transform">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                  </div>
                  <span className="hidden sm:inline bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">SocietyHub</span>
                </Link>
                <Link to="/community" className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 transition-all group">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  <span className="text-xs font-bold uppercase tracking-widest hidden md:inline">Community</span>
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-gray-800 leading-none">{state.currentUser.houseNumber}</p>
                  <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-0.5">{state.currentUser.role.replace('_', ' ')}</p>
                </div>
                <div className="h-8 w-[1px] bg-gray-200 hidden sm:block"></div>
                <button 
                  onClick={() => setShowChangePinModal(true)}
                  className="p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-gray-100 transition-colors"
                  title="Change PIN"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </button>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-red-100 text-red-500 rounded-full hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
                >
                  Logout
                </button>
              </div>
            </nav>
          )}

          {/* Change PIN Modal */}
          {showChangePinModal && (
            <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
              <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-white/20">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-6 text-center">Security Check</h3>
                <form onSubmit={handlePinSubmit} className="space-y-4">
                  <div>
                    <input 
                      type="password" 
                      placeholder="Current PIN" 
                      className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-gray-800 text-center tracking-[0.5em] transition-all"
                      value={pinForm.old}
                      onChange={e => setPinForm({...pinForm, old: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="password" 
                      placeholder="New PIN" 
                      className="w-full px-4 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-gray-800 text-center tracking-widest text-xs transition-all"
                      value={pinForm.new}
                      onChange={e => setPinForm({...pinForm, new: e.target.value})}
                      required
                    />
                     <input 
                      type="password" 
                      placeholder="Confirm" 
                      className="w-full px-4 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-gray-800 text-center tracking-widest text-xs transition-all"
                      value={pinForm.confirm}
                      onChange={e => setPinForm({...pinForm, confirm: e.target.value})}
                      required
                    />
                  </div>
                  
                  {pinMsg && <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-lg">{pinMsg}</p>}

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => { setShowChangePinModal(false); setPinMsg(''); setPinForm({old:'',new:'',confirm:''}); }} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-colors">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] transition-all">Update PIN</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <main className={`flex-1 w-full ${state.currentUser ? 'pt-28 pb-10 px-4' : ''} max-w-7xl mx-auto`}>
            <Routes>
              <Route path="/login" element={state.currentUser ? <Navigate to="/" /> : <AuthPage />} />
              <Route path="/" element={
                !state.currentUser ? <Navigate to="/login" /> :
                state.currentUser.role === UserRole.SUPER_ADMIN ? <SuperAdminDashboard /> :
                state.currentUser.role === UserRole.ADMIN ? <AdminDashboard /> :
                <ResidentDashboard />
              } />
              <Route path="/new-query" element={state.currentUser?.role === UserRole.RESIDENT ? <NewQueryPage /> : <Navigate to="/" />} />
              <Route path="/query/:id" element={state.currentUser ? <QueryDetailPage /> : <Navigate to="/login" />} />
              <Route path="/community" element={state.currentUser ? <CommunityPage /> : <Navigate to="/login" />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </Layout>
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;
