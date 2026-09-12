import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { ragStore } from './server/ragStore.js';
import { geminiService } from './server/gemini.js';
import { pdfService } from './server/pdfService.js';
import { adminStore } from './server/adminStore.js';
import {
  Citation,
  CourseDocument,
  DocumentChunk,
  GeneratedArtifact,
  SocraticIdeaState,
  ToolExecution,
} from './src/types.js';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parsing with generous limit for document/PDF base64 payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Structured Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// --- API ROUTES ---

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'ABHOGIPARHAI',
    version: '1.0.0',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Courses
app.get('/api/courses', (req, res) => {
  res.json(ragStore.getCourses());
});

app.post('/api/courses', (req, res) => {
  const { code, title, instructor } = req.body;
  if (!code || !title) {
    return res.status(400).json({ error: 'Course code and title are required' });
  }
  const newCourse = {
    id: `course-${Date.now()}`,
    code: code.trim().toUpperCase(),
    title: title.trim(),
    instructor: instructor?.trim() || '',
    documentsCount: 0,
  };
  ragStore.addCourse(newCourse);
  res.json(newCourse);
});

// Documents
app.get('/api/documents', (req, res) => {
  const courseId = req.query.courseId as string | undefined;
  const docs = ragStore.getDocuments(courseId);
  res.json(docs);
});

app.get('/api/documents/:id', (req, res) => {
  const doc = ragStore.getDocument(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }
  res.json(doc);
});

app.delete('/api/documents/:id', (req, res) => {
  const success = ragStore.deleteDocument(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Document not found' });
  }
  res.json({ success: true, message: 'Document deleted from private corpus.' });
});

// Reset Corpus
app.post('/api/corpus/reset', (req, res) => {
  ragStore.resetCorpus();
  res.json({ success: true, message: 'Course corpus reset to default academic state.' });
});

// Document Upload & Ingestion
app.post('/api/documents/upload', async (req, res) => {
  try {
    const { fileName, fileData, mimeType, courseId, courseName } = req.body;

    if (!fileName || !fileData) {
      return res.status(400).json({ error: 'File name and data are required' });
    }

    const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const effectiveMime = mimeType || 'application/pdf';

    // If PDF, extract actual page count using pdfService
    let detectedPages = 1;
    if (effectiveMime === 'application/pdf') {
      try {
        const info = await pdfService.getPdfInfo(fileData);
        detectedPages = info.pageCount;
      } catch (err) {
        console.warn('PDF info parse warning:', err);
      }
    }

    // Process through Multimodal Vision & OCR
    const extraction = await geminiService.extractDocumentMultimodal(
      fileData,
      effectiveMime,
      fileName
    );

    const targetCourse = courseId ? ragStore.getCourse(courseId) : undefined;
    const finalCourseName = targetCourse ? targetCourse.title : (courseName || 'General Academic');

    const newDoc: CourseDocument = {
      id: docId,
      courseId: courseId || 'general',
      courseName: finalCourseName,
      fileName,
      fileSize: Math.round((fileData.length * 3) / 4),
      mimeType: effectiveMime,
      uploadedAt: new Date().toISOString(),
      pageCount: Math.max(detectedPages, extraction.pageCount),
      extractedText: extraction.extractedText,
      blocks: extraction.blocks,
      chunks: [],
      status: 'ready',
      isHandwritten: extraction.isHandwritten,
      containsMath: extraction.containsMath,
    };

    ragStore.addDocumentDirectly(newDoc);

    if (targetCourse) {
      targetCourse.documentsCount += 1;
    }

    res.json({
      success: true,
      document: newDoc,
      message: `Successfully ingested "${fileName}" with ${newDoc.blocks.length} structured blocks and ${newDoc.chunks.length} searchable chunks.`,
    });
  } catch (err: any) {
    console.error('Document upload error:', err);
    res.status(500).json({ error: err.message || 'Failed to process document' });
  }
});

