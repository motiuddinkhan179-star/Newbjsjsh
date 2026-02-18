
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Uploader } from './components/Uploader';
import { PaperView } from './components/PaperView';
import { generateQuestionPaper } from './services/geminiService';
import { GeneratorSettings, Difficulty, QuestionPaper, SourceFile } from './types';

const LANGUAGES = [
  'English', 'Hindi', 'Spanish', 'French', 'German', 'Urdu', 'Arabic', 
  'Bengali', 'Portuguese', 'Russian', 'Japanese', 'Chinese', 'Tamil', 'Telugu'
];

const STORAGE_KEY = 'edugen_pro_vault_v2';

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
    title: 'Semester Finals - 2025',
    subject: 'Computer Science',
    institutionName: 'Global Institute of Excellence',
    duration: '3 Hours',
    watermarkText: 'CONFIDENTIAL',
    logoUrl: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Vault corrupted");
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

  const saveToVault = (newPaper: QuestionPaper) => {
    const updated = [newPaper, ...history].slice(0, 30);
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteFromVault = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
    setLoadingStep('Syncing Multimodal Inputs...');
    try {
      setTimeout(() => setLoadingStep('Extracting Knowledge Graph...'), 2000);
      setTimeout(() => setLoadingStep('Mapping Cognitive Difficulty...'), 4500);
      setTimeout(() => setLoadingStep('Generating Rubrics & Taxonomy...'), 7000);
      const result = await generateQuestionPaper(sourceFiles, settings);
      const paperWithLogo = { ...result, logoUrl: settings.logoUrl };
      setPaper(paperWithLogo);
      saveToVault(paperWithLogo);
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
      <div className="py-12 px-4 bg-[#f8fafc] min-h-screen">
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
      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
          <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter">
              AI Exam <span className="text-indigo-600">Pro.</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium max-w-lg">Advanced multimodal assessment engine for professional educators.</p>
          </div>
          <button 
            onClick={() => setShowHistory(!showHistory)} 
            className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:border-indigo-500 transition-all shadow-xl"
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            Vault {history.length > 0 && `(${history.length})`}
          </button>
        </div>

        {showHistory && (
          <div className="mb-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            {history.length === 0 ? (
              <div className="col-span-full py-16 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 text-center text-slate-400 font-bold">Your vault is currently empty.</div>
            ) : (
              history.map((h) => (
                <div key={h.id} onClick={() => setPaper(h)} className="p-8 bg-white rounded-[3rem] border border-slate-100 hover:border-indigo-400 hover:shadow-2xl transition-all cursor-pointer group relative">
                   <button onClick={(e) => deleteFromVault(h.id, e)} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3" /></svg>
                   </button>
                   <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-4">{new Date(h.createdAt).toLocaleDateString()}</p>
                   <h4 className="font-black text-slate-900 mb-2 truncate">{h.subject}</h4>
                   <p className="text-[10px] text-slate-500 truncate mb-6">{h.title}</p>
                   <div className="flex justify-between items-center text-[9px] font-black text-slate-400 border-t border-slate-50 pt-4">
                      <span>{h.totalMarks} MARKS</span>
                      <span className="text-indigo-600">OPEN →</span>
                   </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-5 space-y-12">
            <Uploader onFilesSelect={setSourceFiles} isLoading={isLoading} />
            
            <div className="p-10 bg-slate-900 rounded-[3.5rem] text-white relative overflow-hidden group">
               <div className="relative z-10 space-y-6">
                 <h4 className="font-black text-[11px] uppercase tracking-[0.3em] text-indigo-400">Model Configuration</h4>
                 <p className="text-sm text-slate-400 font-medium leading-relaxed">
                   Optimized for <span className="text-white font-bold">Gemini 3 Pro</span>. Multimodal reasoning enabled for complex diagrams and handwriting.
                 </p>
                 {!hasApiKey && (
                  <button onClick={handleSelectKey} className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-500 shadow-2xl active:scale-95 transition-all">
                    Link Professional API Key
                  </button>
                 )}
               </div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white p-10 md:p-14 rounded-[4rem] border border-slate-100 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.06)]">
            <header className="flex justify-between items-center mb-14">
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Draft Blueprint</h3>
              <label className="cursor-pointer group">
                  <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-500 bg-slate-50">
                    {settings.logoUrl ? <img src={settings.logoUrl} className="w-full h-full object-cover" /> : <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </label>
            </header>

            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest">Institution Title</label>
                  <input type="text" value={settings.institutionName} onChange={e => setSettings({...settings, institutionName: e.target.value})} className="w-full px-8 py-6 bg-slate-50/50 border-2 border-slate-100 rounded-3xl font-black text-slate-900 text-lg focus:border-indigo-500 focus:bg-white outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest">Core Subject</label>
                  <input type="text" value={settings.subject} onChange={e => setSettings({...settings, subject: e.target.value})} className="w-full px-8 py-5 bg-slate-50/50 border-2 border-slate-100 rounded-3xl font-bold text-slate-800 focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest">Time Limit</label>
                  <input type="text" value={settings.duration} onChange={e => setSettings({...settings, duration: e.target.value})} className="w-full px-8 py-5 bg-slate-50/50 border-2 border-slate-100 rounded-3xl font-bold text-slate-800 focus:border-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest">Instruction Language</label>
                  <select value={settings.language} onChange={e => setSettings({...settings, language: e.target.value})} className="w-full px-8 py-5 bg-slate-50/50 border-2 border-slate-100 rounded-3xl font-bold text-slate-800 cursor-pointer outline-none focus:border-indigo-500">
                    {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-3 block tracking-widest">Pedagogical Level</label>
                  <select value={settings.difficulty} onChange={e => setSettings({...settings, difficulty: e.target.value as Difficulty})} className="w-full px-8 py-5 bg-slate-50/50 border-2 border-slate-100 rounded-3xl font-bold text-indigo-600 cursor-pointer outline-none focus:border-indigo-500">
                    <option value={Difficulty.EASY}>Bloom's: Knowledge</option>
                    <option value={Difficulty.MEDIUM}>Bloom's: Application</option>
                    <option value={Difficulty.HARD}>Bloom's: Evaluation</option>
                  </select>
                </div>
              </div>

              <div className="p-10 bg-slate-900 rounded-[3rem] shadow-2xl relative">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  {[
                    {l: 'MCQ', k: 'mcqCount'}, {l: 'TRUE/FALSE', k: 'trueFalseCount'}, {l: 'BLANKS', k: 'fillBlanksCount'}, {l: 'SHORT', k: 'shortCount'}, {l: 'LONG', k: 'longCount'}
                  ].map(f => (
                    <div key={f.k} className="text-center group">
                      <span className="text-[8px] font-black text-slate-500 block mb-3 uppercase tracking-tighter transition-colors group-hover:text-indigo-400">{f.l}</span>
                      <input type="number" min="0" value={(settings as any)[f.k]} onChange={e => setSettings({...settings, [f.k]: Math.max(0, +e.target.value)})} className="w-full bg-transparent text-white text-2xl font-black text-center outline-none border-b-2 border-slate-800 focus:border-indigo-500 transition-all" />
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleGenerate} 
                disabled={isLoading || sourceFiles.length === 0} 
                className={`w-full py-8 rounded-[2.5rem] font-black text-white text-lg tracking-tight transition-all shadow-2xl active:scale-[0.98] ${isLoading || sourceFiles.length === 0 ? 'bg-slate-100 text-slate-300' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-4">
                    <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span className="uppercase text-xs tracking-[0.2em]">{loadingStep}</span>
                  </span>
                ) : 'CONSTRUCT ASSESSMENT & RUBRICS'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
