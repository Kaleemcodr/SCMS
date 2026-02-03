
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { QueryStatus, UserRole } from '../types';
import { GoogleGenAI } from "@google/genai";

const QueryDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, updateQuery } = useApp();
  const query = state.queries.find(q => q.id === id);
  const isAdmin = state.currentUser?.role === UserRole.ADMIN;
  const isResident = state.currentUser?.role === UserRole.RESIDENT;
  // Super Admin view logic: They can see everything but shouldn't trigger automatic status updates
  const isSuperAdmin = state.currentUser?.role === UserRole.SUPER_ADMIN;
  
  const [resolutionText, setResolutionText] = useState('');
  const [resolutionImage, setResolutionImage] = useState<string | null>(null);
  const [resolutionVM, setResolutionVM] = useState<string | null>(null);
  const [resolutionTranscript, setResolutionTranscript] = useState('');
  const [timelineStr, setTimelineStr] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [showBigIssueForm, setShowBigIssueForm] = useState(false);
  const [isVerifyingAI, setIsVerifyingAI] = useState(false);
  const [isTranscribingAdmin, setIsTranscribingAdmin] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true); 
  const [feedbackBtn, setFeedbackBtn] = useState<string | null>(null);

  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Only regular Admins trigger the "Under Review" status when viewing.
    // Super Admins are observers.
    if (isAdmin && !isSuperAdmin && query && query.status === QueryStatus.NEW) {
      updateStatus(QueryStatus.UNDER_REVIEW, "Admin has viewed your query.");
    }
  }, [id, isAdmin, isSuperAdmin, query?.status]);

  if (!query) return <div className="p-8 text-center text-gray-500 font-bold uppercase bg-white min-h-screen">Query not found.</div>;

  const getSupportedMimeType = () => {
    if (typeof MediaRecorder === 'undefined') return 'audio/webm';
    // Prioritize MP4 for Safari/iOS compatibility, then WebM for Chrome/FF
    const types = ['audio/mp4', 'audio/webm', 'audio/ogg', 'audio/wav', 'audio/aac'];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return 'audio/webm';
  };

  const triggerFeedback = (btnId: string) => {
    setFeedbackBtn(btnId);
    setTimeout(() => setFeedbackBtn(null), 600);
  };

  const transcribeAdminAudio = async (base64Audio: string, mimeType: string) => {
    setIsTranscribingAdmin(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const simpleMimeType = mimeType.split(';')[0];
      
      const audioPart = {
        inlineData: {
          mimeType: simpleMimeType,
          data: base64Audio.split(',')[1],
        },
      };
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            audioPart,
            { text: "Listen carefully and transcribe the audio text exactly as spoken. Respond ONLY with the transcript text. If the language is Urdu or Hindi, provide a transliteration." }
          ]
        },
      });

      const transcription = response.text?.trim();
      if (transcription) {
        setResolutionTranscript(transcription);
      }
    } catch (err) {
      console.error("Transcription failed", err);
    } finally {
      setIsTranscribingAdmin(false);
    }
  };

  const performAIVerification = async (fixImage: string) => {
    if (!query.image) return null;
    setIsVerifyingAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const problemImagePart = { inlineData: { mimeType: 'image/png', data: query.image.split(',')[1] } };
      const fixImagePart = { inlineData: { mimeType: 'image/png', data: fixImage.split(',')[1] } };

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            problemImagePart,
            fixImagePart,
            { text: "ACT AS A STRICT SOCIETY AUDITOR. Compare Image 1 (Problem) and Image 2 (Resolution). CHECK CAREFULLY: Is the trash gone? Is the area clean? If the street is still filled with trash or dirty, IT IS NOT FIXED. Respond ONLY with JSON: { 'isResolved': boolean, 'reason': 'Be extremely detailed about what is still dirty if not fixed' }." }
          ]
        },
      });

      const text = response.text;
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      return JSON.parse(text.substring(jsonStart, jsonEnd));
    } catch (err) {
      console.error("AI Audit error", err);
      return { isResolved: true, reason: "Manual check required." };
    } finally {
      setIsVerifyingAI(false);
    }
  };

  const updateStatus = (newStatus: QueryStatus, message: string, timeline?: string) => {
    const updatedTimeline = [
      ...query.timeline,
      { status: newStatus, timestamp: Date.now(), message, timeline }
    ];
    updateQuery(query.id, { status: newStatus, timeline: updatedTimeline });
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionImage || !resolutionVM || !resolutionText.trim()) {
      alert("Admin Resolution requires: 1. Fixed Photo, 2. Voice Summary, and 3. Written Note.");
      return;
    }
    
    if (isVerifyingAI || isTranscribingAdmin) return;
    
    let aiResult = undefined;
    if (resolutionImage && query.image) {
      aiResult = await performAIVerification(resolutionImage);
    }

    if (aiResult && !aiResult.isResolved) {
      // AI Audit Failed
      const failedTimeline = [
        ...query.timeline,
        { 
          status: QueryStatus.UNDER_REVIEW, 
          timestamp: Date.now(), 
          message: "Problem is being fixed. (AI Audit detected incomplete work)" 
        }
      ];
      
      updateQuery(query.id, {
        status: QueryStatus.UNDER_REVIEW,
        timeline: failedTimeline,
        solution: {
          text: resolutionText,
          image: resolutionImage || undefined,
          voiceMail: resolutionVM || undefined,
          resolutionTranscript: resolutionTranscript || undefined,
          aiVerification: aiResult
        }
      });
      alert("AI detected discrepancies. Please check the audit report.");
    } else {
      // AI Audit Passed or No Image
      const updatedTimeline = [
        ...query.timeline,
        { status: QueryStatus.RESOLVED, timestamp: Date.now(), message: "The problem has been resolved by the society admin." }
      ];
      
      updateQuery(query.id, {
        status: QueryStatus.RESOLVED,
        timeline: updatedTimeline,
        solution: {
          text: resolutionText,
          image: resolutionImage || undefined,
          voiceMail: resolutionVM || undefined,
          resolutionTranscript: resolutionTranscript || undefined,
          aiVerification: aiResult
        }
      });
    }
    
    setShowResolveForm(false);
  };

  const handleAdminRecordClick = () => {
    if (resolutionVM) {
      if (window.confirm("Do you want to discard your previous voice note?")) {
        setResolutionVM(null);
        setResolutionTranscript('');
        startRecording();
      }
    } else {
      startRecording();
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Audio recording is not supported on this device or requires a secure (HTTPS) connection.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalMimeType = mediaRecorder.mimeType || mimeType;
        const blob = new Blob(chunksRef.current, { type: finalMimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setResolutionVM(base64);
          transcribeAdminAudio(base64, finalMimeType);
        };
        reader.readAsDataURL(blob);

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(200);
      setRecording(true);
    } catch (err: any) { 
        console.error("Recording error:", err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            alert("Microphone permission denied. Please click the lock icon in your address bar and allow microphone access.");
        } else if (err.name === 'NotFoundError') {
            alert("No microphone found on this device.");
        } else {
            alert("Could not access microphone: " + (err.message || err.name));
        }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        setRecording(false);
    }
  };

  // Determine if original query should be hidden. 
  // It is hidden if there is a solution attempt (whether resolved or rejected).
  const hideOriginalQuery = !!query.solution;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 pt-6 px-4 bg-white min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate(-1)} className="p-4 bg-white rounded-3xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <div className="text-center">
           <h1 className="text-2xl font-black text-gray-900 uppercase tracking-[0.3em]">Query Profile</h1>
           <p className="text-[10px] font-bold text-indigo-400">REFERENCE: #{query.id.toUpperCase()}</p>
        </div>
        <div className="w-12 h-12"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT SIDEBAR (Log + Admin Controls) */}
        <div className="lg:col-span-4 space-y-6 order-1"> 
          {/* PROCESS LOG - TOP LEFT */}
          <div className="bg-white rounded-[3rem] border border-gray-100 shadow-md overflow-hidden">
            <button 
              onClick={() => setShowTimeline(!showTimeline)}
              className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <svg className={`w-5 h-5 text-indigo-500 transition-transform ${showTimeline ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5l7 7-7 7"></path></svg>
                 </div>
                 <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-900">Process Log</span>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">{query.timeline.length} Updates</span>
            </button>
            
            {showTimeline && (
              <div className="px-8 pb-10 pt-4 space-y-10 relative before:absolute before:left-12 before:top-2 before:bottom-12 before:w-1 before:bg-gray-50">
                {query.timeline.map((update, idx) => (
                  <div key={idx} className="relative pl-12">
                    <div className={`absolute left-0 w-8 h-8 rounded-[1rem] border-2 border-white shadow-sm flex items-center justify-center ${
                      update.status === QueryStatus.RESOLVED ? 'bg-green-500' :
                      update.status === QueryStatus.BIG_ISSUE ? 'bg-purple-500' :
                      update.status === QueryStatus.UNDER_PROCESS ? 'bg-orange-500' :
                      update.status === QueryStatus.UNDER_REVIEW ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}>
                       {update.status === QueryStatus.RESOLVED && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path></svg>}
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 uppercase text-[9px] tracking-widest flex items-center gap-2">
                          {update.status.replace('_', ' ')}
                          {update.status === QueryStatus.BIG_ISSUE && update.timeline && (
                            <span className="font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full text-[8px]">ETA: {update.timeline}</span>
                          )}
                      </h4>
                      <p className="text-gray-500 text-xs mt-1 leading-tight">{update.message}</p>
                      <p className="text-[8px] font-bold text-gray-300 mt-1 uppercase tracking-tighter">{new Date(update.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ADMIN MANAGEMENT CONTROLS - STATIONARY BELOW LOG */}
          {/* Controls are only for regular Admin, not Super Admin, and not resolved queries */}
          {isAdmin && !isSuperAdmin && query.status !== QueryStatus.RESOLVED && (
            <div className="bg-white p-6 rounded-[3rem] border border-gray-100 shadow-[0_20px_40px_rgba(0,0,0,0.05)]">
              {!showResolveForm && !showBigIssueForm ? (
                <div className="flex flex-col gap-3">
                  <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-center mb-2">Management Controls</h4>
                  <button
                    onClick={() => {
                        triggerFeedback('on_it');
                        updateStatus(QueryStatus.UNDER_PROCESS, "Admin is working 'On It'.");
                    }}
                    className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg transition-all transform duration-200 ${feedbackBtn === 'on_it' ? 'scale-95 bg-orange-600 ring-4 ring-orange-200' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-100'} text-white`}
                  >
                    {feedbackBtn === 'on_it' ? 'STATUS UPDATED!' : 'On It (Fixing)'}
                  </button>
                  <button
                    onClick={() => {
                        triggerFeedback('big_issue');
                        setShowBigIssueForm(true);
                    }}
                    className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg transition-all transform duration-200 ${feedbackBtn === 'big_issue' ? 'scale-95 bg-purple-700 ring-4 ring-purple-200' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-100'} text-white`}
                  >
                    Mark Big Issue
                  </button>
                  <button
                    onClick={() => {
                        triggerFeedback('resolved');
                        setShowResolveForm(true);
                    }}
                    className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg transition-all transform duration-200 ${feedbackBtn === 'resolved' ? 'scale-95 bg-green-700 ring-4 ring-green-200' : 'bg-green-600 hover:bg-green-700 shadow-green-100'} text-white`}
                  >
                    Mark Resolved
                  </button>
                </div>
              ) : showBigIssueForm ? (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest text-center">Set Timeline</h4>
                  <input
                    type="text"
                    placeholder="Timeline (e.g. Next Thursday)"
                    className="w-full px-6 py-5 rounded-2xl border-2 border-gray-100 text-sm font-black focus:ring-4 focus:ring-purple-50 outline-none transition-all"
                    value={timelineStr}
                    onChange={e => setTimelineStr(e.target.value)}
                  />
                  <div className="flex gap-3">
                    <button onClick={() => setShowBigIssueForm(false)} className="flex-1 py-4 rounded-2xl border-2 border-gray-100 text-[10px] font-black uppercase hover:bg-gray-50">Back</button>
                    <button
                      onClick={() => {
                        updateStatus(QueryStatus.BIG_ISSUE, "Significant work required.", timelineStr);
                        setShowBigIssueForm(false);
                      }}
                      className="flex-2 bg-purple-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] w-full"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-2">
                     <h4 className="text-[10px] font-black text-green-500 uppercase tracking-widest">Resolution Form</h4>
                     <button onClick={() => setShowResolveForm(false)} className="text-gray-400 font-bold text-[10px] uppercase hover:text-red-500">Cancel</button>
                  </div>

                  <div className="space-y-6">
                    <div className="w-full">
                      <label className={`flex flex-col items-center justify-center border-4 border-dashed rounded-3xl h-24 cursor-pointer transition-all ${resolutionImage ? 'border-green-400 bg-green-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 text-center px-4">
                          {resolutionImage ? '📷 Image Captured' : '1. Upload Fix Proof'}
                        </span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => {
                          const reader = new FileReader();
                          reader.onloadend = () => setResolutionImage(reader.result as string);
                          if(e.target.files?.[0]) reader.readAsDataURL(e.target.files[0]);
                        }} />
                      </label>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="w-full relative">
                        {!recording ? (
                          <button type="button" onClick={handleAdminRecordClick} className={`w-full flex flex-col items-center justify-center border-4 border-dashed rounded-3xl h-24 transition-all ${resolutionVM ? 'border-green-400 bg-green-50' : 'border-gray-100 hover:bg-red-50 text-red-400'}`}>
                            <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"></path></svg>
                            <span className="text-[9px] font-black uppercase tracking-widest">{resolutionVM ? 'VOICE RECORDED' : '2. Record Summary'}</span>
                            {resolutionVM && <div className="absolute top-2 right-2 w-2 h-2 bg-green-600 rounded-full"></div>}
                          </button>
                        ) : (
                          <button type="button" onClick={stopRecording} className="w-full flex flex-col items-center justify-center border-4 border-red-500 bg-red-50 rounded-3xl h-24 animate-pulse text-red-600">
                            <div className="w-5 h-5 bg-red-600 rounded-full mb-2"></div>
                            <span className="text-[9px] font-black uppercase tracking-widest">STOP</span>
                          </button>
                        )}
                        {isTranscribingAdmin && (
                           <div className="absolute inset-0 bg-white/80 rounded-3xl flex flex-col items-center justify-center">
                             <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-1"></div>
                             <p className="text-[8px] font-black text-indigo-600 uppercase">AI Transcribing...</p>
                           </div>
                        )}
                      </div>

                      <div className="w-full">
                        <textarea
                          placeholder="3. Explicit Written Note (Mandatory)..."
                          required
                          className="w-full h-28 px-5 py-4 rounded-3xl border-2 border-gray-100 text-xs font-black focus:ring-8 focus:ring-green-50 outline-none resize-none bg-gray-50 leading-relaxed text-black"
                          value={resolutionText}
                          onChange={e => setResolutionText(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleResolveSubmit} 
                    disabled={isVerifyingAI || isTranscribingAdmin || !resolutionImage || !resolutionVM || !resolutionText.trim()} 
                    className="w-full py-5 bg-green-600 text-white rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl disabled:bg-gray-100 disabled:text-gray-300 disabled:shadow-none transition-all active:scale-95"
                  >
                    {isVerifyingAI ? 'AI AUDITING...' : 'CONFIRM RESOLUTION'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* MAIN CONTENT */}
        <div className="lg:col-span-8 space-y-8 order-2">
            {!hideOriginalQuery && (
              <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl p-8 space-y-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-50 pb-8 gap-4">
                  <div>
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1">Source</p>
                      <h2 className="text-2xl font-black text-indigo-600">House {query.residentHouseNumber}</h2>
                  </div>
                  
                  {isResident && query.status === QueryStatus.UNDER_REVIEW && (
                    <div className="bg-amber-50 px-6 py-3 rounded-2xl border border-amber-100 flex items-center gap-3">
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                        <p className="text-[11px] font-black text-amber-700 uppercase tracking-widest">
                          Your complaint is under review.
                        </p>
                    </div>
                  )}

                  <div className="text-right">
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1">Date Logged</p>
                      <p className="text-lg font-bold text-gray-700">{new Date(query.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {query.image && (
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">1. Problem Evidence</p>
                    <div className="rounded-[2.5rem] overflow-hidden border-8 border-gray-50 shadow-inner">
                      <img src={query.image} alt="Reported problem" className="w-full object-cover max-h-[500px]" />
                    </div>
                  </div>
                )}

                <div className="flex flex-col md:flex-row gap-8">
                  {query.voiceMail && (
                    <div className="md:w-3/5 space-y-4">
                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">2. Voice Note</p>
                        <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100 flex flex-col gap-4">
                          <audio src={query.voiceMail} controls className="w-full h-10" />
                          {query.voiceTranscript && (
                              <div className="bg-white p-4 rounded-xl text-xs text-indigo-800 italic shadow-sm">
                                "{query.voiceTranscript}"
                              </div>
                          )}
                        </div>
                    </div>
                  )}

                  {query.description && (
                    <div className={`${query.voiceMail ? 'md:w-2/5' : 'w-full'} space-y-4`}>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">3. Written Notes</p>
                        <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 font-medium text-gray-700 italic min-h-[140px]">
                          "{query.description}"
                        </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* RESOLUTION CARD - Animates Upward when complete */}
            {query.solution && (
              <div className={`rounded-[3rem] border-2 shadow-xl p-10 space-y-8 relative overflow-hidden transform transition-all animate-in slide-in-from-bottom-10 fade-in duration-700 ${query.solution.aiVerification && !query.solution.aiVerification.isResolved ? 'bg-red-50/20 border-red-100' : 'bg-green-50/20 border-green-100'}`}>
                {query.solution.aiVerification && !query.solution.aiVerification.isResolved && (
                  <div className="absolute top-0 right-0 px-8 py-3 text-[9px] font-black uppercase tracking-widest bg-red-500 text-white rounded-bl-[2rem]">
                    AI AUDIT FAILED
                  </div>
                )}
                
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest mb-1">Issue Resolved</h3>
                  <p className="text-xs font-bold text-gray-400">Fixed by Administration</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {query.solution.image && (
                     <div className="space-y-2">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Proof of Fix</p>
                       <div className="rounded-[2rem] overflow-hidden border-4 border-white shadow-lg">
                          <img src={query.solution.image} className="w-full h-48 object-cover" alt="Fix Proof" />
                       </div>
                     </div>
                   )}
                   <div className="space-y-6">
                      {query.solution.voiceMail && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Admin Voice Summary</p>
                          <div className="bg-white p-4 rounded-2xl border border-white shadow-sm">
                             <audio src={query.solution.voiceMail} controls className="w-full h-8" />
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Closing Note</p>
                         <div className="bg-white/60 p-5 rounded-2xl border border-white/50 text-sm font-medium text-gray-800">
                           {query.solution.text}
                         </div>
                      </div>
                   </div>
                </div>

                {query.solution.aiVerification && (
                    <div className={`p-6 rounded-[2rem] border ${query.solution.aiVerification.isResolved ? 'bg-green-100/50 border-green-100' : 'bg-red-100/50 border-red-100'}`}>
                       <h4 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${query.solution.aiVerification.isResolved ? 'text-green-700' : 'text-red-700'}`}>AI Audit Report</h4>
                       <p className={`text-xs font-medium ${query.solution.aiVerification.isResolved ? 'text-green-800' : 'text-red-800'}`}>
                         "{query.solution.aiVerification.reason}"
                       </p>
                    </div>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default QueryDetailPage;