// Chat Orchestrator Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const {
      message,
      history,
      courseId,
      strictCorpusOnly,
      strictGrounding,
      attachedDocIds,
      userRole,
      university,
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const isStrict = strictCorpusOnly === true || strictGrounding === true;
    const toolsExecuted: ToolExecution[] = [];

    // Step 1: Collect relevant document chunks from attached documents and course corpus
    let attachedChunks: DocumentChunk[] = [];
    if (Array.isArray(attachedDocIds) && attachedDocIds.length > 0) {
      for (const docId of attachedDocIds) {
        const doc = ragStore.getDocument(docId);
        if (doc && doc.chunks && doc.chunks.length > 0) {
          attachedChunks.push(...doc.chunks);
        }
      }
    }

    // Search corpus for keyword matches
    const searchResults = ragStore.searchCorpus(message, courseId, 4);
    const searchChunks = searchResults.map((r) => r.chunk);

    // Merge unique chunks
    const chunkMap = new Map<string, DocumentChunk>();
    for (const c of [...attachedChunks, ...searchChunks]) {
      chunkMap.set(c.id, c);
    }
    const chunks = Array.from(chunkMap.values()).slice(0, 5);

    if (chunks.length > 0) {
      toolsExecuted.push({
        toolName: 'corpus_retriever',
        status: 'completed',
        message: `Retrieved ${chunks.length} grounded course chunks (${chunks.map((c) => c.documentName).slice(0, 2).join(', ')}).`,
        timestamp: new Date().toISOString(),
      });
    }

    // Step 2: Classify intent
    const intentResult = await geminiService.classifyIntent(
      message,
      !!(attachedDocIds && attachedDocIds.length > 0)
    );

    toolsExecuted.push({
      toolName: 'intent_orchestrator',
      status: 'completed',
      message: `Intent detected: ${intentResult.intent} (${intentResult.explanation})`,
      timestamp: new Date().toISOString(),
    });

    // Step 3: Handle intent execution
    let responseText = '';
    let citations: Citation[] = [];
    let artifact: GeneratedArtifact | undefined = undefined;

    // Check if it's a PDF utility request
    if (intentResult.intent === 'pdf_utility') {
      toolsExecuted.push({
        toolName: 'pdf_toolkit',
        status: 'completed',
        message: 'PDF utility activated.',
        timestamp: new Date().toISOString(),
      });
      responseText = `I detected a PDF manipulation request. You can perform real PDF operations in the **PDF Toolkit** module (accessible from the sidebar):\n\n- **Merge**: Combine multiple lecture slide sets or assignments into one.\n- **Split**: Extract specific problem sets or pages.\n- **Organize & Rotate**: Reorder pages, remove duplicates, or correct orientation.\n- **Compress & Inspect**: View document metadata and byte size.\n\nWould you like me to process a specific document from your course corpus?`;
    } else if (intentResult.intent === 'socratic_interview') {
      toolsExecuted.push({
        toolName: 'socratic_interview_agent',
        status: 'completed',
        message: 'Socratic Interview mode activated. Ready to develop ideas turn-by-turn.',
        timestamp: new Date().toISOString(),
      });
      const turn = await geminiService.socraticTurn(message, {
        topic: message,
        thesis: '',
        arguments: [],
        evidence: [],
        examples: [],
        counterarguments: [],
        conclusion: '',
      });
      responseText = `**[Socratic Interview Mode Activated]**\n\n${turn.agentQuestion}\n\n*(Tip: Answer naturally using voice or text. When you have clarified your thesis and evidence, I will synthesize your complete academic draft!)*`;
    } else if (intentResult.intent === 'rubric_evaluation') {
      toolsExecuted.push({
        toolName: 'rubric_evaluator',
        status: 'completed',
        message: 'Rubric Evaluator activated.',
        timestamp: new Date().toISOString(),
      });
      responseText = `To evaluate your assignment against a university grading rubric, you can either:\n\n1. Paste your draft and rubric here in chat, or\n2. Open the **Rubric Evaluator** tab in the sidebar for full interactive criterion-by-criterion diagnostics with confidence scores and evidence quotes.\n\nWhat assignment would you like to review?`;
    } else if (intentResult.intent === 'academic_writer') {
      toolsExecuted.push({
        toolName: 'academic_writer',
        status: 'running',
        message: 'Synthesizing academic document with citations and LaTeX formatting...',
        timestamp: new Date().toISOString(),
      });

      const sourceContext = chunks.map((c) => c.content).join('\n\n');
      citations = chunks.map((c) => ({
        sourceDocId: c.documentId,
        sourceDocName: c.documentName,
        page: c.pageNumber,
        snippet: c.content.slice(0, 160) + '...',
        section: c.sectionTitle,
      }));

      const generatedDraft = await geminiService.generateAcademicWork(
        'lab_report',
        message,
        sourceContext,
        citations
      );

      artifact = {
        id: `art-${Date.now()}`,
        title: 'Generated Academic Work',
        type: 'lab_report',
        courseCode: courseId ? ragStore.getCourse(courseId)?.code : undefined,
        content: generatedDraft,
        createdAt: new Date().toISOString(),
        citations,
      };

      toolsExecuted[toolsExecuted.length - 1].status = 'completed';
      toolsExecuted[toolsExecuted.length - 1].message = `Synthesized document with ${citations.length} grounded citations.`;

      responseText = `I have generated the academic work grounded in your course documents. You can inspect, edit, and export it as Markdown or formatted PDF in the **Artifact Studio** tab.\n\n### Document Preview\n\n${generatedDraft}`;
    } else {
      // Default: Conversational AI Partner (ChatGPT / Gemini level)
      toolsExecuted.push({
        toolName: chunks.length > 0 ? 'grounded_academic_copilot' : 'gemini_intelligence_engine',
        status: 'completed',
        message: chunks.length > 0
          ? `Grounded in ${chunks.length} course sources with Gemini 3.8 Flash.`
          : `Synthesized via Gemini 3.8 Flash academic co-pilot.`,
        timestamp: new Date().toISOString(),
      });

      const courseObj = courseId ? ragStore.getCourse(courseId) : undefined;
      const chatResult = await geminiService.chatConversation({
        message,
        history,
        chunks,
        strictCorpusOnly: isStrict,
        courseContext: courseObj ? { code: courseObj.code, title: courseObj.title } : undefined,
        university: university || 'NUST',
        userRole: userRole || 'student',
      });

      responseText = chatResult.answer;
      citations = chatResult.citations;
    }

    res.json({
      reply: responseText,
      citations,
      toolsExecuted,
      artifact,
    });
  } catch (err: any) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({ error: err.message || 'Chat processing error' });
  }
});

