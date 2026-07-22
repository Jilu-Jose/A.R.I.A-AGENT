import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
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
    <div className="max-w-7xl mx-auto pb-24 h-full">
      {renderAgent()}
    </div>
  );
}
