import React, { useState, useRef, useCallback } from 'react';
import { FileText, Play, Link as LinkIcon, UploadCloud, Microscope, Crosshair, AlertTriangle, Lightbulb, X, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../../api';
import toast from 'react-hot-toast';

export default function PaperAnalyst() {
  const [isRunning, setIsRunning]     = useState(false);
  const [query, setQuery]             = useState('');
  const [result, setResult]           = useState<any>(null);

  // PDF upload state
  const [selectedFile, setSelectedFile]   = useState<File | null>(null);
  const [isDragging, setIsDragging]       = useState(false);
  const [uploading, setUploading]         = useState(false);
  const [uploadDone, setUploadDone]       = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Analyze via URL / title ── */
  const handleRun = async () => {
    if (!query.trim()) return;
    setIsRunning(true);
    setResult(null);
    try {
      const res = await api.post('/agents/analyze-paper', { query, url: '' });
      setResult(res.data);
    } catch {
      // interceptor handles toast
    } finally {
      setIsRunning(false);
    }
  };

  /* ── Upload PDF ── */
  const handleUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files are allowed.');
      return;
    }
    setUploading(true);
    setUploadDone(false);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('custom_title', file.name.replace(/\.pdf$/i, ''));
      await api.post('/dashboard/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadDone(true);
      toast.success('PDF uploaded — analysis running in background.');
      // Run a local analysis too using filename as query
      setQuery(file.name.replace(/\.pdf$/i, ''));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setSelectedFile(file); handleUpload(file); }
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  /* ── Drag & Drop ── */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) { setSelectedFile(file); handleUpload(file); }
  }, []);

  const clearFile = () => { setSelectedFile(null); setUploadDone(false); };

  return (
    <div className="h-full flex flex-col">
      {/* ── Header ── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-serif text-black dark:text-white flex items-center gap-2">
            <FileText className="text-gray-500" />
            P.A.R.S.E
          </h2>
          <p className="text-gray-500 text-sm mt-1">Deep structural extraction of methodology, findings, and limitations.</p>
        </div>
        <button
          onClick={handleRun}
          disabled={isRunning || !query.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-gray-900 dark:hover:bg-gray-100 disabled:opacity-40 transition-colors"
        >
          {isRunning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
          {isRunning ? 'Analyzing...' : 'Analyze Paper'}
        </button>
      </div>

      {/* ── Input row ── */}
      <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
        <div className="flex gap-4 items-stretch">
          {/* URL / title input */}
          <div className="flex-1 relative">
            <LinkIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRun()}
              placeholder="Paste ArXiv URL, DOI, or paper title…"
              className="w-full h-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-[#13151f] border border-gray-200 dark:border-gray-800 rounded-xl text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors"
            />
          </div>

          <div className="flex items-center font-bold text-gray-400 px-2 shrink-0">OR</div>

          {/* ── PDF Drop Zone ── */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`
              relative flex items-center gap-3 px-6 py-3 rounded-xl border-2 border-dashed cursor-pointer
              transition-all duration-200 select-none shrink-0
              ${isDragging
                ? 'border-black dark:border-white bg-gray-100 dark:bg-gray-800 scale-[1.02]'
                : uploadDone
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                  : 'border-gray-300 dark:border-gray-700 hover:border-gray-500 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/60'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* States */}
            {uploading ? (
              <>
                <Loader2 size={18} className="animate-spin text-gray-500 shrink-0" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">Uploading…</span>
              </>
            ) : uploadDone && selectedFile ? (
              <>
                <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400 max-w-[140px] truncate">
                  {selectedFile.name}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); clearFile(); }}
                  className="ml-1 p-0.5 rounded hover:bg-green-200 dark:hover:bg-green-900 transition-colors"
                >
                  <X size={13} className="text-green-600 dark:text-green-400" />
                </button>
              </>
            ) : selectedFile && !uploadDone ? (
              <>
                <FileText size={18} className="text-gray-500 shrink-0" />
                <span className="text-sm text-gray-600 dark:text-gray-400 max-w-[140px] truncate">{selectedFile.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); clearFile(); }}
                  className="ml-1 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <X size={13} className="text-gray-400" />
                </button>
              </>
            ) : (
              <>
                <UploadCloud size={18} className="text-gray-500 shrink-0" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {isDragging ? 'Drop PDF here' : 'Upload PDF'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Helper text */}
        <p className="mt-3 text-xs text-gray-400">
          Drop or click to upload a PDF — it will be saved to your Library and analysed automatically.
        </p>
      </div>

      {/* ── Results ── */}
      <div className="flex-1 overflow-y-auto">
        {isRunning ? (
          <div className="h-full flex flex-col items-center justify-center opacity-50">
            <FileText size={48} className="animate-pulse mb-4" />
            <p className="font-mono text-sm animate-pulse">Parsing document structure...</p>
          </div>
        ) : result ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
                <Microscope size={18} /> Motivation
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{result.motivation}</p>
            </div>

            <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
                <Microscope size={18} /> Methodology
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{result.methodology}</p>
            </div>

            <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
                <Crosshair size={18} /> Key Findings
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{result.results}</p>
            </div>

            <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
                <AlertTriangle size={18} /> Limitations
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{result.limitations}</p>
            </div>

            <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 md:col-span-2">
              <h3 className="font-bold mb-4 flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
                <Lightbulb size={18} /> Impact Statement
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{result.impact_statement}</p>
            </div>

            {result.highlights && result.highlights.length > 0 && (
              <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 lg:col-span-3">
                <h3 className="font-bold mb-4 flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
                  ✦ Highlights
                </h3>
                <ul className="space-y-2">
                  {result.highlights.map((h: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="text-gray-400 mt-0.5 shrink-0">•</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Enter a paper URL or title above, or upload a PDF to begin analysis.
          </div>
        )}
      </div>
    </div>
  );
}