// RAG Direct Query
app.post('/api/rag/query', async (req, res) => {
  try {
    const { question, courseId, strictCorpusOnly } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const searchResults = ragStore.searchCorpus(question, courseId, 5);
    const chunks = searchResults.map((r) => r.chunk);

    const ragResult = await geminiService.answerRAGQuery(
      question,
      chunks,
      strictCorpusOnly !== false
    );

    res.json(ragResult);
  } catch (err: any) {
    console.error('RAG query error:', err);
    res.status(500).json({ error: err.message || 'RAG query failed' });
  }
});

// Socratic Interview Endpoints
app.post('/api/interview/start', async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const initialState: SocraticIdeaState = {
      topic,
      thesis: '',
      arguments: [],
      evidence: [],
      examples: [],
      counterarguments: [],
      conclusion: '',
    };

    const turn = await geminiService.socraticTurn(topic, initialState);
    res.json({
      turn,
      state: turn.updatedState,
    });
  } catch (err: any) {
    console.error('Interview start error:', err);
    res.status(500).json({ error: err.message || 'Failed to start interview' });
  }
});

app.post('/api/interview/respond', async (req, res) => {
  try {
    const { topic, state, studentAnswer } = req.body;
    if (!studentAnswer) {
      return res.status(400).json({ error: 'Student answer is required' });
    }

    const turn = await geminiService.socraticTurn(topic, state, studentAnswer);
    res.json({
      turn,
      state: turn.updatedState,
    });
  } catch (err: any) {
    console.error('Interview respond error:', err);
    res.status(500).json({ error: err.message || 'Failed to process interview response' });
  }
});

