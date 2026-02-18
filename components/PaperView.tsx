
import React, { useState, useRef, useMemo } from 'react';
import { QuestionPaper, QuestionType, Question } from '../types';

interface PaperViewProps {
  initialPaper: QuestionPaper;
  onReset: () => void;
  language?: string;
}

export const PaperView: React.FC<PaperViewProps> = ({ initialPaper, onReset, language = 'English' }) => {
  const [paper, setPaper] = useState<QuestionPaper>(initialPaper);
  const [isExporting, setIsExporting] = useState(false);
  const [teacherMode, setTeacherMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  const isRTL = useMemo(() => {
    const rtlLangs = ['Urdu', 'Arabic', 'Persian', 'Hebrew'];
    return rtlLangs.includes(language);
  }, [language]);

  const handleExportPDF = async (customLabel?: string) => {
    if (!paperRef.current) return;
    setIsExporting(true);
    
    // Set label temporarily if generating multiple sets
    if (customLabel) {
      setPaper(prev => ({ ...prev, setLabel: customLabel }));
    }

    paperRef.current.classList.add('pdf-exporting');
    await new Promise(r => setTimeout(r, 1000));
    
    const element = paperRef.current;
    const opt = {
      margin: [10, 0, 10, 0], 
      filename: `Exam_${paper.subject}_${customLabel || 'Final'}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 2.5, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      // @ts-ignore
      await window.html2pdf().set(opt).from(element).save();
    } catch (err) {
      alert("PDF Export failed. Please use Direct Print.");
    } finally {
      paperRef.current.classList.remove('pdf-exporting');
      setIsExporting(false);
    }
  };

  const handleShuffleSet = async () => {
    const sets = ['Set A', 'Set B', 'Set C'];
    for (const set of sets) {
      const shuffled = { ...paper, setLabel: set };
      shuffled.sections = shuffled.sections.map(section => ({
        ...section,
        questions: [...section.questions].sort(() => Math.random() - 0.5)
      }));
      setPaper(shuffled);
      await handleExportPDF(set);
      await new Promise(r => setTimeout(r, 1500)); // Delay between downloads
    }
  };

  const updateQuestion = (sIdx: number, qIdx: number, updates: Partial<Question>) => {
    const next = { ...paper };
    next.sections[sIdx].questions[qIdx] = { ...next.sections[sIdx].questions[qIdx], ...updates };
    
    let total = 0;
    let totalEst = 0;
    next.sections.forEach(s => s.questions.forEach(q => {
      total += (q.marks || 0);
      totalEst += (q.estimatedTime || 0);
    }));
    next.totalMarks = total;
    next.estimatedTotalTime = totalEst;
    setPaper(next);
  };

  const handleDirectPrint = () => {
    if (!paperRef.current) return;
    paperRef.current.classList.add('print-mode');
    window.print();
    paperRef.current.classList.remove('print-mode');
  };

  return (
    <div className={`max-w-6xl mx-auto pb-32 space-y-10 animate-in fade-in duration-500`}>
      
      {/* Action Bar */}
      <div className="no-print flex flex-col lg:flex-row justify-between items-center gap-6 bg-white/95 backdrop-blur-xl p-6 rounded-3xl border border-slate-200 sticky top-6 z-50 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">PRO</div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase">
              {teacherMode ? "TEACHER MASTER SUITE" : "STUDENT PREVIEW"}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
              {teacherMode ? "Advanced Pedagogical Controls" : "Final Draft Check"}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button 
            onClick={() => setTeacherMode(!teacherMode)} 
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all border-2 ${teacherMode ? 'bg-amber-100 border-amber-500 text-amber-700' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
          >
            {teacherMode ? '🎓 TEACHER MODE ON' : '📚 TEACHER MODE OFF'}
          </button>
          
          {teacherMode && (
            <button onClick={handleShuffleSet} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-emerald-700 shadow-lg">
              GENERATE SET A/B/C
            </button>
          )}

          <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
          <button onClick={handleDirectPrint} className="px-5 py-3 bg-slate-100 text-slate-800 rounded-xl font-bold text-xs uppercase">PRINT</button>
          <button 
            onClick={() => handleExportPDF()}
            disabled={isExporting}
            className={`px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase shadow-lg ${isExporting ? 'opacity-50' : ''}`}
          >
            {isExporting ? '...' : 'SAVE PDF'}
          </button>
          <button onClick={onReset} className="px-4 py-2 text-slate-400 hover:text-red-500 font-bold text-xs">EXIT</button>
        </div>
      </div>

      <div className="flex justify-center">
        <div 
          ref={paperRef} 
          dir={isRTL ? 'rtl' : 'ltr'}
          className={`pdf-capture-container shadow-2xl border border-slate-100 text-[#0f172a] flex flex-col ${isRTL ? 'rtl-content' : 'serif-content'}`}
        >
          {paper.watermark && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] rotate-[-40deg] z-0 overflow-hidden">
              <span className="text-[140px] font-black uppercase whitespace-nowrap">{paper.watermark}</span>
            </div>
          )}

          <div className="relative z-10 flex-grow">
            {/* Teacher Insights Dashboard */}
            {teacherMode && (
               <div className="no-pdf mb-10 p-8 bg-slate-900 text-white rounded-[2rem] shadow-2xl space-y-6">
                 <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Pedagogical Insights</h4>
                      <h3 className="text-2xl font-black">Examination Dashboard</h3>
                    </div>
                    <div className="text-right">
                       <span className="text-[10px] font-bold text-slate-500 uppercase">EST. SOLVE TIME</span>
                       <p className="text-2xl font-black text-emerald-400">{paper.estimatedTotalTime} Minutes</p>
                    </div>
                 </div>
                 
                 <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-3">Topic Coverage</p>
                    <div className="flex flex-wrap gap-2">
                       {paper.topicsCovered?.map((topic, i) => (
                         <span key={i} className="px-3 py-1 bg-slate-800 text-slate-300 text-[9px] font-bold rounded-lg border border-slate-700">
                           {topic}
                         </span>
                       ))}
                    </div>
                 </div>
               </div>
            )}

            <header className="border-b-[4px] border-slate-900 pb-10 mb-10 text-center space-y-4">
              {paper.setLabel && (
                <div className="absolute top-0 right-0 px-6 py-2 bg-slate-900 text-white font-black rounded-bl-2xl uppercase tracking-widest">
                  {paper.setLabel}
                </div>
              )}
              {paper.logoUrl && <div className="mb-4"><img src={paper.logoUrl} className="h-16 mx-auto object-contain" alt="Logo" /></div>}
              <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">{paper.institutionName}</h1>
              <h2 className="text-lg font-bold text-slate-700">{paper.title}</h2>
              
              <div className={`flex justify-between items-end mt-10 text-[9px] font-black border-t-2 border-slate-50 pt-6 px-4`}>
                <div className="text-left"><span>SUBJECT:</span><p className="text-base">{paper.subject}</p></div>
                <div className="text-center"><span>TIME:</span><p className="text-base">{paper.duration}</p></div>
                <div className="text-right"><span>TOTAL MARKS:</span><p className="text-2xl text-indigo-700">{paper.totalMarks}</p></div>
              </div>
            </header>

            <div className="grid grid-cols-2 gap-12 mb-10 border-b-2 border-slate-50 pb-8">
               <div className="border-b-2 border-slate-900 pb-1 flex justify-between"><span>Name:</span><span className="flex-grow"></span></div>
               <div className="border-b-2 border-slate-900 pb-1 flex justify-between"><span>Roll No:</span><span className="w-1/2"></span></div>
            </div>

            <div className="space-y-16">
              {paper.sections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-8">
                  <div className="flex items-center gap-6 mb-4 avoid-break">
                    <span className="px-8 py-2 bg-slate-900 text-white font-black uppercase text-[10px] rounded-md">{section.title}</span>
                    <div className="h-[1px] flex-grow bg-slate-100"></div>
                  </div>
                  
                  <div className="space-y-10">
                    {section.questions.map((q, qIdx) => (
                      <div key={q.id} className="avoid-break group relative p-2">
                        {teacherMode && (
                          <div className="no-print absolute top-0 right-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditingId(editingId === q.id ? null : q.id)} className="p-1.5 bg-white border border-slate-200 rounded-lg text-indigo-600 hover:bg-indigo-50">
                               Edit
                            </button>
                          </div>
                        )}

                        <div className="flex justify-between items-start gap-6">
                          <div className="flex-grow">
                            <div className="flex items-center gap-3 mb-4">
                               {teacherMode && (
                                 <div className="flex gap-2">
                                   <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black rounded-md">
                                     <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="3"/></svg>
                                     {q.estimatedTime}m
                                   </span>
                                   {q.cognitiveLevel && (
                                     <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[8px] font-black rounded-md border border-amber-100">
                                       {q.cognitiveLevel}
                                     </span>
                                   )}
                                   {q.topicTag && (
                                     <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[8px] font-black rounded-md border border-indigo-100">
                                       {q.topicTag}
                                     </span>
                                   )}
                                 </div>
                               )}
                            </div>

                            {editingId === q.id ? (
                               <div className="space-y-4 no-print bg-slate-50 p-6 rounded-2xl border-2 border-indigo-500">
                                  <textarea 
                                    className="w-full p-4 border border-slate-200 rounded-xl font-bold text-lg outline-none" 
                                    value={q.text}
                                    onChange={(e) => updateQuestion(sIdx, qIdx, { text: e.target.value })}
                                  />
                                  <div className="flex gap-4">
                                     <input type="number" className="w-20 p-2 border rounded-lg" value={q.marks} onChange={e => updateQuestion(sIdx, qIdx, { marks: +e.target.value })} />
                                     <input type="number" className="w-20 p-2 border rounded-lg" value={q.estimatedTime} onChange={e => updateQuestion(sIdx, qIdx, { estimatedTime: +e.target.value })} />
                                     <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">DONE</button>
                                  </div>
                               </div>
                            ) : (
                               <div className="font-bold text-slate-900 text-[18px] mb-4 leading-relaxed">
                                 {qIdx + 1}. {q.text}
                               </div>
                            )}
                            
                            {q.type === QuestionType.MCQ && q.options && (
                              <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-6 pl-6">
                                {q.options.map((opt, oIdx) => (
                                  <div key={oIdx} className={`flex gap-3 text-sm p-1.5 rounded-lg border-2 border-transparent transition-all ${teacherMode && opt === q.correctAnswer ? 'bg-emerald-50 border-emerald-100 text-emerald-800 font-bold' : ''}`}>
                                    <span className="font-bold">({String.fromCharCode(97 + oIdx)})</span>
                                    <span>{opt}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {teacherMode && (
                              <div className="mt-8 p-6 bg-slate-50/80 rounded-2xl border-l-4 border-indigo-500 text-sm no-pdf">
                                <div className="grid grid-cols-2 gap-8">
                                  <div>
                                    <p className="text-[8px] font-black text-indigo-600 uppercase mb-2 tracking-widest">Grading Matrix</p>
                                    <p className="text-slate-600 leading-relaxed italic">{q.markingRubric}</p>
                                  </div>
                                  {q.correctAnswer && q.type !== QuestionType.MCQ && (
                                    <div>
                                      <p className="text-[8px] font-black text-emerald-600 uppercase mb-2 tracking-widest">Master Answer</p>
                                      <p className="text-emerald-900 font-bold">{q.correctAnswer}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {!teacherMode && (q.type === QuestionType.SHORT || q.type === QuestionType.LONG) && (
                               <div className="hidden print:block pt-6 space-y-6">
                                  {Array.from({length: q.type === QuestionType.LONG ? 10 : 3}).map((_, i) => (
                                    <div key={i} className="border-b border-dotted border-slate-300 h-8 w-full"></div>
                                  ))}
                               </div>
                            )}
                          </div>
                          <span className="shrink-0 font-black text-[10px] bg-slate-100 px-3 py-1.5 rounded-lg text-slate-500">[{q.marks} Marks]</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <footer className="mt-32 pt-10 border-t border-slate-50 text-center">
               <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.5em]">System Generated Final Assessment</p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};
