import React from 'react';
import {
  MessageSquare,
  FolderKanban,
  HelpCircle,
  FileCheck2,
  FileCode2,
  Files,
  Shield,
  UploadCloud,
  ChevronRight,
  ExternalLink,
  Building2,
} from 'lucide-react';
import { Course } from '../types';

export type ActiveTab =
  | 'chat'
  | 'documents'
  | 'socratic'
  | 'rubric'
  | 'pdf_toolkit'
  | 'studio'
  | 'privacy'
  | 'admin';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabSelect: (tab: ActiveTab) => void;
  documentCount: number;
  hasActiveArtifact: boolean;
  onQuickUploadClick: () => void;
  currentUserRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabSelect,
  documentCount,
  hasActiveArtifact,
  onQuickUploadClick,
  currentUserRole = 'superadmin',
}) => {
  const navItems = [
    {
      id: 'chat' as ActiveTab,
      label: 'AI Workspace',
      description: 'Grounded Assistant & Orchestrator',
      icon: MessageSquare,
      badge: null,
    },
    {
      id: 'documents' as ActiveTab,
      label: 'Course Corpus',
      description: 'Slides, Notes & Handwriting RAG',
      icon: FolderKanban,
      badge: `${documentCount} docs`,
    },
    {
      id: 'socratic' as ActiveTab,
      label: 'Socratic Partner',
      description: 'Interactive thinking into drafts',
      icon: HelpCircle,
      badge: 'Interactive',
    },
    {
      id: 'rubric' as ActiveTab,
      label: 'Rubric Evaluator',
      description: 'Criterion diagnosis & score range',
      icon: FileCheck2,
      badge: null,
    },
    {
      id: 'pdf_toolkit' as ActiveTab,
      label: 'PDF Toolkit',
      description: 'Merge, split, rotate & organize',
      icon: Files,
      badge: 'Real PDF',
    },
    {
      id: 'studio' as ActiveTab,
      label: 'Artifact Studio',
      description: 'Markdown, LaTeX & PDF export',
      icon: FileCode2,
      badge: hasActiveArtifact ? 'Ready' : null,
    },
    {
      id: 'privacy' as ActiveTab,
      label: 'Security & Privacy',
      description: 'Zero prompt injection & isolation',
      icon: Shield,
      badge: null,
    },
    {
      id: 'admin' as ActiveTab,
      label: 'Administration & RBAC',
      description: 'Multi-tenancy, billing & audit logs',
      icon: Building2,
      badge: currentUserRole === 'superadmin' ? 'Enterprise' : 'Restricted',
    },
  ];

  return (
    <aside
      id="app-sidebar"
      className="w-full md:w-64 lg:w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 h-full overflow-y-auto"
    >
      {/* Upload Quick Button */}
      <div className="p-3 border-b border-slate-100">
        <button
          id="sidebar-quick-upload-btn"
          type="button"
          onClick={onQuickUploadClick}
          className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Course Material</span>
        </button>
      </div>

      {/* Navigation List */}
      <div className="p-2 space-y-1 flex-1">
        <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Academic Tools
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              type="button"
              onClick={() => onTabSelect(item.id)}
              className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-600/20'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${
                  isActive
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium shrink-0 ${
                        isActive
                          ? 'bg-emerald-200 text-emerald-900 font-semibold'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer info badge */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500">
        <div className="flex items-center justify-between font-semibold text-slate-700 mb-1">
          <span>Student Corpus Grounding</span>
          <span className="text-emerald-700">Protected</span>
        </div>
        <p className="leading-tight text-slate-400">
          Untrusted student files cannot override system prompts. All citations link to actual source pages.
        </p>
      </div>
    </aside>
  );
};
