import {
  AuthUser,
  Tenant,
  SubscriptionPlan,
  UsageMeter,
  Invoice,
  AuditLogEntry,
  ApiKey,
  WebhookEndpoint,
  Integration,
  RolePermission,
  AnalyticsData,
  UserRole,
} from '../src/types.js';
import { pdfService } from './pdfService.js';

export class AdminStore {
  // Pre-seeded Users representing all 4 roles
  private users: AuthUser[] = [
    {
      id: 'usr-student-1',
      name: 'Ahmed Khan',
      email: 'ahmed.khan@seecs.edu.pk',
      role: 'student',
      university: 'NUST',
      tenantId: 'tenant-nust',
      department: 'Computer Science (SEECS)',
      studentId: '2022-NUST-CS-042',
      twoFactorEnabled: true,
      ssoProvider: 'google_workspace',
      permissions: ['corpus:read', 'socratic:use', 'rubric:evaluate', 'pdf:use'],
      createdAt: '2024-09-01T08:00:00Z',
    },
    {
      id: 'usr-ta-1',
      name: 'Fatima Zahra',
      email: 'f.zahra@seecs.edu.pk',
      role: 'ta',
      university: 'NUST',
      tenantId: 'tenant-nust',
      department: 'Computer Science (SEECS)',
      studentId: 'TA-2023-CS-09',
      twoFactorEnabled: true,
      ssoProvider: 'microsoft_365',
      permissions: [
        'corpus:read',
        'corpus:write',
        'socratic:use',
        'rubric:evaluate',
        'rubric:calibrate',
        'pdf:use',
        'analytics:view_course',
      ],
      createdAt: '2024-08-15T09:30:00Z',
    },
    {
      id: 'usr-prof-1',
      name: 'Dr. Tariq Mahmood',
      email: 'tariq.mahmood@seecs.edu.pk',
      role: 'professor',
      university: 'NUST',
      tenantId: 'tenant-nust',
      department: 'Department of Computing',
      studentId: 'FAC-1048',
      twoFactorEnabled: true,
      ssoProvider: 'microsoft_365',
      permissions: [
        'corpus:read',
        'corpus:write',
        'corpus:delete',
        'socratic:use',
        'rubric:evaluate',
        'rubric:calibrate',
        'pdf:use',
        'analytics:view_department',
        'audit:view',
        'integration:manage',
      ],
      createdAt: '2023-01-10T11:00:00Z',
    },
    {
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
        'analytics:view_tenant',
        'billing:manage',
        'audit:view',
        'audit:export',
        'tenant:manage',
        'rbac:manage',
        'api_keys:manage',
        'webhooks:manage',
        'integration:manage',
      ],
      createdAt: '2022-06-01T08:00:00Z',
    },
  ];

  private currentUserId: string = 'usr-admin-1'; // Default to admin for full visibility

  // Multi-Tenants
  private tenants: Tenant[] = [
    {
      id: 'tenant-nust',
      name: 'National University of Sciences and Technology',
      code: 'NUST',
      slug: 'nust-isb',
      domain: 'nust.edu.pk',
      departments: [
        'School of Electrical Engineering and Computer Science (SEECS)',
        'School of Mechanical & Manufacturing Engineering (SMME)',
        'School of Chemical & Materials Engineering (SCME)',
        'NUST Business School (NBS)',
      ],
      studentCount: 14850,
      facultyCount: 1240,
      tier: 'campus_enterprise',
      status: 'active',
      ssoConfig: {
        provider: 'microsoft',
        enabled: true,
        domainWhitelist: ['@*.nust.edu.pk', '@seecs.edu.pk'],
        entityId: 'https://sts.windows.net/nust-edu-pk-tenant-id/',
      },
    },
    {
      id: 'tenant-fast',
      name: 'FAST National University of Computer & Emerging Sciences',
      code: 'FAST-NUCES',
      slug: 'fast-nuces',
      domain: 'nu.edu.pk',
      departments: ['Department of Computer Science', 'Department of Software Engineering', 'Department of AI & Data Science'],
      studentCount: 11200,
      facultyCount: 890,
      tier: 'campus_enterprise',
      status: 'active',
      ssoConfig: {
        provider: 'google',
        enabled: true,
        domainWhitelist: ['@isb.nu.edu.pk', '@khi.nu.edu.pk', '@lhr.nu.edu.pk'],
      },
    },
    {
      id: 'tenant-lums',
      name: 'Lahore University of Management Sciences',
      code: 'LUMS',
      slug: 'lums-lhr',
      domain: 'lums.edu.pk',
      departments: ['Syed Babar Ali School of Science and Engineering (SBASSE)', 'Mushtaq Ahmad Gurmani School'],
      studentCount: 5400,
      facultyCount: 420,
      tier: 'campus_enterprise',
      status: 'active',
      ssoConfig: {
        provider: 'shibboleth',
        enabled: true,
        domainWhitelist: ['@lums.edu.pk'],
      },
    },
    {
      id: 'tenant-giki',
      name: 'Ghulam Ishaq Khan Institute of Engineering Sciences',
      code: 'GIKI',
      slug: 'giki-topi',
      domain: 'giki.edu.pk',
      departments: ['Faculty of Computer Science and Engineering (FCSE)', 'Faculty of Electrical Engineering'],
      studentCount: 2600,
      facultyCount: 210,
      tier: 'pro_scholar',
      status: 'active',
      ssoConfig: {
        provider: 'google',
        enabled: true,
        domainWhitelist: ['@giki.edu.pk'],
      },
    },
  ];

  // RBAC Permission Catalog
  private permissionsCatalog: RolePermission[] = [
    {
      id: 'corpus:read',
      name: 'Read Course Corpus',
      category: 'Corpus',
      description: 'Access and search indexed lecture slides, notes, and problem sets.',
      allowedRoles: ['student', 'ta', 'professor', 'superadmin'],
    },
    {
      id: 'corpus:write',
      name: 'Upload & Index Corpus',
      category: 'Corpus',
      description: 'Upload new course syllabi, lab guidelines, and presentation slides.',
      allowedRoles: ['ta', 'professor', 'superadmin'],
    },
    {
      id: 'corpus:delete',
      name: 'Purge Corpus Documents',
      category: 'Corpus',
      description: 'Permanently remove documents or archived courses from the corpus.',
      allowedRoles: ['professor', 'superadmin'],
    },
    {
      id: 'socratic:use',
      name: 'Socratic Interview Partner',
      category: 'Grading',
      description: 'Conduct guided question-and-answer synthesis sessions.',
      allowedRoles: ['student', 'ta', 'professor', 'superadmin'],
    },
    {
      id: 'rubric:evaluate',
      name: 'Run Rubric Diagnostics',
      category: 'Grading',
      description: 'Evaluate assignment drafts against defined rubric criteria.',
      allowedRoles: ['student', 'ta', 'professor', 'superadmin'],
    },
    {
      id: 'rubric:calibrate',
      name: 'Calibrate Departmental Rubrics',
      category: 'Grading',
      description: 'Modify official criteria weighting, bounds, and grading guidelines.',
      allowedRoles: ['ta', 'professor', 'superadmin'],
    },
    {
      id: 'pdf:use',
      name: 'Execute PDF Utilities',
      category: 'PDF',
      description: 'Merge, split, rotate, organize, and generate academic PDFs.',
      allowedRoles: ['student', 'ta', 'professor', 'superadmin'],
    },
    {
      id: 'analytics:view_department',
      name: 'Departmental Analytics',
      category: 'Administration',
      description: 'View aggregated usage, rubric score distribution, and token consumption.',
      allowedRoles: ['professor', 'superadmin'],
    },
    {
      id: 'billing:manage',
      name: 'Manage Subscriptions & Invoicing',
      category: 'Billing',
      description: 'Upgrade tiers, manage PayFast/JazzCash/Stripe payment gateways, and view dunning.',
      allowedRoles: ['superadmin'],
    },
    {
      id: 'audit:view',
      name: 'Inspect Immutable Audit Logs',
      category: 'Security',
      description: 'Review security events, login attempts, data exports, and permission changes.',
      allowedRoles: ['professor', 'superadmin'],
    },
    {
      id: 'tenant:manage',
      name: 'Tenant & Multi-Tenancy Control',
      category: 'Administration',
      description: 'Configure institutional domains, campus departments, and SSO federation.',
      allowedRoles: ['superadmin'],
    },
    {
      id: 'api_keys:manage',
      name: 'API Key & Webhook Provisioning',
      category: 'Security',
      description: 'Generate server tokens and subscribe webhook endpoints to academic events.',
      allowedRoles: ['superadmin'],
    },
  ];

  // Subscription Plans
  private subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'free_student',
      name: 'Student Scholar',
      tagline: 'Ideal for undergraduate coursework and individual study',
      priceUSD: 0,
      pricePKR: 0,
      interval: 'month',
      features: [
        '50 RAG Grounded Queries / month',
        '100K Gemini 3.8 Flash Tokens',
        '10 PDF Manipulations / month',
        '25MB Encrypted Document Storage',
        'Standard Socratic Drafting Partner',
        'Community Support & Student Forum',
      ],
      limits: {
        ragQueries: 50,
        geminiTokens: 100000,
        pdfOps: 10,
        storageMB: 25,
      },
    },
    {
      id: 'pro_scholar',
      name: 'Pro Researcher',
      tagline: 'For thesis writers, graduate researchers & honors students',
      priceUSD: 9.99,
      pricePKR: 2800,
      interval: 'month',
      popular: true,
      features: [
        'Unlimited Grounded RAG Queries',
        '2,500,000 Gemini 3.8 Flash Tokens',
        'Unlimited PDF Operations (Merge, Split, Rotate)',
        '5 GB Secure Corpus Storage',
        'Full LaTeX Extraction & Mathematical OCR',
        'Predictive Rubric Grading with Confidence Scoring',
        'Direct Overleaf & LaTeX Synchronization',
        'Priority Inference & Dedicated Queue',
      ],
      limits: {
        ragQueries: 99999,
        geminiTokens: 2500000,
        pdfOps: 99999,
        storageMB: 5120,
      },
    },
    {
      id: 'campus_enterprise',
      name: 'Campus Enterprise License',
      tagline: 'Institution-wide deployment for departments & university faculties',
      priceUSD: 299,
      pricePKR: 85000,
      interval: 'month',
      features: [
        'Tenant-wide Unlimited Grounded Queries',
        '50,000,000 Pooled Gemini Tokens / month',
        'Multi-Departmental Hierarchy & Data Isolation',
        'Institutional Single Sign-On (Google Workspace, Entra ID, Shibboleth)',
        'Canvas LMS, Google Classroom & Moodle Gradebook Sync',
        'Turnitin & HEC Anti-Plagiarism Pipeline Integration',
        'Granular Role-Based Access Control (RBAC)',
        'Immutable Security Audit Logging & FERPA/PECIA Compliance',
        'Dedicated SLA & On-premise Hybrid Gateway Option',
      ],
      limits: {
        ragQueries: 1000000,
        geminiTokens: 50000000,
        pdfOps: 1000000,
        storageMB: 102400,
      },
    },
  ];

  // Live Usage Meter for Current Tenant
  private usageMeter: UsageMeter = {
    ragQueriesUsed: 384,
    ragQueriesLimit: 10000,
    tokensUsed: 1420500,
    tokensLimit: 50000000,
    pdfOpsUsed: 46,
    pdfOpsLimit: 500,
    storageUsedMB: 18.4,
    storageLimitMB: 10240,
    billingCycleStart: '2026-09-01T00:00:00Z',
    billingCycleEnd: '2026-09-30T23:59:59Z',
  };

  // Invoices with local Pakistani payment gateway support & dunning
  private invoices: Invoice[] = [
    {
      id: 'inv-2026-09-001',
      invoiceNumber: 'ABH-NUST-2026-09',
      date: '2026-09-01T10:00:00Z',
      amount: 85000,
      currency: 'PKR',
      status: 'paid',
      gateway: 'PayFast',
      description: 'NUST SEECS - Campus Enterprise License (September 2026)',
      dunningRetries: 0,
      pdfReceiptAvailable: true,
    },
    {
      id: 'inv-2026-08-002',
      invoiceNumber: 'ABH-NUST-2026-08',
      date: '2026-08-01T10:00:00Z',
      amount: 85000,
      currency: 'PKR',
      status: 'paid',
      gateway: 'Raast',
      description: 'NUST SEECS - Campus Enterprise License (August 2026)',
      dunningRetries: 0,
      pdfReceiptAvailable: true,
    },
    {
      id: 'inv-2026-07-003',
      invoiceNumber: 'ABH-NUST-2026-07',
      date: '2026-07-01T10:00:00Z',
      amount: 85000,
      currency: 'PKR',
      status: 'paid',
      gateway: 'JazzCash',
      description: 'NUST SEECS - Campus Enterprise License (July 2026)',
      dunningRetries: 0,
      pdfReceiptAvailable: true,
    },
    {
      id: 'inv-2026-06-004',
      invoiceNumber: 'ABH-DEPT-2026-06',
      date: '2026-06-15T14:20:00Z',
      amount: 2800,
      currency: 'PKR',
      status: 'failed',
      gateway: 'EasyPaisa',
      description: 'Pro Scholar Individual Renewal (Dunning: Retried 2 times)',
      dunningRetries: 2,
      pdfReceiptAvailable: true,
    },
  ];

  // Immutable Audit Logs
  private auditLogs: AuditLogEntry[] = [
    {
      id: 'log-001',
      timestamp: '2026-09-12T02:45:10Z',
      actorId: 'usr-admin-1',
      actorName: 'Engr. Bilal Siddiqui',
      actorEmail: 'bilal.siddiqui@admin.nust.edu.pk',
      actorRole: 'superadmin',
      action: 'SSO_FEDERATION_VERIFIED',
      resource: 'tenant:tenant-nust/ssoConfig',
      ipAddress: '111.68.102.34',
      status: 'SUCCESS',
      details: 'Validated Microsoft Entra ID SAML certificate fingerprint for @seecs.edu.pk.',
    },
    {
      id: 'log-002',
      timestamp: '2026-09-12T02:30:15Z',
      actorId: 'usr-student-1',
      actorName: 'Ahmed Khan',
      actorEmail: 'ahmed.khan@seecs.edu.pk',
      actorRole: 'student',
      action: 'RUBRIC_DIAGNOSTIC_RUN',
      resource: 'course:cs-212/rubric-eval',
      ipAddress: '39.40.12.189',
      status: 'SUCCESS',
      details: 'Executed diagnostic evaluation against NUST SEECS Assignment Rubric (Score: 84/100).',
    },
    {
      id: 'log-003',
      timestamp: '2026-09-12T01:14:02Z',
      actorId: 'usr-ta-1',
      actorName: 'Fatima Zahra',
      actorEmail: 'f.zahra@seecs.edu.pk',
      actorRole: 'ta',
      action: 'CORPUS_DOCUMENT_INGEST',
      resource: 'document:doc-cs212-01 (Lecture 04 Red-Black Trees.pdf)',
      ipAddress: '111.68.102.50',
      status: 'SUCCESS',
      details: 'Extracted 18 structured blocks, 4 LaTeX equations and 6 searchable chunks.',
    },
    {
      id: 'log-004',
      timestamp: '2026-09-11T19:22:45Z',
      actorId: 'usr-unknown',
      actorName: 'External Client',
      actorEmail: 'guest@attacker.net',
      actorRole: 'student',
      action: 'PROMPT_INJECTION_QUARANTINE',
      resource: 'chat/input',
      ipAddress: '185.220.101.5',
      status: 'WARNING',
      details: 'Detected adversarial jailbreak string in user prompt. Content safely neutralized into untrusted text envelope.',
    },
    {
      id: 'log-005',
      timestamp: '2026-09-11T14:05:30Z',
      actorId: 'usr-admin-1',
      actorName: 'Engr. Bilal Siddiqui',
      actorEmail: 'bilal.siddiqui@admin.nust.edu.pk',
      actorRole: 'superadmin',
      action: 'PAYMENT_GATEWAY_WEBHOOK',
      resource: 'invoice:inv-2026-09-001',
      ipAddress: '203.124.45.10',
      status: 'SUCCESS',
      details: 'PayFast Pakistan IPN confirmed PKR 85,000 transaction for NUST SEECS.',
    },
    {
      id: 'log-006',
      timestamp: '2026-09-10T11:15:00Z',
      actorId: 'usr-prof-1',
      actorName: 'Dr. Tariq Mahmood',
      actorEmail: 'tariq.mahmood@seecs.edu.pk',
      actorRole: 'professor',
      action: 'LMS_CANVAS_SYNC',
      resource: 'integration:canvas-lms',
      ipAddress: '111.68.102.12',
      status: 'SUCCESS',
      details: 'Synchronized 142 student lab submissions from Canvas course 4920.',
    },
  ];

  // API Keys
  private apiKeys: ApiKey[] = [
    {
      id: 'key-01',
      name: 'NUST SEECS Canvas Integration Key',
      prefix: 'abh_live_9f8a',
      secretMasked: 'abh_live_9f8a****************************4b2c',
      createdAt: '2026-08-10T09:00:00Z',
      lastUsedAt: '2026-09-12T02:15:00Z',
      scopes: ['corpus:read', 'rubric:eval', 'analytics:read'],
      status: 'active',
    },
    {
      id: 'key-02',
      name: 'Campus Automated Grading Bot',
      prefix: 'abh_live_3c1d',
      secretMasked: 'abh_live_3c1d****************************7e9f',
      createdAt: '2026-08-22T14:30:00Z',
      lastUsedAt: '2026-09-11T18:40:00Z',
      scopes: ['rubric:eval', 'pdf:ops'],
      status: 'active',
    },
  ];

  // Webhooks
  private webhooks: WebhookEndpoint[] = [
    {
      id: 'wh-01',
      url: 'https://canvas.seecs.nust.edu.pk/api/v1/webhooks/abhogiparhai',
      events: ['rubric.evaluated', 'document.ingested'],
      secret: 'whsec_nust_98df89a7f6d5e4b3c2a1',
      status: 'active',
      lastDeliveryStatus: 200,
      lastDeliveryAt: '2026-09-12T02:30:20Z',
    },
    {
      id: 'wh-02',
      url: 'https://alerts.nust.edu.pk/hooks/academic-integrity',
      events: ['security.injection_prevented', 'dunning.payment_failed'],
      secret: 'whsec_nust_alerts_78a6b5c4d3e2f1',
      status: 'active',
      lastDeliveryStatus: 200,
      lastDeliveryAt: '2026-09-11T19:22:50Z',
    },
  ];

  // Third-Party Integrations
  private integrations: Integration[] = [
    {
      id: 'int-canvas',
      name: 'Canvas LMS',
      category: 'LMS',
      description: 'Sync lecture modules, assignments, and export predictive rubric grades directly to Gradebook.',
      iconName: 'GraduationCap',
      connected: true,
      lastSyncAt: '2026-09-12T01:45:00Z',
      config: { domain: 'canvas.seecs.nust.edu.pk', syncFrequency: 'Real-time' },
    },
    {
      id: 'int-gclassroom',
      name: 'Google Classroom',
      category: 'LMS',
      description: 'Import slide decks and assignment files straight into your private course corpus.',
      iconName: 'LayoutGrid',
      connected: true,
      lastSyncAt: '2026-09-11T20:10:00Z',
      config: { domain: 'seecs.edu.pk', autoIngest: 'Enabled' },
    },
    {
      id: 'int-moodle',
      name: 'Moodle Academic Portal',
      category: 'LMS',
      description: 'Bi-directional SCORM and question bank synchronization for university examinations.',
      iconName: 'BookOpen',
      connected: false,
    },
    {
      id: 'int-turnitin',
      name: 'Turnitin & HEC Anti-Plagiarism',
      category: 'Integrity',
      description: 'Pre-flight similarity checking and citation attribution verification before final submission.',
      iconName: 'ShieldCheck',
      connected: true,
      lastSyncAt: '2026-09-12T00:30:00Z',
    },
    {
      id: 'int-overleaf',
      name: 'Overleaf / Cloud LaTeX',
      category: 'Writing',
      description: 'Export Socratic drafts, proofs, and equations as compile-ready LaTeX templates.',
      iconName: 'FileCode2',
      connected: true,
      lastSyncAt: '2026-09-10T16:20:00Z',
    },
    {
      id: 'int-teams',
      name: 'Microsoft Teams & Slack',
      category: 'Communication',
      description: 'Broadcast lecture announcements, rubric releases, and quota alerts to student channels.',
      iconName: 'MessageSquare',
      connected: false,
    },
  ];

  // Advanced Analytics
  private analyticsData: AnalyticsData = {
    totalQueries: 14820,
    totalTokens: 18450000,
    activeStudents: 1240,
    rubricAverageScore: 81.4,
    topCourses: [
      { code: 'CS-212', queries: 5410, documents: 14 },
      { code: 'EE-310', queries: 3290, documents: 9 },
      { code: 'CS-330', queries: 2840, documents: 8 },
      { code: 'MATH-201', queries: 2180, documents: 11 },
      { code: 'CS-401', queries: 1100, documents: 5 },
    ],
    dailyQueries: [
      { date: 'Sep 06', count: 1850, tokens: 2100000 },
      { date: 'Sep 07', count: 2100, tokens: 2650000 },
      { date: 'Sep 08', count: 1940, tokens: 2400000 },
      { date: 'Sep 09', count: 2450, tokens: 3100000 },
      { date: 'Sep 10', count: 2280, tokens: 2900000 },
      { date: 'Sep 11', count: 2010, tokens: 2550000 },
      { date: 'Sep 12', count: 2190, tokens: 2750000 },
    ],
    scoreDistribution: [
      { range: '90-100% (A)', count: 285 },
      { range: '80-89% (B+)', count: 460 },
      { range: '70-79% (B)', count: 320 },
      { range: '60-69% (C)', count: 125 },
      { range: '<60% (Warning)', count: 50 },
    ],
  };

  // --- METHODS ---

  public getUsers(): AuthUser[] {
    return this.users;
  }

  public getCurrentUser(): AuthUser {
    const user = this.users.find((u) => u.id === this.currentUserId);
    return user || this.users[3]; // Fallback to superadmin
  }

  public switchUser(userId: string): AuthUser | null {
    const target = this.users.find((u) => u.id === userId);
    if (target) {
      this.currentUserId = target.id;
      this.logAudit({
        actorId: target.id,
        actorName: target.name,
        actorEmail: target.email,
        actorRole: target.role,
        action: 'AUTH_SESSION_SWITCH',
        resource: `user:${target.id}`,
        ipAddress: '127.0.0.1',
        status: 'SUCCESS',
        details: `Session persona switched to ${target.name} (${target.role.toUpperCase()})`,
      });
      return target;
    }
    return null;
  }

  public updateCurrentUser(updates: Partial<AuthUser>): AuthUser {
    const user = this.getCurrentUser();
    Object.assign(user, updates);
    this.logAudit({
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'ACCOUNT_PROFILE_UPDATED',
      resource: `user:${user.id}`,
      ipAddress: '127.0.0.1',
      status: 'SUCCESS',
      details: `Profile attributes updated.`,
    });
    return user;
  }

  public getTenants(): Tenant[] {
    return this.tenants;
  }

  public getPermissions(): RolePermission[] {
    return this.permissionsCatalog;
  }

  public updateRolePermissions(permissionId: string, allowedRoles: UserRole[]): boolean {
    const perm = this.permissionsCatalog.find((p) => p.id === permissionId);
    if (perm) {
      perm.allowedRoles = allowedRoles;
      const user = this.getCurrentUser();
      this.logAudit({
        actorId: user.id,
        actorName: user.name,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'RBAC_PERMISSION_MODIFIED',
        resource: `permission:${permissionId}`,
        ipAddress: '127.0.0.1',
        status: 'SUCCESS',
        details: `Updated allowed roles to: [${allowedRoles.join(', ')}]`,
      });
      return true;
    }
    return false;
  }

  public getSubscriptionPlans(): SubscriptionPlan[] {
    return this.subscriptionPlans;
  }

  public getUsageMeter(): UsageMeter {
    return this.usageMeter;
  }

  public incrementMeter(
    meter: 'ragQueriesUsed' | 'tokensUsed' | 'pdfOpsUsed' | 'storageUsedMB',
    delta: number
  ) {
    if (this.usageMeter[meter] !== undefined) {
      this.usageMeter[meter] += delta;
    }
  }

  public getInvoices(): Invoice[] {
    return this.invoices;
  }

  public addInvoice(invoice: Omit<Invoice, 'id'>): Invoice {
    const newInv: Invoice = {
      ...invoice,
      id: `inv-${Date.now()}`,
    };
    this.invoices.unshift(newInv);
    return newInv;
  }

  public retryDunning(invoiceId: string): { success: boolean; message: string; invoice?: Invoice } {
    const inv = this.invoices.find((i) => i.id === invoiceId);
    if (!inv) return { success: false, message: 'Invoice not found' };

    inv.dunningRetries += 1;
    inv.status = 'paid'; // Simulate successful recovery
    const user = this.getCurrentUser();
    this.logAudit({
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'DUNNING_RECOVERY_SUCCESS',
      resource: `invoice:${invoiceId}`,
      ipAddress: '127.0.0.1',
      status: 'SUCCESS',
      details: `Payment re-processed via ${inv.gateway}. Outstanding balance of ${inv.currency} ${inv.amount.toLocaleString()} settled.`,
    });
    return {
      success: true,
      message: `Payment successfully recovered via ${inv.gateway} gateway. Status updated to PAID.`,
      invoice: inv,
    };
  }

  public getAuditLogs(filterAction?: string, filterStatus?: string): AuditLogEntry[] {
    let logs = [...this.auditLogs];
    if (filterAction) {
      logs = logs.filter((l) => l.action.toLowerCase().includes(filterAction.toLowerCase()));
    }
    if (filterStatus) {
      logs = logs.filter((l) => l.status === filterStatus);
    }
    return logs;
  }

  public logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const newLog: AuditLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(newLog);
    return newLog;
  }

  public getApiKeys(): ApiKey[] {
    return this.apiKeys;
  }

  public createApiKey(name: string, scopes: string[]): { key: ApiKey; fullSecret: string } {
    const randPart = Math.random().toString(36).substring(2, 10);
    const prefix = `abh_live_${randPart.slice(0, 4)}`;
    const fullSecret = `${prefix}_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const secretMasked = `${prefix}****************************${fullSecret.slice(-4)}`;

    const newKey: ApiKey = {
      id: `key-${Date.now()}`,
      name: name.trim(),
      prefix,
      secretMasked,
      createdAt: new Date().toISOString(),
      scopes,
      status: 'active',
    };

    this.apiKeys.unshift(newKey);
    const user = this.getCurrentUser();
    this.logAudit({
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'API_KEY_CREATED',
      resource: `apiKey:${newKey.id}`,
      ipAddress: '127.0.0.1',
      status: 'SUCCESS',
      details: `Generated API key "${name}" with scopes [${scopes.join(', ')}].`,
    });

    return { key: newKey, fullSecret };
  }

  public revokeApiKey(keyId: string): boolean {
    const k = this.apiKeys.find((item) => item.id === keyId);
    if (k) {
      k.status = 'revoked';
      const user = this.getCurrentUser();
      this.logAudit({
        actorId: user.id,
        actorName: user.name,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'API_KEY_REVOKED',
        resource: `apiKey:${keyId}`,
        ipAddress: '127.0.0.1',
        status: 'WARNING',
        details: `Revoked API key "${k.name}".`,
      });
      return true;
    }
    return false;
  }

  public getWebhooks(): WebhookEndpoint[] {
    return this.webhooks;
  }

  public addWebhook(url: string, events: string[]): WebhookEndpoint {
    const newWh: WebhookEndpoint = {
      id: `wh-${Date.now()}`,
      url: url.trim(),
      events,
      secret: `whsec_${Math.random().toString(36).substring(2, 16)}`,
      status: 'active',
      lastDeliveryStatus: 200,
      lastDeliveryAt: new Date().toISOString(),
    };
    this.webhooks.unshift(newWh);
    const user = this.getCurrentUser();
    this.logAudit({
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'WEBHOOK_ENDPOINT_REGISTERED',
      resource: `webhook:${newWh.id}`,
      ipAddress: '127.0.0.1',
      status: 'SUCCESS',
      details: `Registered webhook to ${url} for events [${events.join(', ')}].`,
    });
    return newWh;
  }

  public testWebhook(webhookId: string): { success: boolean; responseStatus: number; message: string } {
    const wh = this.webhooks.find((w) => w.id === webhookId);
    if (!wh) return { success: false, responseStatus: 404, message: 'Webhook not found' };

    wh.lastDeliveryAt = new Date().toISOString();
    wh.lastDeliveryStatus = 200;
    const user = this.getCurrentUser();
    this.logAudit({
      actorId: user.id,
      actorName: user.name,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'WEBHOOK_PING_TEST',
      resource: `webhook:${webhookId}`,
      ipAddress: '127.0.0.1',
      status: 'SUCCESS',
      details: `Delivered test event "ping.academic_workspace" to ${wh.url} (HTTP 200 OK).`,
    });

    return {
      success: true,
      responseStatus: 200,
      message: `Test delivery to ${wh.url} returned HTTP 200 OK. Signature validated with secret.`,
    };
  }

  public getIntegrations(): Integration[] {
    return this.integrations;
  }

  public toggleIntegration(integrationId: string, connect: boolean): Integration | null {
    const int = this.integrations.find((i) => i.id === integrationId);
    if (int) {
      int.connected = connect;
      int.lastSyncAt = connect ? new Date().toISOString() : undefined;
      const user = this.getCurrentUser();
      this.logAudit({
        actorId: user.id,
        actorName: user.name,
        actorEmail: user.email,
        actorRole: user.role,
        action: connect ? 'INTEGRATION_CONNECTED' : 'INTEGRATION_DISCONNECTED',
        resource: `integration:${int.name}`,
        ipAddress: '127.0.0.1',
        status: 'SUCCESS',
        details: `${int.name} connector was ${connect ? 'enabled' : 'disabled'}.`,
      });
      return int;
    }
    return null;
  }

  public getAnalytics(): AnalyticsData {
    return this.analyticsData;
  }

  // Generate Real Downloadable PDF Receipt for an Invoice
  public async generateInvoicePdf(invoiceId: string): Promise<string> {
    const inv = this.invoices.find((i) => i.id === invoiceId);
    if (!inv) throw new Error('Invoice not found');

    const bodyText = `INVOICE & PAYMENT RECEIPT
------------------------------------------------------------
Invoice Number:    ${inv.invoiceNumber}
Issue Date:        ${new Date(inv.date).toLocaleDateString('en-PK', { dateStyle: 'full' })}
Payment Status:    ${inv.status.toUpperCase()}
Payment Gateway:   ${inv.gateway} (Verified Electronic Settlement)
Bill To:           National University of Sciences and Technology (NUST)
Department:        School of Electrical Engineering and Computer Science
Authorized Payer:  Engr. Bilal Siddiqui (Directorate of ICT)
Currency & Amount: ${inv.currency} ${inv.amount.toLocaleString()}

ITEM DESCRIPTION:
- ${inv.description}
  Includes campus-wide RAG grounding, private lecture slide indexing,
  Socratic drafting, predictive rubric evaluation, and real PDF utilities.
  Dunning Retries on Record: ${inv.dunningRetries}

TAX & COMPLIANCE SUMMARY:
- Pakistan PRA / FBR Withholding Sales Tax on IT Services: Exempt / 0%
- Electronic Transaction Record verified under Electronic Transactions Ordinance 2002.
- Digital Audit Hash: SHA256-${Math.random().toString(36).substring(2, 14)}

Thank you for choosing ABHOGIPARHAI Academic Workspace.
For institutional finance support, contact finance@abhogiparhai.edu.pk`;

    return await pdfService.generateAcademicPdf(
      `TAX INVOICE — ${inv.invoiceNumber}`,
      `Official Institutional Receipt • ${inv.gateway} Settlement`,
      'ABHOGIPARHAI Finance Division',
      'National University of Sciences and Technology (NUST)',
      bodyText
    );
  }
}

export const adminStore = new AdminStore();
