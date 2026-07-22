import React, { useState } from 'react';
import { BookOpen, FileText, Download, List, Play } from 'lucide-react';

export default function LiteratureReviewer() {
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 3000);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-serif text-black dark:text-white flex items-center gap-2">
            <BookOpen className="text-gray-500" />
            Literature Reviewer
          </h2>
          <p className="text-gray-500 text-sm mt-1">Generate comprehensive literature reviews from curated collections.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Download size={16} /> Export Markdown
          </button>
          <button 
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-gray-900 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            {isRunning ? <FileText size={16} className="animate-spin" /> : <Play size={16} />}
            {isRunning ? 'Drafting...' : 'Generate Review'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6">
        {/* Outline Sidebar */}
        <div className="w-full lg:w-1/4 bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="font-bold flex items-center gap-2 mb-4">
            <List size={18} /> Outline Structure
          </h3>
          <div className="space-y-1">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded font-semibold text-sm cursor-pointer">1. Introduction</div>
            <div className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded font-semibold text-sm cursor-pointer transition-colors">2. Background & Motivation</div>
            <div className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded text-sm cursor-pointer transition-colors pl-6 text-gray-600 dark:text-gray-400">2.1 Historical Context</div>
            <div className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded text-sm cursor-pointer transition-colors pl-6 text-gray-600 dark:text-gray-400">2.2 Theoretical Foundations</div>
            <div className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded font-semibold text-sm cursor-pointer transition-colors">3. Current Methodologies</div>
            <div className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded font-semibold text-sm cursor-pointer transition-colors">4. Limitations & Challenges</div>
            <div className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded font-semibold text-sm cursor-pointer transition-colors">5. Conclusion</div>
          </div>
        </div>

        {/* Editor/Preview */}
        <div className="w-full lg:w-3/4 bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-200 dark:border-gray-800 p-8 overflow-y-auto">
          {isRunning ? (
            <div className="h-full flex flex-col items-center justify-center opacity-50">
              <BookOpen size={48} className="animate-pulse mb-4" />
              <p className="font-mono text-sm animate-pulse">Synthesizing 42 papers...</p>
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none font-serif">
              <h1 className="text-3xl font-bold mb-6">1. Introduction</h1>
              <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
                The rapid evolution of artificial intelligence over the past decade has fundamentally reshaped the landscape of computational research. In particular, the shift towards massive, pre-trained language models has introduced new paradigms for natural language understanding and generation [1].
              </p>
              <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
                However, as these models scale, the underlying infrastructure required to train and deploy them has become increasingly complex. Early research focused primarily on architectural innovations, such as the introduction of the Transformer [2], whereas contemporary literature heavily emphasizes systems-level optimization [3, 4] and efficient fine-tuning methodologies [5].
              </p>
              <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
                This review synthesizes the current state-of-the-art in efficient model deployment, identifying key trends in quantization, pruning, and distributed training. We aim to provide a comprehensive overview of the theoretical foundations that enable these techniques, while critically evaluating their empirical performance across various downstream tasks.
              </p>
              
              <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800">
                <h3 className="font-bold text-lg mb-4 font-sans">Generated References</h3>
                <ul className="text-sm text-gray-500 space-y-2 font-sans">
                  <li>[1] Vaswani et al. (2017). "Attention Is All You Need". NeurIPS.</li>
                  <li>[2] Devlin et al. (2018). "BERT: Pre-training of Deep Bidirectional Transformers". NAACL.</li>
                  <li>[3] Dao et al. (2022). "FlashAttention: Fast and Memory-Efficient Exact Attention". NeurIPS.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
