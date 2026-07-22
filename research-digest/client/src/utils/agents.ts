import { Network, FolderTree, Users, Search, BookOpen, FileText, Sparkles, FileSearch, TrendingUp } from 'lucide-react';

export const AGENTS_LIST = [
  { id: "citation_network", name: "Citation Network Agent", description: "Builds citation graphs for context mapping.", icon: Network },
  { id: "cluster", name: "Clustering Agent", description: "Groups related papers for digest topics.", icon: FolderTree },
  { id: "collaborator_finder", name: "Collaborator Finder", description: "Finds potential co-authors based on research overlap.", icon: Users },
  { id: "gap_finder", name: "Gap Finder", description: "Identifies unexplored areas in literature.", icon: Search },
  { id: "literature_review", name: "Literature Reviewer", description: "Generates comprehensive literature reviews.", icon: BookOpen },
  { id: "paper_analyst", name: "Paper Analyst", description: "Extracts key findings and methodology from papers.", icon: FileText },
  { id: "recommender", name: "Recommender Agent", description: "Suggests papers based on user reading history.", icon: Sparkles },
  { id: "summarise", name: "Summarisation Agent", description: "Summarizes individual papers or abstracts.", icon: FileSearch },
  { id: "trend_detector", name: "Trend Detector", description: "Detects emerging research topics across feeds.", icon: TrendingUp }
];
