
import React, { useState, useRef, useMemo } from 'react';
import { QuestionPaper, QuestionType } from '../types';

interface PaperViewProps {
  initialPaper: QuestionPaper;
  onReset: () => void;
  language?: string;
}

export const PaperView: React.FC<PaperViewProps> = ({ initialPaper, onReset, language = 'English' }) => {
  const [paper, setPaper] = useState<QuestionPaper>(initialPaper);
  const [isExporting, setIsExporting] = useState(false);
  const [teacherMode, setTeacherMode] = useState(false);
  const paperRef = useRef<HTMLDivElement>(null);

  const isRTL = useMemo(() => {
    const rtlLangs = ['Urdu', 'Arabic', 'Persian', 'Hebrew'];
    return rtlLangs.includes(language);
  }, [language]);

  const handleExportPDF = async () => {
    if (!paperRef.current) return;
    setIsExporting(true);
    paperRef.current.classList.add('pdf-exporting');
    await new Promise(r => setTimeout(r, 1500));
    
    const element = paperRef.current;
    const opt = {
      margin: [10, 0, 10, 0], 
      filename: `Exam_${paper.subject}_${teacherMode ? 'Teacher' : 'Student'}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 2.5, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        logging: false
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      // @ts-ignore
      await window.html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error(err);
      alert("PDF Error. Use Direct Print.");
    } finally {
      if (paperRef.current) paperRef.current.classList.remove('pdf-exporting');
      setIsExporting(false);
    }
  };

  const handleShuffle = () => {
    const next = { ...paper };
    next.sections = next.sections.map(section => ({
      ...section,
      questions: [...section.questions].sort(() => Math.random() - 0.5)
    }));
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
      <div className="no-print flex flex-col md:flex-row justify-between items-center gap-6 bg-white/95 backdrop-blur-xl p-6 rounded-3xl border border-slate-200 sticky top-6 z-50 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">A4</div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase">
              {teacherMode ? "Teacher's Master Copy" : "Student Question Paper"}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
              {teacherMode ? "Includes Rubrics & Taxonomy" : "Exam Distribution Mode"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setTeacherMode(!teacherMode)} 
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all border-2 ${teacherMode ? 'bg-amber-100 border-amber-500 text-amber-700' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
          >
            {teacherMode ? '🎓 TEACHER MODE ON' : '📚 TEACHER MODE OFF'}
          </button>
          <button onClick={handleShuffle} className="px-4 py-2 bg-slate-100 text-slate-800 rounded-xl font-bold text-xs uppercase hover:bg-slate-200 transition-all">
            SHUFFLE SET
          </button>
          <div className="h-8 w-px bg-slate-200 mx-2"></div>
          <button onClick={handleDirectPrint} className="px-6 py-3 bg-slate-100 text-slate-800 rounded-xl font-bold text-xs uppercase">DIRECT PRINT</button>
          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className={`px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl ${isExporting ? 'opacity-50' : ''}`}
          >
            {isExporting ? 'SAVING...' : 'SAVE PDF'}
          </button>
          <button onClick={onReset} className="px-5 py-3 text-slate-500 hover:text-red-600 font-bold text-xs">EXIT</button>
        </div>
      </div>

      <div className="flex justify-center">
        <div 
          ref={paperRef} 
          dir={isRTL ? 'rtl' : 'ltr'}
          className={`pdf-capture-container shadow-2xl border border-slate-100 text-[#0f172a] flex flex-col ${isRTL ? 'rtl-content' : 'serif-content'}`}
        >
          {paper.watermark && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.035] rotate-[-40deg] z-0 overflow-hidden">
              <span className="text-[120px] font-black uppercase whitespace-nowrap">{paper.watermark}</span>
            </div>
          )}

          <div className="relative z-10 flex-grow">
            <header className="border-b-[4px] border-slate-900 pb-10 mb-10 text-center space-y-4">
              {paper.logoUrl && <div className="mb-4"><img src={paper.logoUrl} className="h-20 mx-auto object-contain" alt="Logo" /></div>}
              <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900">{paper.institutionName}</h1>
              <h2 className="text-2xl font-bold text-slate-700">{paper.title}</h2>
              
              <div className={`flex justify-between items-end mt-12 text-[10px] font-black border-t-2 border-slate-50 pt-8 px-4`}>
                <div className="text-left"><span>SUBJECT:</span><p className="text-base">{paper.subject}</p></div>
                <div className="text-center"><span>TIME:</span><p className="text-base">{paper.duration}</p></div>
                <div className="text-right"><span>TOTAL MARKS:</span><p className="text-4xl text-indigo-700">{paper.totalMarks}</p></div>
              </div>
            </header>

            <div className="grid grid-cols-2 gap-12 mb-12 border-b-2 border-slate-50 pb-10">
               <div className="border-b-2 border-slate-900 pb-2 flex justify-between"><span>Name:</span><span className="flex-grow"></span></div>
               <div className="border-b-2 border-slate-900 pb-2 flex justify-between"><span>Roll No:</span><span className="w-1/2"></span></div>
            </div>

            <div className="space-y-16">
              {paper.sections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-10">
                  <div className="flex items-center gap-6 mb-6 avoid-break">
                    <span className="px-10 py-3 bg-slate-900 text-white font-black uppercase text-[10px] rounded-lg">{section.title}</span>
                    <div className="h-[2px] flex-grow bg-slate-100"></div>
                  </div>
                  
                  <div className="space-y-12">
                    {section.questions.map((q, qIdx) => (
                      <div key={q.id} className="avoid-break group relative">
                        {teacherMode && q.cognitiveLevel && (
                          <div className="mb-2 inline-block px-2 py-1 bg-amber-50 text-amber-700 text-[9px] font-black uppercase rounded border border-amber-200">
                            Bloom's: {q.cognitiveLevel}
                          </div>
                        )}
                        <div className="flex justify-between items-start gap-8">
                          <div className="flex-grow">
                            <div className="font-bold text-slate-900 text-[20px] mb-6 whitespace-pre-wrap">{q.text}</div>
                            
                            {q.type === QuestionType.MCQ && q.options && (
                              <div className="grid grid-cols-2 gap-x-12 gap-y-4 mt-4">
                                {q.options.map((opt, oIdx) => (
                                  <div key={oIdx} className={`flex gap-2 p-2 rounded ${teacherMode && opt === q.correctAnswer ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200' : ''}`}>
                                    <span className="font-bold">({String.fromCharCode(97 + oIdx)})</span>
                                    <span>{opt}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {teacherMode && (
                              <div className="mt-6 p-4 bg-slate-50 rounded-2xl border-l-4 border-indigo-500 text-sm italic">
                                <p className="font-black text-[10px] text-indigo-600 uppercase mb-2">Marking Rubric:</p>
                                <p className="text-slate-700">{q.markingRubric}</p>
                                {q.correctAnswer && q.type !== QuestionType.MCQ && (
                                  <div className="mt-4">
                                    <p className="font-black text-[10px] text-emerald-600 uppercase mb-2">Model Answer:</p>
                                    <p className="text-emerald-900 font-semibold">{q.correctAnswer}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {!teacherMode && (q.type === QuestionType.SHORT || q.type === QuestionType.LONG) && (
                               <div className="hidden print:block pt-8 space-y-10">
                                  {Array.from({length: q.type === QuestionType.LONG ? 10 : 3}).map((_, i) => (
                                    <div key={i} className="border-b border-dotted border-slate-200 h-10 w-full"></div>
                                  ))}
                               </div>
                            )}
                          </div>
                          <span className="shrink-0 font-black text-[10px] bg-slate-100 px-4 py-2 rounded-full">[{q.marks}M]</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
