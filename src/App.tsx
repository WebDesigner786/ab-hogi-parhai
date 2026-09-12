import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { ChatWorkspace } from './components/ChatWorkspace';
import { DocumentsView } from './components/DocumentsView';
import { SocraticView } from './components/SocraticView';
import { RubricView } from './components/RubricView';
import { PdfToolkitView } from './components/PdfToolkitView';
import { ArtifactStudioView } from './components/ArtifactStudioView';
import { PrivacyView } from './components/PrivacyView';
import { UploadModal } from './components/UploadModal';
import { VoiceModal } from './components/VoiceModal';
import { DocumentInspectionModal } from './components/DocumentInspectionModal';
import { SettingsModal } from './components/SettingsModal';
import { AdminHubView } from './components/AdminHubView';
import { UserDashboardModal } from './components/UserDashboardModal';
import {
  ChatMessage,
  Course,
  CourseDocument,
  DocumentChunk,
  GeneratedArtifact,
  AuthUser,
  University,
} from './types';

export default function App() {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');

  // University & Course state
  const [university, setUniversity] = useState<string>('NUST Islamabad');
  const [courses, setCourses] = useState<Course[]>([
    {
      id: 'cs-212',
      name: 'cs212',
      code: 'CS-212',
      title: 'Data Structures & Algorithms (NUST SEECS)',
      documentsCount: 2,
    },
    {
      id: 'ee-310',
      name: 'ee310',
      code: 'EE-310',
      title: 'Signals & Systems',
      documentsCount: 0,
    },
    {
      id: 'cs-401',
      name: 'cs401',
      code: 'CS-401',
      title: 'Final Year Project (Cap-Stone)',
      documentsCount: 0,
    },
  ]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('cs-212');
  const [strictGrounding, setStrictGrounding] = useState<boolean>(true);

  // Documents state
  const [documents, setDocuments] = useState<CourseDocument[]>([]);
  const [inspectingDoc, setInspectingDoc] = useState<CourseDocument | null>(null);
  const [inspectInitialPage, setInspectInitialPage] = useState<number>(1);

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isUserDashboardOpen, setIsUserDashboardOpen] = useState<boolean>(false);
  const [voiceTarget, setVoiceTarget] = useState<'chat' | 'socratic'>('chat');

  // Enterprise Auth & RBAC state
  const [currentUser, setCurrentUser] = useState<AuthUser>({
    id: 'usr-admin-1',
    name: 'Engr. Bilal Siddiqui',
    email: 'bilal.siddiqui@admin.nust.edu.pk',
    role: 'superadmin',
    university: 'NUST',
    tenantId: 'tenant-nust',
    department: 'Directorate of ICT & Academic Systems',
    studentId: 'DIR-ICT-001',
    twoFactorEnabled: true,
    ssoProvider: 'shibboleth',
    permissions: [
      'corpus:read',
      'corpus:write',
      'corpus:delete',
      'socratic:use',
      'rubric:evaluate',
      'rubric:calibrate',
      'pdf:use',
      'analytics:view_department',
      'billing:manage',
      'audit:view',
      'tenant:manage',
    ],
    createdAt: '2022-06-01T08:00:00Z',
  });
  const [allUsers, setAllUsers] = useState<AuthUser[]>([]);

  // Artifact Studio state
  const [activeArtifact, setActiveArtifact] = useState<GeneratedArtifact | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `Assalam-o-Alaikum! Welcome to your **ABHOGIPARHAI** Academic Workspace.

I am grounded in your uploaded university course corpus (currently loaded with **CS-212 Data Structures & Algorithms** lecture slides on Red-Black Trees and Lab 03 Task Instructions).

How can I assist your study today?
- Ask questions about lecture slide proofs and asymptotic lemmas.
- Generate a formal laboratory report or code architecture.
- Audit your assignment against university grading rubrics.
- Brainstorm and outline ideas via our Socratic "Noted" partner.
- Merge, split, or organize assignment PDFs.
- Manage institutional governance, RBAC permissions, multi-tenancy, and dunning recovery in the **Administration Hub**.`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // Fetch initial documents and auth from server
  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      if (Array.isArray(data)) {
        setDocuments(data);
        // Update document count in course list
        setCourses((prev) =>
          prev.map((c) => ({
            ...c,
            documentsCount: data.filter((d: CourseDocument) => d.courseId === c.id).length,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load initial documents:', err);
    }
  };

  const fetchAuth = async () => {
    try {
      const [meRes, usersRes] = await Promise.all([
        fetch('/api/auth/me').then((r) => r.json()),
        fetch('/api/auth/users').then((r) => r.json()),
      ]);
      if (meRes && meRes.id) setCurrentUser(meRes);
      if (Array.isArray(usersRes)) setAllUsers(usersRes);
    } catch (err) {
      console.error('Failed to load auth users:', err);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchAuth();
  }, []);

  // Handle Send Chat Message
  const handleSendMessage = async (text: string, attachedDocIds?: string[]) => {
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    const currentHistory = messages.slice(-8).map((m) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      content: m.text,
    }));

    setMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: currentHistory,
          courseId: selectedCourseId,
          attachedDocIds: attachedDocIds || [],
          strictGrounding,
          strictCorpusOnly: strictGrounding,
          userRole: currentUser?.role || 'student',
          university,
        }),
      });

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `msg-assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || data.error || 'No response received from the academic model.',
        timestamp: new Date().toISOString(),
        citations: data.citations || [],
        toolsExecuted: data.toolsExecuted || [],
        artifact: data.artifact,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If an artifact was generated (e.g. lab report), set it as current active artifact
      if (data.artifact) {
        setActiveArtifact(data.artifact);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-error-${Date.now()}`,
          sender: 'assistant',
          text: 'An error occurred while contacting the academic server. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Direct Corpus Search helper for DocumentsView
  const handleDirectSearchCorpus = async (query: string): Promise<{ chunk: DocumentChunk; score: number }[]> => {
    try {
      const res = await fetch('/api/corpus/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, courseId: selectedCourseId || undefined }),
      });
      const data = await res.json();
      return data.results || [];
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  // Open Document Inspector
  const handleInspectDocument = (docId: string, pageNumber?: number) => {
    const doc = documents.find((d) => d.id === docId);
    if (doc) {
      setInspectingDoc(doc);
      setInspectInitialPage(pageNumber || 1);
    }
  };

  // Delete Document
  const handleDeleteDocument = async (docId: string) => {
    try {
      await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      console.error(err);
    }
  };

  // Voice transcript handler
  const handleVoiceConfirm = (transcript: string) => {
    if (voiceTarget === 'chat') {
      setActiveTab('chat');
      handleSendMessage(transcript);
    }
  };

  // Open Artifact in Studio
  const handleOpenArtifactInStudio = (artifact: GeneratedArtifact) => {
    setActiveArtifact(artifact);
    setActiveTab('studio');
  };

  // Clear Corpus / Reset
  const handleClearCorpus = async () => {
    try {
      await fetch('/api/corpus/reset', { method: 'POST' });
      await fetchDocuments();
      setMessages([
        {
          id: `msg-reset-${Date.now()}`,
          sender: 'assistant',
          text: 'Workspace corpus reset. Default CS-212 lecture materials restored.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 font-sans antialiased select-text">
      {/* Top Main Navigation Header */}
      <Header
        university={university as University}
        onUniversityChange={(u) => setUniversity(u)}
        courses={courses}
        selectedCourseId={selectedCourseId}
        onCourseChange={setSelectedCourseId}
        strictCorpusOnly={strictGrounding}
        onToggleStrictCorpus={() => setStrictGrounding(!strictGrounding)}
        onResetSession={handleClearCorpus}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        hasApiKey={true}
        currentUser={currentUser}
        onOpenUserDashboard={() => setIsUserDashboardOpen(true)}
        onOpenAdminHub={() => setActiveTab('admin')}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Academic Tools Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabSelect={(tab) => setActiveTab(tab)}
          documentCount={documents.length}
          hasActiveArtifact={!!activeArtifact}
          onQuickUploadClick={() => setIsUploadModalOpen(true)}
          currentUserRole={currentUser.role}
        />

        {/* Dynamic Center Workspace View */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          {activeTab === 'chat' && (
            <ChatWorkspace
              messages={messages}
              isLoading={isChatLoading}
              onSendMessage={handleSendMessage}
              onOpenVoiceModal={() => {
                setVoiceTarget('chat');
                setIsVoiceModalOpen(true);
              }}
              onOpenUploadModal={() => setIsUploadModalOpen(true)}
              onInspectDocument={handleInspectDocument}
              onOpenArtifactInStudio={handleOpenArtifactInStudio}
              documents={documents}
              strictGrounding={strictGrounding}
              onToggleStrictGrounding={() => setStrictGrounding(!strictGrounding)}
              onClearChat={() => setMessages([])}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsView
              courses={courses}
              documents={documents}
              selectedCourseId={selectedCourseId}
              onSelectCourse={setSelectedCourseId}
              onOpenUploadModal={() => setIsUploadModalOpen(true)}
              onInspectDocument={(id) => handleInspectDocument(id, 1)}
              onDeleteDocument={handleDeleteDocument}
              onQueryWithDocument={(docName) => {
                setActiveTab('chat');
                handleSendMessage(`Explain the core concepts and lemmas covered in "${docName}".`);
              }}
              onDirectSearchCorpus={handleDirectSearchCorpus}
            />
          )}

          {activeTab === 'socratic' && (
            <SocraticView
              onOpenVoiceModal={() => {
                setVoiceTarget('socratic');
                setIsVoiceModalOpen(true);
              }}
              onDraftGenerated={(artifact) => {
                setActiveArtifact(artifact);
                setActiveTab('studio');
              }}
            />
          )}

          {activeTab === 'rubric' && <RubricView />}

          {activeTab === 'pdf_toolkit' && <PdfToolkitView documents={documents} />}

          {activeTab === 'studio' && (
            <ArtifactStudioView
              artifact={activeArtifact}
              onUpdateContent={(content) => {
                if (activeArtifact) {
                  setActiveArtifact({ ...activeArtifact, content });
                }
              }}
              university={university}
            />
          )}

          {activeTab === 'privacy' && <PrivacyView />}

          {activeTab === 'admin' && (
            <AdminHubView
              currentUser={currentUser}
              onUserSwitched={(switched) => setCurrentUser(switched)}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        courses={courses}
        selectedCourseId={selectedCourseId}
        onUploadSuccess={(newDoc) => {
          setDocuments((prev) => [...prev, newDoc]);
          // Notify in chat
          setMessages((prev) => [
            ...prev,
            {
              id: `msg-upload-${Date.now()}`,
              sender: 'assistant',
              text: `Ingested and indexed **"${newDoc.fileName}"** (${newDoc.pageCount} pages, ${newDoc.chunks.length} chunks). It is now actively grounded for all questions in **${newDoc.courseName}**.`,
              timestamp: new Date().toISOString(),
            },
          ]);
        }}
      />

      <VoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onConfirmTranscript={handleVoiceConfirm}
      />

      <DocumentInspectionModal
        document={inspectingDoc}
        initialPage={inspectInitialPage}
        onClose={() => setInspectingDoc(null)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        university={university}
        onSelectUniversity={setUniversity}
        strictGrounding={strictGrounding}
        onToggleStrictGrounding={() => setStrictGrounding(!strictGrounding)}
        onClearCorpus={handleClearCorpus}
      />

      <UserDashboardModal
        isOpen={isUserDashboardOpen}
        onClose={() => setIsUserDashboardOpen(false)}
        currentUser={currentUser}
        onUpdateProfile={(updated) => setCurrentUser((prev) => ({ ...prev, ...updated }))}
        allUsers={allUsers}
        onSwitchUser={async (userId) => {
          try {
            const res = await fetch('/api/auth/switch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId }),
            });
            const data = await res.json();
            if (data.success && data.user) {
              setCurrentUser(data.user);
            }
          } catch (err) {
            console.error(err);
          }
        }}
        onOpenAdminHub={() => {
          setIsUserDashboardOpen(false);
          setActiveTab('admin');
        }}
      />
    </div>
  );
}
