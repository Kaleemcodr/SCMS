
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../App';
import { UserRole } from '../types';

const CommunityPage: React.FC = () => {
  const { state, postNotice, postChatMessage, deleteNotice } = useApp();
  const [activeTab, setActiveTab] = useState<'notices' | 'chat'>('notices');
  
  // Notice Form State
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeType, setNoticeType] = useState<'INFO' | 'ALERT' | 'EVENT'>('INFO');
  const [showNoticeForm, setShowNoticeForm] = useState(false);

  // Chat State
  const [activeChatUser, setActiveChatUser] = useState<string | null>(null); // null = Group Chat, string = HouseNumber
  const [chatInput, setChatInput] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const isAdmin = state.currentUser?.role === UserRole.ADMIN || state.currentUser?.role === UserRole.SUPER_ADMIN;

  useEffect(() => {
    if (activeTab === 'chat' && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [state.chatMessages, activeTab, activeChatUser]);

  const handlePostNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;
    postNotice(noticeTitle, noticeContent, noticeType);
    setNoticeTitle('');
    setNoticeContent('');
    setShowNoticeForm(false);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    if (activeChatUser) {
        postChatMessage(chatInput, 'DIRECT', activeChatUser);
    } else {
        postChatMessage(chatInput, 'GROUP');
    }
    setChatInput('');
  };

  // Organize users for contact list
  const otherUsers = state.users.filter(u => u.houseNumber !== state.currentUser?.houseNumber);
  const admins = otherUsers.filter(u => u.role !== UserRole.RESIDENT);
  const residents = otherUsers.filter(u => u.role === UserRole.RESIDENT);

  // Filter messages based on active conversation
  const displayedMessages = state.chatMessages.filter(msg => {
      if (activeChatUser) {
          // Direct Message Logic
          const isRelevant = 
             (msg.type === 'DIRECT') &&
             ((msg.senderHouse === state.currentUser?.houseNumber && msg.recipientHouse === activeChatUser) ||
              (msg.senderHouse === activeChatUser && msg.recipientHouse === state.currentUser?.houseNumber));
          return isRelevant;
      } else {
          // Group Chat Logic
          return msg.type === 'GROUP' || !msg.type; // Backwards compatibility with !msg.type
      }
  });

  return (
    <div className="space-y-6 pb-20 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex flex-col gap-1 shrink-0">
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Community Hub</h1>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Connect with neighbors & Administration</p>
      </div>

      {/* Tabs */}
      <div className="bg-white p-2 rounded-[2rem] flex relative shrink-0 shadow-lg shadow-gray-100 border border-gray-50">
        <button
          onClick={() => setActiveTab('notices')}
          className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'notices' ? 'bg-gray-900 text-white shadow-xl' : 'text-gray-400 hover:bg-gray-50'}`}
        >
          Notice Board
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'text-gray-400 hover:bg-gray-50'}`}
        >
          Messenger
        </button>
      </div>

      {activeTab === 'notices' ? (
        <div className="space-y-6 overflow-y-auto h-full pb-20 pr-2 custom-scrollbar">
          {/* Admin Action: Post Notice */}
          {isAdmin && (
            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-100/50">
              {!showNoticeForm ? (
                <button 
                  onClick={() => setShowNoticeForm(true)}
                  className="w-full py-6 border-2 border-dashed border-indigo-100 text-indigo-400 rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-3 hover:scale-[1.01]"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                  </div>
                  Compose New Announcement
                </button>
              ) : (
                <form onSubmit={handlePostNotice} className="space-y-6 animate-in fade-in slide-in-from-top-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600">Drafting Notice</h3>
                    <button type="button" onClick={() => setShowNoticeForm(false)} className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Subject Line"
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 outline-none font-bold text-gray-800 text-sm transition-all"
                    value={noticeTitle}
                    onChange={e => setNoticeTitle(e.target.value)}
                    required
                  />
                  <div className="flex gap-3">
                    {(['INFO', 'ALERT', 'EVENT'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNoticeType(type)}
                        className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all ${
                          noticeType === type 
                            ? type === 'ALERT' ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-200' 
                            : type === 'EVENT' ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-200' 
                            : 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-200'
                            : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <textarea
                    placeholder="Message Details..."
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 outline-none font-medium text-gray-700 text-sm h-32 resize-none transition-all"
                    value={noticeContent}
                    onChange={e => setNoticeContent(e.target.value)}
                    required
                  />
                  <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-indigo-700 hover:scale-[1.01] transition-all">
                    Publish to Society
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Notices List */}
          <div className="space-y-6">
            {state.notices.length === 0 ? (
               <div className="text-center py-24 text-gray-300 font-bold uppercase text-xs tracking-widest">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                     <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
                  </div>
                  No notices posted yet
               </div>
            ) : (
              state.notices.map(notice => (
                <div 
                  key={notice.id} 
                  className={`p-8 rounded-[3rem] shadow-xl bg-white relative group overflow-hidden border border-white ${
                    notice.type === 'ALERT' ? 'shadow-red-100' :
                    notice.type === 'EVENT' ? 'shadow-emerald-100' :
                    'shadow-blue-100'
                  }`}
                >
                  {/* Background Decoration */}
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2 ${
                     notice.type === 'ALERT' ? 'bg-red-500' :
                     notice.type === 'EVENT' ? 'bg-emerald-500' :
                     'bg-blue-500'
                  }`}></div>

                  {isAdmin && (
                    <button 
                      onClick={() => { if(window.confirm('Delete this notice?')) deleteNotice(notice.id); }}
                      className="absolute top-6 right-8 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  )}
                  <div className="flex justify-between items-start mb-4 relative z-0">
                    <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${
                      notice.type === 'ALERT' ? 'bg-red-500 text-white' :
                      notice.type === 'EVENT' ? 'bg-emerald-500 text-white' :
                      'bg-blue-500 text-white'
                    }`}>
                      {notice.type}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(notice.timestamp).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-3 relative z-0">{notice.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap relative z-0">{notice.content}</p>
                  <div className="mt-6 flex items-center gap-2 relative z-0">
                     <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-500">
                        {notice.author.substring(0,2)}
                     </div>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Posted by House {notice.author}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-gray-50 h-full flex overflow-hidden">
          
          {/* CONTACT LIST SIDEBAR */}
          <div className="w-1/3 border-r border-gray-50 flex flex-col bg-gray-50/30">
             <div className="p-6 border-b border-gray-50 bg-white/50 backdrop-blur-sm">
               <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Conversations</h3>
             </div>
             <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                {/* General Group Button */}
                <button
                  onClick={() => setActiveChatUser(null)}
                  className={`w-full text-left p-4 rounded-[2rem] flex items-center gap-4 transition-all group ${
                    activeChatUser === null ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-[1.02]' : 'hover:bg-white hover:shadow-md text-gray-600'
                  }`}
                >
                   <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${activeChatUser === null ? 'bg-white/20' : 'bg-indigo-100 text-indigo-600'}`}>
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                   </div>
                   <div>
                     <p className="text-xs font-black leading-tight">General Group</p>
                     <p className={`text-[8px] uppercase tracking-wider mt-0.5 ${activeChatUser === null ? 'text-indigo-200' : 'text-gray-400'}`}>Society Wide</p>
                   </div>
                </button>

                {/* Admins List */}
                {admins.length > 0 && (
                  <div className="pt-4 px-2">
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-2 pl-2">Administration</p>
                    {admins.map(admin => (
                      <button
                        key={admin.houseNumber}
                        onClick={() => setActiveChatUser(admin.houseNumber)}
                        className={`w-full text-left p-3 rounded-[1.5rem] flex items-center gap-3 mb-1 transition-all ${
                          activeChatUser === admin.houseNumber ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'hover:bg-white hover:shadow-sm text-gray-600'
                        }`}
                      >
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${activeChatUser === admin.houseNumber ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-600'}`}>
                           {admin.houseNumber.substring(0,2)}
                         </div>
                         <div className="min-w-0">
                           <p className="text-xs font-bold leading-tight truncate">{admin.houseNumber}</p>
                           <p className={`text-[8px] uppercase tracking-wider truncate ${activeChatUser === admin.houseNumber ? 'opacity-70' : 'text-gray-400'}`}>{admin.role.replace('_', ' ')}</p>
                         </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Residents List */}
                {residents.length > 0 && (
                  <div className="pt-4 px-2">
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-2 pl-2">Neighbors</p>
                    {residents.map(res => (
                      <button
                        key={res.houseNumber}
                        onClick={() => setActiveChatUser(res.houseNumber)}
                        className={`w-full text-left p-3 rounded-[1.5rem] flex items-center gap-3 mb-1 transition-all ${
                          activeChatUser === res.houseNumber ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'hover:bg-white hover:shadow-sm text-gray-600'
                        }`}
                      >
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${activeChatUser === res.houseNumber ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                           {res.houseNumber.substring(0,2)}
                         </div>
                         <p className="text-xs font-bold leading-tight truncate">{res.houseNumber}</p>
                      </button>
                    ))}
                  </div>
                )}
             </div>
          </div>

          {/* CHAT WINDOW */}
          <div className="w-2/3 flex flex-col bg-white relative">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md px-8 py-5 border-b border-gray-50 flex items-center justify-between z-10 sticky top-0">
              <div>
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                    {activeChatUser ? `Private Chat` : 'General Society'}
                    {activeChatUser && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                </h3>
                <p className="text-[10px] font-bold text-gray-400 mt-0.5">
                    {activeChatUser ? `with House ${activeChatUser}` : 'Discussion for all residents'}
                </p>
              </div>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-gray-50/30" ref={chatContainerRef}>
               {displayedMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Quiet in here</p>
                        <p className="text-[10px] text-gray-300 mt-1">Start the conversation</p>
                    </div>
                  </div>
               )}
               {displayedMessages.map(msg => {
                 const isMe = msg.senderHouse === state.currentUser?.houseNumber;
                 return (
                   <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}>
                     <div className={`max-w-[75%] p-4 text-sm shadow-sm transition-all ${
                       isMe 
                         ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-[1.5rem] rounded-tr-sm shadow-indigo-100' 
                         : 'bg-white border border-gray-100 text-gray-700 rounded-[1.5rem] rounded-tl-sm shadow-sm'
                     }`}>
                       {msg.content}
                     </div>
                     <div className="flex items-center gap-2 mt-1.5 px-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">
                          {isMe ? 'You' : `House ${msg.senderHouse}`}
                        </span>
                        {msg.senderRole !== UserRole.RESIDENT && (
                          <span className="bg-amber-100 text-amber-700 text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            Admin
                          </span>
                        )}
                        <span className="text-[8px] text-gray-300 ml-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                     </div>
                   </div>
                 );
               })}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendChat} className="p-6 bg-white border-t border-gray-50 flex gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.02)] z-10">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder={activeChatUser ? `Message ${activeChatUser}...` : "Message everyone..."}
                className="flex-1 px-6 py-4 rounded-[2rem] bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 outline-none text-sm font-medium transition-all"
              />
              <button 
                type="submit"
                disabled={!chatInput.trim()}
                className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 active:scale-95 disabled:bg-gray-200 disabled:shadow-none transition-all flex items-center justify-center"
              >
                <svg className="w-6 h-6 transform rotate-90 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityPage;
