import { Network, FolderTree, Users, Search, BookOpen, FileText, Sparkles, FileSearch, TrendingUp } from 'lucide-react';

export const AGENTS_LIST = [
  { id: "citation_network", name: "C.H.A.I.N", description: "Builds citation graphs for context mapping.", icon: Network },
  { id: "cluster", name: "C.L.U.S.T.E.R", description: "Groups related papers for digest topics.", icon: FolderTree },
  { id: "collaborator_finder", name: "C.O.R.E", description: "Finds potential co-authors based on research overlap.", icon: Users },
  { id: "gap_finder", name: "V.O.I.D", description: "Identifies unexplored areas in literature.", icon: Search },
  { id: "literature_review", name: "S.C.O.P.E", description: "Generates comprehensive literature reviews.", icon: BookOpen },
  { id: "paper_analyst", name: "P.A.R.S.E", description: "Extracts key findings and methodology from papers.", icon: FileText },
  { id: "recommender", name: "O.R.A.C.L.E", description: "Suggests papers based on user reading history.", icon: Sparkles },
  { id: "summarise", name: "S.U.M.M.I.T", description: "Summarizes individual papers or abstracts.", icon: FileSearch },
  { id: "trend_detector", name: "T.R.E.N.D", description: "Detects emerging research topics across feeds.", icon: TrendingUp }
];
