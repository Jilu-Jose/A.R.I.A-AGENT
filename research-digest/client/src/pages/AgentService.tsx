import React from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { AGENTS_LIST } from '../utils/agents';

import CitationNetwork from './agents/CitationNetwork';
import Clustering from './agents/Clustering';
import CollaboratorFinder from './agents/CollaboratorFinder';
import GapFinder from './agents/GapFinder';
import LiteratureReviewer from './agents/LiteratureReviewer';
import PaperAnalyst from './agents/PaperAnalyst';
import Recommender from './agents/Recommender';
import Summarisation from './agents/Summarisation';
import TrendDetector from './agents/TrendDetector';

export default function AgentService() {
  const { agentId } = useParams();
  const agent = AGENTS_LIST.find(a => a.id === agentId);
  const navigate = useNavigate();
  
  if (!agent) {
    return <Navigate to="/" replace />;
  }

  const renderAgent = () => {
    switch(agentId) {
      case 'citation_network': return <CitationNetwork />;
      case 'cluster': return <Clustering />;
      case 'collaborator_finder': return <CollaboratorFinder />;
      case 'gap_finder': return <GapFinder />;
      case 'literature_review': return <LiteratureReviewer />;
      case 'paper_analyst': return <PaperAnalyst />;
      case 'recommender': return <Recommender />;
      case 'summarise': return <Summarisation />;
      case 'trend_detector': return <TrendDetector />;
      default: return <div className="p-8 text-center text-gray-500">Agent UI not found.</div>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <ArrowLeft size={16} /> Go Back
        </button>
        <button onClick={() => navigate('/')} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <Home size={16} /> Home
        </button>
      </div>
      {renderAgent()}
    </div>
  );
}