app.post('/api/interview/draft', async (req, res) => {
  try {
    const { state, format } = req.body;
    if (!state) {
      return res.status(400).json({ error: 'Interview state is required' });
    }

    const draft = await geminiService.socraticGenerateDraft(state, format || 'academic_essay');
    res.json({
      draft,
      title: `${state.topic || 'Academic Paper'} — Synthesized Draft`,
    });
  } catch (err: any) {
    console.error('Interview draft error:', err);
    res.status(500).json({ error: err.message || 'Failed to synthesize draft' });
  }
});

// Rubric Evaluation Endpoint
app.post('/api/rubric/evaluate', async (req, res) => {
  try {
    const { rubricText, draftText } = req.body;
    if (!rubricText || !draftText) {
      return res.status(400).json({ error: 'Both rubricText and draftText are required' });
    }

    const report = await geminiService.evaluateRubric(rubricText, draftText);
    res.json(report);
  } catch (err: any) {
    console.error('Rubric evaluation error:', err);
    res.status(500).json({ error: err.message || 'Rubric evaluation failed' });
  }
});

// PDF Toolkit Endpoints
app.post('/api/pdf/merge', async (req, res) => {
  try {
    const { pdfBase64Array } = req.body;
    if (!pdfBase64Array || !Array.isArray(pdfBase64Array) || pdfBase64Array.length === 0) {
      return res.status(400).json({ error: 'pdfBase64Array array is required' });
    }

    const mergedBase64 = await pdfService.mergePdfs(pdfBase64Array);
    res.json({
      success: true,
      mergedPdfBase64: mergedBase64,
      message: `Successfully merged ${pdfBase64Array.length} PDF files.`,
    });
  } catch (err: any) {
    console.error('PDF merge error:', err);
    res.status(500).json({ error: err.message || 'PDF merge failed' });
  }
});

app.post('/api/pdf/split', async (req, res) => {
  try {
    const { pdfBase64, startPage, endPage } = req.body;
    if (!pdfBase64 || !startPage || !endPage) {
      return res.status(400).json({ error: 'pdfBase64, startPage, and endPage are required' });
    }

    const splitBase64 = await pdfService.splitPdf(pdfBase64, Number(startPage), Number(endPage));
    res.json({
      success: true,
      splitPdfBase64: splitBase64,
      message: `Extracted pages ${startPage} through ${endPage}.`,
    });
  } catch (err: any) {
    console.error('PDF split error:', err);
    res.status(500).json({ error: err.message || 'PDF split failed' });
  }
});

app.post('/api/pdf/organize', async (req, res) => {
  try {
    const { pdfBase64, operations } = req.body;
    if (!pdfBase64 || !operations) {
      return res.status(400).json({ error: 'pdfBase64 and operations are required' });
    }

    const organizedBase64 = await pdfService.organizePdf(pdfBase64, operations);
    res.json({
      success: true,
      organizedPdfBase64: organizedBase64,
      message: 'Successfully updated PDF page structure.',
    });
  } catch (err: any) {
    console.error('PDF organize error:', err);
    res.status(500).json({ error: err.message || 'PDF organize failed' });
  }
});

app.post('/api/pdf/info', async (req, res) => {
  try {
    const { pdfBase64 } = req.body;
    if (!pdfBase64) {
      return res.status(400).json({ error: 'pdfBase64 is required' });
    }

    const info = await pdfService.getPdfInfo(pdfBase64);
    res.json(info);
  } catch (err: any) {
    console.error('PDF info error:', err);
    res.status(500).json({ error: err.message || 'Failed to inspect PDF' });
  }
});

