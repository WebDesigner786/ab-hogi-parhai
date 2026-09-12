export type University = 'NUST' | 'FAST' | 'GIKI' | 'COMSATS' | 'LUMS' | 'UET' | 'Other';

export interface UserProfile {
  id: string;
  name: string;
  university: University;
  department: string;
  degree: string;
  currentSemester: number;
}

export interface DocumentBlock {
  id: string;
  type: 'text' | 'heading' | 'equation' | 'table' | 'diagram_caption' | 'uncertain';
  content: string;
  latex?: string;
  page: number;
  confidence?: number;
  note?: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  documentName: string;
  courseId: string;
  pageNumber: number;
  sectionTitle?: string;
  content: string;
  blocks?: DocumentBlock[];
}

export interface CourseDocument {
  id: string;
  courseId: string;
  courseName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  pageCount: number;
  extractedText: string;
  blocks: DocumentBlock[];
  chunks: DocumentChunk[];
  status: 'ready' | 'processing' | 'error';
  isHandwritten?: boolean;
  containsMath?: boolean;
}

export interface Course {
  id: string;
  name?: string;
  code: string;
  title: string;
  instructor?: string;
  documentsCount: number;
}

export interface Citation {
  sourceDocId: string;
  sourceDocName: string;
  page: number;
  snippet: string;
  section?: string;
}

export interface ToolExecution {
  toolName: string;
  status: 'running' | 'completed' | 'failed';
  message: string;
  resultSummary?: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  citations?: Citation[];
  toolsExecuted?: ToolExecution[];
  isGroundedCorpusOnly?: boolean;
  attachedDocIds?: string[];
  artifact?: GeneratedArtifact;
}

export interface SocraticIdeaState {
  topic: string;
  thesis: string;
  arguments: string[];
  evidence: string[];
  examples: string[];
  counterarguments: string[];
  conclusion: string;
}

export interface SocraticTurn {
  id: string;
  agentQuestion: string;
  studentAnswer?: string;
  targetCategory: 'thesis' | 'motivation' | 'evidence' | 'examples' | 'reasoning' | 'counterarguments' | 'conclusion';
  status: 'pending' | 'answered';
}

export interface RubricCriterion {
  id: string;
  name: string;
  maxPoints: number;
  requirements: string[];
}

export interface RubricEvaluationCriterionResult {
  criterionId: string;
  name: string;
  maxPoints: number;
  predictedScore: number;
  confidence: number;
  strengths: string[];
  missingRequirements: string[];
  evidenceQuotes: string[];
  actionableRecommendations: string[];
}

export interface RubricEvaluationReport {
  rubricTitle: string;
  totalMaxPoints: number;
  totalPredictedScore: number;
  overallConfidence: number;
  summary: string;
  criteriaResults: RubricEvaluationCriterionResult[];
  disclaimer: string;
}

export interface GeneratedArtifact {
  id: string;
  title: string;
  type: 'lab_report' | 'assignment_draft' | 'formal_report' | 'study_notes' | 'derivation_analysis' | 'quiz_questions';
  courseCode?: string;
  content: string;
  createdAt: string;
  citations: Citation[];
}

export interface IntentOrchestrationResult {
  intent: string;
  requiresTools: string[];
  requiresUserFile: boolean;
  explanation: string;
  directAnswer?: string;
}

// Enterprise SaaS & Administration Types
export type UserRole = 'student' | 'ta' | 'professor' | 'superadmin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  university: University;
  tenantId: string;
  department: string;
  studentId: string;
  avatar?: string;
  twoFactorEnabled: boolean;
  ssoProvider?: 'google_workspace' | 'microsoft_365' | 'shibboleth' | 'email_password';
  permissions: string[];
  createdAt: string;
}

export interface RolePermission {
  id: string;
  name: string;
  category: 'Corpus' | 'Grading' | 'PDF' | 'Administration' | 'Billing' | 'Security';
  description: string;
  allowedRoles: UserRole[];
}

export interface Tenant {
  id: string;
  name: string;
  code: string;
  slug: string;
  domain: string;
  departments: string[];
  studentCount: number;
  facultyCount: number;
  tier: 'free_student' | 'pro_scholar' | 'campus_enterprise';
  status: 'active' | 'suspended';
  ssoConfig: {
    provider: 'google' | 'microsoft' | 'shibboleth';
    enabled: boolean;
    domainWhitelist: string[];
    entityId?: string;
  };
}

export interface SubscriptionPlan {
  id: 'free_student' | 'pro_scholar' | 'campus_enterprise';
  name: string;
  tagline: string;
  priceUSD: number;
  pricePKR: number;
  interval: 'month' | 'year';
  popular?: boolean;
  features: string[];
  limits: {
    ragQueries: number;
    geminiTokens: number;
    pdfOps: number;
    storageMB: number;
  };
}

export interface UsageMeter {
  ragQueriesUsed: number;
  ragQueriesLimit: number;
  tokensUsed: number;
  tokensLimit: number;
  pdfOpsUsed: number;
  pdfOpsLimit: number;
  storageUsedMB: number;
  storageLimitMB: number;
  billingCycleStart: string;
  billingCycleEnd: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  currency: 'PKR' | 'USD';
  status: 'paid' | 'pending' | 'failed';
  gateway: 'PayFast' | 'JazzCash' | 'EasyPaisa' | 'Raast' | 'Stripe';
  description: string;
  dunningRetries: number;
  pdfReceiptAvailable: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  resource: string;
  ipAddress: string;
  status: 'SUCCESS' | 'WARNING' | 'DENIED';
  details: string;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  secretMasked: string;
  createdAt: string;
  lastUsedAt?: string;
  scopes: string[];
  status: 'active' | 'revoked';
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  secret: string;
  status: 'active' | 'failing';
  lastDeliveryStatus?: number;
  lastDeliveryAt?: string;
}

export interface Integration {
  id: string;
  name: string;
  category: 'LMS' | 'Integrity' | 'Writing' | 'Communication';
  description: string;
  iconName: string;
  connected: boolean;
  lastSyncAt?: string;
  config?: Record<string, string>;
}

export interface AnalyticsData {
  totalQueries: number;
  totalTokens: number;
  activeStudents: number;
  rubricAverageScore: number;
  topCourses: { code: string; queries: number; documents: number }[];
  dailyQueries: { date: string; count: number; tokens: number }[];
  scoreDistribution: { range: string; count: number }[];
}

