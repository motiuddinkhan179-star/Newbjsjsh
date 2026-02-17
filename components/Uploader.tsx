
import React, { useState } from 'react';
import { SourceFile } from '../types';

interface UploaderProps {
  onFilesSelect: (files: SourceFile[]) => void;
  isLoading: boolean;
}

export const Uploader: React.FC<UploaderProps> = ({ onFilesSelect, isLoading }) => {
  const [selectedFiles, setSelectedFiles] = useState<{ name: string; type: string }[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    const validFiles = files.filter(f => allowedTypes.includes(f.type));

    if (validFiles.length !== files.length) {
      alert('Only PDFs and Images (JPG/PNG/WebP) are supported.');
    }

    if (validFiles.length === 0) return;

    setSelectedFiles(validFiles.map(f => ({ name: f.name, type: f.type })));

    const processedFiles = await Promise.all(validFiles.map(file => {
      return new Promise<SourceFile>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const data = result.split(',')[1];
          resolve({
            data,
            mimeType: file.type,
            name: file.name
          });
        };
        reader.readAsDataURL(file);
      });
    }));

    onFilesSelect(processedFiles);
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Upload Source Material</h2>
        <p className="text-sm text-slate-500 mt-1">Upload multiple PDFs or textbook photos.</p>
      </div>

      <label className={`
        relative group flex flex-col items-center justify-center w-full h-48 
        border-2 border-dashed rounded-xl cursor-pointer transition-all
        ${selectedFiles.length > 0 ? 'border-indigo-300 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 bg-slate-50'}
      `}>
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {selectedFiles.length > 0 ? (
            <>
              <div className="flex -space-x-3 mb-3">
                {selectedFiles.slice(0, 3).map((f, i) => (
                  <div key={i} className="w-10 h-10 rounded-xl bg-indigo-600 border-2 border-white flex items-center justify-center shadow-lg">
                    {f.type.startsWith('image/') ? (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm font-bold text-slate-700">{selectedFiles.length} File(s) Selected</p>
            </>
          ) : (
            <>
              <svg className="w-10 h-10 mb-3 text-slate-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mb-2 text-sm text-slate-700 font-medium">Click to upload PDFs or Photos</p>
            </>
          )}
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept=".pdf,image/*" 
          multiple
          onChange={handleFileChange} 
          disabled={isLoading}
        />
      </label>

      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-1">
          {selectedFiles.map((f, i) => (
            <div key={i} className="text-[10px] font-medium text-slate-400 truncate px-2">{f.name}</div>
          ))}
        </div>
      )}
    </div>
  );
};