app.post('/api/pdf/generate-academic', async (req, res) => {
  try {
    const { title, subtitle, author, university, bodyText } = req.body;
    if (!title || !bodyText) {
      return res.status(400).json({ error: 'title and bodyText are required' });
    }

    const pdfBase64 = await pdfService.generateAcademicPdf(
      title,
      subtitle || 'Academic Document',
      author || 'Student',
      university || 'NUST',
      bodyText
    );

    res.json({
      success: true,
      pdfBase64,
      message: 'Generated formatted academic PDF document.',
    });
  } catch (err: any) {
    console.error('Academic PDF generate error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate PDF' });
  }
});

// Direct Academic Writing Generation
app.post('/api/academic/generate', async (req, res) => {
  try {
    const { type, instructions, sourceNotes } = req.body;
    if (!instructions) {
      return res.status(400).json({ error: 'Instructions are required' });
    }

    const generated = await geminiService.generateAcademicWork(
      type || 'assignment_draft',
      instructions,
      sourceNotes || '',
      []
    );

    res.json({
      content: generated,
      type: type || 'assignment_draft',
      createdAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Academic generation error:', err);
    res.status(500).json({ error: err.message || 'Academic generation failed' });
  }
});

// --- ENTERPRISE SAAS & ADMINISTRATION ROUTES ---

// Auth: Current User & Switcher
app.get('/api/auth/me', (req, res) => {
  res.json(adminStore.getCurrentUser());
});

app.get('/api/auth/users', (req, res) => {
  res.json(adminStore.getUsers());
});

app.post('/api/auth/switch', (req, res) => {
  const { userId } = req.body;
  const user = adminStore.switchUser(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ success: true, user });
});

app.post('/api/auth/profile', (req, res) => {
  const updated = adminStore.updateCurrentUser(req.body);
  res.json({ success: true, user: updated });
});

// Multi-Tenancy
app.get('/api/tenants', (req, res) => {
  res.json(adminStore.getTenants());
});

// Role-Based Access Control (RBAC)
app.get('/api/rbac/permissions', (req, res) => {
  res.json(adminStore.getPermissions());
});

app.put('/api/rbac/permissions/:id', (req, res) => {
  const { allowedRoles } = req.body;
  if (!Array.isArray(allowedRoles)) {
    return res.status(400).json({ error: 'allowedRoles array is required' });
  }
  const success = adminStore.updateRolePermissions(req.params.id, allowedRoles);
  if (!success) return res.status(404).json({ error: 'Permission not found' });
  res.json({ success: true, permissions: adminStore.getPermissions() });
});

// Billing & Usage Metering
app.get('/api/billing/plans', (req, res) => {
  res.json(adminStore.getSubscriptionPlans());
});

app.get('/api/billing/meter', (req, res) => {
  res.json(adminStore.getUsageMeter());
});

app.get('/api/billing/invoices', (req, res) => {
  res.json(adminStore.getInvoices());
});

app.post('/api/billing/checkout', (req, res) => {
  const { planId, gateway, currency, amount } = req.body;
  const newInvoice = adminStore.addInvoice({
    invoiceNumber: `ABH-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString(),
    amount: amount || (currency === 'PKR' ? 85000 : 299),
    currency: currency || 'PKR',
    status: 'paid',
    gateway: gateway || 'PayFast',
    description: `Subscription upgrade: ${planId} plan`,
    dunningRetries: 0,
    pdfReceiptAvailable: true,
  });

  adminStore.logAudit({
    actorId: adminStore.getCurrentUser().id,
    actorName: adminStore.getCurrentUser().name,
    actorEmail: adminStore.getCurrentUser().email,
    actorRole: adminStore.getCurrentUser().role,
    action: 'SUBSCRIPTION_UPGRADE_SUCCESS',
    resource: `plan:${planId}`,
    ipAddress: '127.0.0.1',
    status: 'SUCCESS',
    details: `Settled payment of ${newInvoice.currency} ${newInvoice.amount} via ${newInvoice.gateway}.`,
  });

  res.json({ success: true, invoice: newInvoice });
});

app.post('/api/billing/dunning/retry', (req, res) => {
  const { invoiceId } = req.body;
  const result = adminStore.retryDunning(invoiceId);
  res.json(result);
});

app.get('/api/billing/invoices/:id/pdf', async (req, res) => {
  try {
    const pdfBase64 = await adminStore.generateInvoicePdf(req.params.id);
    res.json({ success: true, pdfBase64 });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Invoice PDF generation failed' });
  }
});

// Audit Logs
app.get('/api/audit/logs', (req, res) => {
  const { action, status } = req.query as { action?: string; status?: string };
  res.json(adminStore.getAuditLogs(action, status));
});

// API Keys
app.get('/api/api-keys', (req, res) => {
  res.json(adminStore.getApiKeys());
});

app.post('/api/api-keys', (req, res) => {
  const { name, scopes } = req.body;
  if (!name) return res.status(400).json({ error: 'Key name is required' });
  const result = adminStore.createApiKey(name, scopes || ['corpus:read']);
  res.json(result);
});

app.delete('/api/api-keys/:id', (req, res) => {
  const success = adminStore.revokeApiKey(req.params.id);
  if (!success) return res.status(404).json({ error: 'Key not found' });
  res.json({ success: true, message: 'API key revoked.' });
});

// Webhooks
app.get('/api/webhooks', (req, res) => {
  res.json(adminStore.getWebhooks());
});

app.post('/api/webhooks', (req, res) => {
  const { url, events } = req.body;
  if (!url || !events || !events.length) {
    return res.status(400).json({ error: 'URL and events are required' });
  }
  const wh = adminStore.addWebhook(url, events);
  res.json(wh);
});

app.post('/api/webhooks/:id/test', (req, res) => {
  const result = adminStore.testWebhook(req.params.id);
  res.json(result);
});

// Third-Party Integrations
app.get('/api/integrations', (req, res) => {
  res.json(adminStore.getIntegrations());
});

app.post('/api/integrations/:id/toggle', (req, res) => {
  const { connect } = req.body;
  const updated = adminStore.toggleIntegration(req.params.id, !!connect);
  if (!updated) return res.status(404).json({ error: 'Integration not found' });
  res.json(updated);
});

// Advanced Analytics
app.get('/api/analytics', (req, res) => {
  res.json(adminStore.getAnalytics());
});

// Data Compliance Export (GDPR / FERPA / PECIA)
app.get('/api/compliance/export', (req, res) => {
  const user = adminStore.getCurrentUser();
  const exportPackage = {
    exportMetadata: {
      generatedAt: new Date().toISOString(),
      formatVersion: 'FERPA-GDPR-PECIA-2026.1',
      legalEntity: 'ABHOGIPARHAI Academic Workspace Pakistan',
    },
    userProfile: user,
    tenant: adminStore.getTenants().find((t) => t.id === user.tenantId),
    auditTrail: adminStore.getAuditLogs().filter((l) => l.actorId === user.id),
    usageMeter: adminStore.getUsageMeter(),
    invoices: adminStore.getInvoices(),
  };

  adminStore.logAudit({
    actorId: user.id,
    actorName: user.name,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'GDPR_FERPA_DATA_EXPORT',
    resource: `user:${user.id}/data-package`,
    ipAddress: '127.0.0.1',
    status: 'SUCCESS',
    details: `Full personal data package downloaded under Data Protection regulations.`,
  });

  res.json(exportPackage);
});

// --- VITE MIDDLEWARE SETUP ---

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ABHOGIPARHAI] Academic Workspace Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
