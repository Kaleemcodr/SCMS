
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { GoogleGenAI } from "@google/genai";

const NewQueryPage: React.FC = () => {
  const navigate = useNavigate();
  const { addQuery, state } = useApp();
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceMail, setVoiceMail] = useState<string | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [audioMimeType, setAudioMimeType] = useState('audio/webm');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const getSupportedMimeType = () => {
    if (typeof MediaRecorder === 'undefined') return 'audio/webm';
    // Prioritize MP4 for Safari/iOS compatibility, then WebM for Chrome/FF
    const types = ['audio/mp4', 'audio/webm', 'audio/ogg', 'audio/wav', 'audio/aac'];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return 'audio/webm'; // Fallback
  };

  const transcribeAudio = async (base64Audio: string, mimeType: string) => {
    setIsTranscribing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Strip codecs from mimeType for API compatibility (e.g. "audio/webm;codecs=opus" -> "audio/webm")
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
        setVoiceTranscript(transcription);
        // Automatically populate description if empty
        setDescription(prev => {
          if (!prev || prev.trim() === "") return transcription;
          return prev;
        });
      }
    } catch (err) {
      console.error("Transcription failed", err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleRecordClick = () => {
    if (voiceMail) {
      if (window.confirm("Do you want to discard your previous voice note?")) {
        setVoiceMail(null);
        setVoiceTranscript('');
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
        // Use the mimeType from the recorder if available, otherwise the requested one
        const finalMimeType = mediaRecorder.mimeType || mimeType;
        const blob = new Blob(chunksRef.current, { type: finalMimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setVoiceMail(base64);
          setAudioMimeType(finalMimeType);
          transcribeAudio(base64, finalMimeType);
        };
        reader.readAsDataURL(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      // Start with 200ms timeslice to ensure ondataavailable fires frequently
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isTranscribing) return;

    if (!description && !image && !voiceMail) {
      alert("Please provide at least one piece of information (Photo, Voice, or Text).");
      return;
    }

    addQuery({
      residentHouseNumber: state.currentUser!.houseNumber,
      description,
      image: image || undefined,
      voiceMail: voiceMail || undefined,
      voiceTranscript: voiceTranscript || undefined
    });

    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all">
           <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-widest">Lodge Query</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] border shadow-2xl border-gray-50 p-8 space-y-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">1. Problem Image</label>
          {image ? (
            <div className="relative rounded-3xl overflow-hidden aspect-video border-4 border-gray-50 shadow-inner group">
              <img src={image} className="w-full h-full object-cover" alt="Preview" />
              <button
                type="button"
                onClick={() => setImage(null)}
                className="absolute top-4 right-4 bg-white/90 text-red-500 p-3 rounded-full shadow-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center border-4 border-dashed border-gray-100 rounded-3xl h-72 cursor-pointer hover:bg-gray-50 hover:border-indigo-100 transition-all text-gray-300 hover:text-indigo-400">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg>
              <span className="text-xs font-black uppercase tracking-widest text-center px-4">Upload Issue Photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if(file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setImage(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }} />
            </label>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-[60%] space-y-3">
            <label className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">2. Voice Description</label>
            {!recording ? (
              <button
                type="button"
                onClick={handleRecordClick}
                className="flex flex-col items-center justify-center border-4 border-dashed border-gray-100 rounded-3xl h-64 w-full hover:bg-indigo-50 hover:border-indigo-200 transition-all group relative bg-white shadow-inner"
              >
                <div className="bg-indigo-50 p-6 rounded-full group-hover:bg-indigo-600 transition-colors">
                  <svg className="w-10 h-10 text-indigo-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                </div>
                <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mt-4">{voiceMail ? 'RE-RECORD VOICE' : 'Record Issue Summary'}</span>
                {voiceMail && <div className="absolute top-4 right-4 bg-green-500 w-4 h-4 rounded-full border-4 border-white shadow-sm animate-pulse"></div>}
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="flex flex-col items-center justify-center border-4 border-red-500 bg-red-50 rounded-3xl h-64 w-full animate-pulse shadow-2xl shadow-red-100"
              >
                <div className="w-10 h-10 bg-red-600 rounded-full mb-4"></div>
                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest text-center px-4">STOP RECORDING NOW</span>
              </button>
            )}
            {voiceMail && !recording && (
              <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 flex flex-col gap-4 shadow-inner">
                <audio src={voiceMail} controls className="w-full h-10" />
                {voiceTranscript && (
                  <div className="bg-white p-3 rounded-xl border border-indigo-50 text-xs text-indigo-900 italic">
                    "{voiceTranscript}"
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="md:w-[40%] space-y-3">
            <label className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">3. Optional Text Notes</label>
            <div className="relative h-64">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full h-full px-6 py-5 rounded-[2.5rem] border border-gray-100 bg-white focus:ring-8 focus:ring-indigo-50 outline-none resize-none text-sm font-medium transition-all leading-relaxed ${isTranscribing ? 'opacity-50' : ''}`}
                placeholder="Type any additional details here (Optional)..."
              ></textarea>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isTranscribing}
          className="w-full bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:bg-indigo-700 transition-all active:scale-95 disabled:bg-gray-200 disabled:shadow-none"
        >
          Submit Issue Report
        </button>
      </form>
    </div>
  );
};

export default NewQueryPage;
