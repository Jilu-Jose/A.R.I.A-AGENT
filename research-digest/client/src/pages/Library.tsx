import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { BookOpen, ExternalLink, Trash2, ArrowLeft, Home, Upload, X, Filter, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Paper {
  id: number;
  title: string;
  url: string;
  created_at: string;
  cover_image_url?: string;
  file_size_bytes?: number;
  original_filename?: string;
  category?: string;
  document_type?: string;
}

const CATEGORIES = ["AI/ML", "Physics", "Biology", "General", "Math", "Other"];

const formatBytes = (bytes?: number) => {
  if (bytes === undefined || bytes === null) return '';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function Library() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [selectedType, setSelectedType] = useState("Research Paper");
  const [customTitle, setCustomTitle] = useState("");
  
  // Edit modal state
  const [editingPaper, setEditingPaper] = useState<Paper | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState(CATEGORIES[0]);
  const [editType, setEditType] = useState("Research Paper");
  const [savingEdit, setSavingEdit] = useState(false);
  
  // Filter state
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterType, setFilterType] = useState<string>("All");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are allowed.");
      return;
    }
    setSelectedFile(file);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      toast.error("Please select a PDF file first.");
      return;
    }
    
    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("category", selectedCategory);
    formData.append("document_type", selectedType);
    if (customTitle.trim()) {
      formData.append("custom_title", customTitle.trim());
    }
    
    try {
      await api.post("/dashboard/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("PDF uploaded successfully.");
      setShowModal(false);
      setSelectedFile(null);
      setCustomTitle("");
      fetchLibrary();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to upload PDF.");
    } finally {
      setUploading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!editingPaper) return;
    setSavingEdit(true);
    try {
      await api.put(`/dashboard/paper/${editingPaper.id}`, {
        title: editTitle,
        category: editCategory,
        document_type: editType
      });
      toast.success("Paper updated successfully.");
      setEditingPaper(null);
      fetchLibrary();
    } catch (err: any) {
      toast.error("Failed to update paper.");
    } finally {
      setSavingEdit(false);
    }
  };

  const fetchLibrary = async () => {
    try {
      const { data } = await api.get('/dashboard/library');
      setPapers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, []);

  const deletePaper = async (id: number) => {
    try {
      await api.delete(`/dashboard/paper/${id}`);
      fetchLibrary();
      toast.success("Paper deleted.");
    } catch (err) {
      toast.error("Failed to delete paper.");
    }
  };

  const confirmDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this paper?")) {
      deletePaper(id);
    }
  };

  const filteredPapers = papers.filter(p => {
    const matchCategory = filterCategory === "All" || p.category === filterCategory;
    const matchType = filterType === "All" || (p.document_type || "Research Paper") === filterType;
    return matchCategory && matchType;
  });

  if (loading) return <div className="flex justify-center mt-10">Loading library...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-24">
      {/* Top Navigation */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <ArrowLeft size={16} /> Go Back
        </button>
        <button onClick={() => navigate('/')} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <Home size={16} /> Home
        </button>
      </div>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif mb-2 flex items-center gap-3">
            <BookOpen className="text-blue-500" /> Research Library
          </h1>
          <p className="text-gray-500">Your pinned research papers and articles.</p>
        </div>
        <div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:opacity-80 transition-all"
          >
            <Upload size={18} />
            Upload PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#1a1d27] p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full sm:w-auto flex-1">
          <div className="flex items-center gap-2 pr-2 text-sm font-medium text-gray-400">
            <Filter size={16} /> Category:
          </div>
          <button 
            onClick={() => setFilterCategory("All")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filterCategory === 'All' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filterCategory === cat ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-gray-800 pt-3 sm:pt-0 sm:pl-4 w-full sm:w-auto">
          <span className="text-sm font-medium text-gray-400">Type:</span>
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm font-medium text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
          >
            <option value="All">All Types</option>
            <option value="Research Paper">Research Papers</option>
            <option value="Book">Books</option>
          </select>
        </div>
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1a1d27] rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold">Upload PDF</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select PDF File</label>
                <input 
                  type="file" 
                  accept=".pdf,application/pdf" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400 dark:hover:file:bg-blue-900/50 transition-colors cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Custom Title (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Enter a custom name for this file"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Document Type</label>
                  <select 
                    value={selectedType} 
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Research Paper">Research Paper</option>
                    <option value="Book">Book</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUploadSubmit}
                disabled={uploading || !selectedFile}
                className="flex items-center gap-2 px-5 py-2 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:opacity-80 transition-all disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1a1d27] rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold">Edit Paper Details</h3>
              <button onClick={() => setEditingPaper(null)} className="text-gray-400 hover:text-black dark:hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input 
                  type="text" 
                  placeholder="Enter paper title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Document Type</label>
                  <select 
                    value={editType} 
                    onChange={(e) => setEditType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Research Paper">Research Paper</option>
                    <option value="Book">Book</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select 
                    value={editCategory} 
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
              <button 
                onClick={() => setEditingPaper(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleEditSubmit}
                disabled={savingEdit || !editTitle.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:opacity-80 transition-all disabled:opacity-50"
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Papers Grid */}
      {filteredPapers.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <BookOpen size={24} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">No papers found</h3>
          <p className="text-gray-500">
            {filterCategory === "All" 
              ? "Your library is empty. Use the upload button or search bar to pin papers."
              : `No papers found in the "${filterCategory}" category.`}
          </p>
        </div>
      ) : (
          <div className="grid gap-4">
            {filteredPapers.map(paper => (
              <div key={paper.id} className="bg-white dark:bg-[#1a1d27] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex items-start justify-between group hover:shadow-md transition-all">
                <div className="flex flex-1 items-start gap-5 pr-4">
                  {paper.cover_image_url ? (
                    <div className="flex-shrink-0 w-24 h-32 bg-gray-100 dark:bg-gray-800 rounded shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                      <img src={paper.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-12 h-16 bg-gray-50 dark:bg-gray-800/50 rounded flex items-center justify-center text-gray-400 border border-gray-100 dark:border-gray-800">
                      <BookOpen size={20} />
                    </div>
                  )}
                  <div className="flex-1 mt-1">
                    <a href={paper.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-lg hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2">
                      {paper.title}
                    </a>
                    {paper.original_filename && paper.original_filename !== paper.title && (
                      <p className="text-xs text-gray-500 font-mono mt-1.5 truncate max-w-md" title={paper.original_filename}>
                        {paper.original_filename}
                      </p>
                    )}
                    <p className="text-sm text-gray-400 mt-3 flex flex-wrap items-center gap-2">
                      {paper.category && (
                        <>
                          <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-xs font-semibold">
                            {paper.category}
                          </span>
                          <span>•</span>
                        </>
                      )}
                      {paper.document_type && (
                        <>
                          <span className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded text-xs font-semibold">
                            {paper.document_type}
                          </span>
                          <span>•</span>
                        </>
                      )}
                      {paper.file_size_bytes !== undefined && (
                        <>
                          <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs font-medium text-gray-600 dark:text-gray-300 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
                            {formatBytes(paper.file_size_bytes)}
                          </span>
                          <span>•</span>
                        </>
                      )}
                      <span>Pinned {new Date(paper.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <a href={paper.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1">
                        Source <ExternalLink size={12} />
                      </a>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <button
                    onClick={() => {
                      setEditingPaper(paper);
                      setEditTitle(paper.title);
                      setEditCategory(paper.category || CATEGORIES[0]);
                      setEditType(paper.document_type || "Research Paper");
                    }}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Edit paper"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => confirmDelete(paper.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Remove paper"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
      )}
    </div>
  );
}
