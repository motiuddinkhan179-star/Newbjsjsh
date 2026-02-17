
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Uploader } from './components/Uploader';
import { PaperView } from './components/PaperView';
import { generateQuestionPaper } from './services/geminiService';
import { GeneratorSettings, Difficulty, QuestionPaper, SourceFile } from './types';

const LANGUAGES = [
  'English',
  'Hindi',
  'Spanish',
  'French',
  'German',
  'Urdu',
  'Arabic',
  'Bengali',
  'Portuguese',
  'Russian',
  'Japanese',
  'Chinese'
];

const STORAGE_KEY = 'edugen_history_v1';

export const App: React.FC = () => {
  const [sourceFiles, setSourceFiles] = useState<SourceFile[]>([]);
  const [paper, setPaper] = useState<QuestionPaper | null>(null);
  const [history, setHistory] = useState<QuestionPaper[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [hasApiKey, setHasApiKey] = useState(false);
  
  const [settings, setSettings] = useState<GeneratorSettings>({
    language: 'English',
    difficulty: Difficulty.MEDIUM,
    mcqCount: 10,
    fillBlanksCount: 5,
    trueFalseCount: 5,
    shortCount: 4,
    longCount: 2,
    title: 'Final Examination - 2025',
    subject: 'General Knowledge',
    institutionName: 'Royal International School',
    duration: '180 Minutes',
    watermarkText: 'CONFIDENTIAL',
    logoUrl: ''
  });

  useEffect(() => {
    // Load History
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history");
      }
    }

    const checkKey = async () => {
      // @ts-ignore
      if (window.aistudio?.hasSelectedApiKey) {
        // @ts-ignore
        const result = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(result);
      }
    };
    checkKey();
  }, []);

  const saveToHistory = (newPaper: QuestionPaper) => {
    const updated = [newPaper, ...history].slice(0, 20); // Keep last 20
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteFromHistory = (id: string) => {
    const updated = history.filter(p => p.id !== id);
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio?.openSelectKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => setSettings({ ...settings, logoUrl: re.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (sourceFiles.length === 0) return;
    setIsLoading(true);
    setLoadingStep('Ingesting Content...');
    try {
      setTimeout(() => setLoadingStep('Analyzing Pedagogy...'), 1500);
      setTimeout(() => setLoadingStep('Mapping Syllabus...'), 3500);
      setTimeout(() => setLoadingStep('Creating Rubrics...'), 5500);
      const result = await generateQuestionPaper(sourceFiles, settings);
      const paperWithLogo = { ...result, logoUrl: settings.logoUrl };
      setPaper(paperWithLogo);
      saveToHistory(paperWithLogo);
    } catch (e: any) {
      if (e.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
        handleSelectKey();
      } else {
        alert(e.message);
      }
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  if (paper) return (
    <Layout>
      <div className="py-12 px-4">
        <PaperView 
          initialPaper={paper} 
          onReset={() => setPaper(null)} 
          language={settings.language} 
        />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="flex justify-end mb-8 no-print">
          <button 
            onClick={() => setShowHistory(!showHistory)} 
            className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Teacher's Vault {history.length > 0 && `(${history.length})`}
          </button>
        </div>

        {showHistory && (
          <div className="mb-12 bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden animate-in slide-in-from-top duration-500">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter">Previous Papers</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Teacher's Local History</p>
              </div>
              <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-white font-black text-xl">×</button>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto">
              {history.length === 0 ? (
                <div className="col-span-full py-20 text-center text-slate-400 font-bold italic">No papers saved in the vault yet.</div>
              ) : (
                history.map((h) => (
                  <div key={h.id} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:border-indigo-200 hover:shadow-lg transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[9px] font-black bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full uppercase">
                        {new Date(h.createdAt).toLocaleDateString()}
                      </span>
                      <button onClick={() => deleteFromHistory(h.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" /></svg>
                      </button>
                    </div>
                    <h4 className="font-black text-slate-900 leading-tight mb-2 truncate">{h.subject}</h4>
                    <p className="text-xs text-slate-500 mb-6 truncate">{h.title}</p>
                    <button 
                      onClick={() => setPaper(h)}
                      className="w-full py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    >
                      OPEN REVISION
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          <div className="lg:col-span-5 space-y-12">
            <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-tight">
              Teacher's <br/> <span className="text-indigo-600">Pro</span> Suite.
            </h1>
            <p className="text-xl text-slate-500 font-medium">Generate exam versions, marking rubrics, and syllabus maps with one click.</p>
            <Uploader onFilesSelect={setSourceFiles} isLoading={isLoading} />
            {!hasApiKey && (
              <div className="p-8 bg-slate-900 rounded-[3rem] text-white">
                <p className="text-sm font-bold mb-4 opacity-70">Unlock multimodal processing with Pro keys.</p>
                <button onClick={handleSelectKey} className="w-full py-4 bg-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest">Select API Key</button>
              </div>
            )}
          </div>
          <div className="lg:col-span-7 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-xl">
            <div className="flex justify-between items-center mb-12">
              <h3 className="text-3xl font-black text-slate-900">Blueprint</h3>
              <label className="cursor-pointer">
                <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                  {settings.logoUrl ? <img src={settings.logoUrl} className="w-full h-full object-cover" /> : <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </label>
            </div>
            <div className="space-y-8">
              <input type="text" value={settings.institutionName} onChange={e => setSettings({...settings, institutionName: e.target.value})} className="w-full px-7 py-5 bg-slate-50 rounded-[2rem] font-bold outline-none" placeholder="Institution Name" />
              <div className="grid grid-cols-2 gap-6">
                <input type="text" value={settings.subject} onChange={e => setSettings({...settings, subject: e.target.value})} className="px-7 py-5 bg-slate-50 rounded-[2rem] font-bold outline-none" placeholder="Subject" />
                <input type="text" value={settings.duration} onChange={e => setSettings({...settings, duration: e.target.value})} className="px-7 py-5 bg-slate-50 rounded-[2rem] font-bold outline-none" placeholder="Time" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <select value={settings.language} onChange={e => setSettings({...settings, language: e.target.value})} className="px-7 py-5 bg-slate-50 rounded-[2rem] font-bold outline-none">
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <select value={settings.difficulty} onChange={e => setSettings({...settings, difficulty: e.target.value as Difficulty})} className="px-7 py-5 bg-slate-50 rounded-[2rem] font-bold outline-none">
                  <option value={Difficulty.EASY}>Recall (EASY)</option>
                  <option value={Difficulty.MEDIUM}>Logic (MEDIUM)</option>
                  <option value={Difficulty.HARD}>Complex (HARD)</option>
                </select>
              </div>
              <div className="p-8 bg-slate-900 rounded-[3rem]">
                <div className="grid grid-cols-5 gap-3">
                  {[
                    {l: 'MCQ', k: 'mcqCount'}, {l: 'T/F', k: 'trueFalseCount'}, {l: 'FIB', k: 'fillBlanksCount'}, {l: 'SHT', k: 'shortCount'}, {l: 'LNG', k: 'longCount'}
                  ].map(f => (
                    <div key={f.k} className="text-center">
                      <span className="text-[9px] font-black text-slate-500 block mb-2">{f.l}</span>
                      <input type="number" value={(settings as any)[f.k]} onChange={e => setSettings({...settings, [f.k]: +e.target.value})} className="w-full bg-transparent text-white text-xl font-black text-center outline-none border-b border-slate-700" />
                    </div>
                  ))}
                </div>
              </div>
              <button 
                onClick={handleGenerate} 
                disabled={isLoading || sourceFiles.length === 0} 
                className={`w-full py-7 rounded-[2.5rem] font-black text-white transition-all shadow-2xl active:scale-95 ${isLoading || sourceFiles.length === 0 ? 'bg-slate-100 text-slate-300' : 'bg-indigo-600 shadow-indigo-200'}`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    {loadingStep}
                  </span>
                ) : 'GENERATE EXAM & RUBRICS'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
