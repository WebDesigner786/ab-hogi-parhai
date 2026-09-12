import { CourseDocument, DocumentChunk, Course } from '../src/types.js';

class RagStore {
  private courses: Map<string, Course> = new Map();
  private documents: Map<string, CourseDocument> = new Map();
  private chunks: Map<string, DocumentChunk> = new Map();

  constructor() {
    this.seedInitialCourses();
  }

  private seedInitialCourses() {
    const defaultCourses: Course[] = [
      {
        id: 'cs212',
        code: 'CS-212',
        title: 'Data Structures & Algorithms (NUST SEECS)',
        instructor: 'Dr. Muhammad Imran',
        documentsCount: 2,
      },
      {
        id: 'ee221',
        code: 'EE-221',
        title: 'Digital Logic Design',
        instructor: 'Engr. Ayesha Malik',
        documentsCount: 1,
      },
      {
        id: 'se311',
        code: 'SE-311',
        title: 'Software Engineering Requirements & Architecture',
        instructor: 'Dr. Usman Qamar',
        documentsCount: 1,
      },
    ];

    for (const c of defaultCourses) {
      this.courses.set(c.id, c);
    }

    // Seed realistic sample academic documents for instant out-of-the-box verification
    const doc1Id = 'doc-cs212-lec4';
    const doc1Text = `Course: CS-212 Data Structures & Algorithms
Lecture 04: Asymptotic Analysis and Red-Black Trees
Instructor: Dr. Muhammad Imran, NUST SEECS

Page 1: Introduction to Self-Balancing Binary Search Trees
Standard Binary Search Trees (BST) have worst-case lookup time O(n) when keys are inserted in sorted order, degenerating into a linked list. To guarantee logarithmic upper bound O(log n) for search, insert, and delete operations, balanced search trees enforce structural invariants.

Page 2: Red-Black Tree Properties
A Red-Black Tree is a binary search tree with one extra bit of storage per node (its color: RED or BLACK).
The five critical properties:
1. Every node is either red or black.
2. The root is black.
3. Every leaf (NIL sentinel) is black.
4. If a node is red, then both its children are black (no two consecutive red nodes on any path).
5. For each node, all simple paths from the node to descendant leaves contain the same number of black nodes (black-height bh(x)).

Page 3: Height Invariant and Mathematical Proof
Lemma: A Red-Black tree with n internal nodes has height at most 2 * log2(n + 1).
Proof sketch: We show by induction that any subtree rooted at node x contains at least 2^(bh(x)) - 1 internal nodes.
Since at least half the nodes on any path from root to leaf must be black (by Property 4), bh(root) >= h/2.
Therefore, n >= 2^(h/2) - 1, which yields h <= 2 * log2(n + 1).
Hence, Search, Minimum, Maximum, Predecessor, and Successor run in O(log n) worst-case time.

Page 4: Tree Rotations
Insertion and deletion may violate properties 2 or 4. Restoring balance relies on O(1) pointer manipulations called rotations:
- Left-Rotate(T, x): pivots node x down and to the left, making x.right the new root of the subtree.
- Right-Rotate(T, y): pivots node y down and to the right.
Rotations preserve the BST key ordering invariant: for any node, left descendants < node.key < right descendants.`;

    const doc2Id = 'doc-cs212-lab3';
    const doc2Text = `NUST School of Electrical Engineering and Computer Science (SEECS)
Department of Computer Software Engineering
CS-212: Lab Task 03 — Red-Black Tree Implementation & Benchmarking

Instructions:
1. Objective: Implement a generic Red-Black Tree in C++ or Python with insert, search, and in-order traversal.
2. Deliverable Requirements:
   - Source code file (rb_tree.cpp / rb_tree.py)
   - Lab Report in PDF format including:
     a) Algorithm description with rotational diagrams
     b) Time complexity comparison against standard un-balanced BST for 100, 10,000, and 1,000,000 random vs sequential integers
     c) Verification screenshot of tree height matching 2 * floor(log2(n+1))
3. Submission Deadline: Friday 23:59 via NUST LMS. Late submissions penalised 10% per day.`;

    this.addDocumentDirectly({
      id: doc1Id,
      courseId: 'cs212',
      courseName: 'CS-212 Data Structures & Algorithms',
      fileName: 'Lecture 04 - Red-Black Trees.pdf',
      fileSize: 412000,
      mimeType: 'application/pdf',
      uploadedAt: new Date().toISOString(),
      pageCount: 4,
      extractedText: doc1Text,
      blocks: [
        { id: 'b1', type: 'heading', content: 'Lecture 04: Asymptotic Analysis and Red-Black Trees', page: 1 },
        { id: 'b2', type: 'text', content: 'Standard BST degenerates to O(n) under sorted insertion. Balanced trees guarantee O(log n).', page: 1 },
        { id: 'b3', type: 'heading', content: 'Red-Black Tree Properties', page: 2 },
        { id: 'b4', type: 'text', content: 'Properties: 1. Node is red or black. 2. Root is black. 3. Leaves are black. 4. Red nodes have black children. 5. Equal black-height.', page: 2 },
        { id: 'b5', type: 'equation', content: 'Height Invariant Lemma', latex: 'h \\le 2 \\log_2(n + 1)', page: 3, confidence: 0.98 },
        { id: 'b6', type: 'text', content: 'Tree Rotations: Left-Rotate and Right-Rotate preserve BST ordering in O(1) time.', page: 4 }
      ],
      chunks: [],
      status: 'ready',
      containsMath: true,
    });

    this.addDocumentDirectly({
      id: doc2Id,
      courseId: 'cs212',
      courseName: 'CS-212 Data Structures & Algorithms',
      fileName: 'Lab 03 - Red-Black Tree Guidelines.pdf',
      fileSize: 185000,
      mimeType: 'application/pdf',
      uploadedAt: new Date().toISOString(),
      pageCount: 1,
      extractedText: doc2Text,
      blocks: [
        { id: 'b21', type: 'heading', content: 'CS-212: Lab Task 03 Instructions', page: 1 },
        { id: 'b22', type: 'text', content: 'Implement generic RB Tree, generate lab report comparing time complexities, submit via NUST LMS.', page: 1 }
      ],
      chunks: [],
      status: 'ready'
    });
  }

  public getCourses(): Course[] {
    return Array.from(this.courses.values());
  }

  public getCourse(id: string): Course | undefined {
    return this.courses.get(id);
  }

  public addCourse(course: Course): void {
    this.courses.set(course.id, course);
  }

  public getDocuments(courseId?: string): CourseDocument[] {
    const all = Array.from(this.documents.values());
    if (courseId) {
      return all.filter((d) => d.courseId === courseId);
    }
    return all;
  }

  public getDocument(id: string): CourseDocument | undefined {
    return this.documents.get(id);
  }

  public deleteDocument(id: string): boolean {
    const doc = this.documents.get(id);
    if (!doc) return false;

    // Remove associated chunks
    for (const chunk of doc.chunks) {
      this.chunks.delete(chunk.id);
    }
    this.documents.delete(id);

    // Update course document count
    const course = this.courses.get(doc.courseId);
    if (course) {
      course.documentsCount = Math.max(0, course.documentsCount - 1);
    }
    return true;
  }

  public addDocumentDirectly(doc: CourseDocument): void {
    // Generate chunks if not present
    if (!doc.chunks || doc.chunks.length === 0) {
      doc.chunks = this.createChunksFromText(doc.id, doc.fileName, doc.courseId, doc.extractedText);
    }
    this.documents.set(doc.id, doc);
    for (const chunk of doc.chunks) {
      this.chunks.set(chunk.id, chunk);
    }
  }

  public createChunksFromText(
    docId: string,
    docName: string,
    courseId: string,
    text: string
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const pages = text.split(/(?=Page \d+:)/i);

    let pageIndex = 1;
    for (const pageContent of pages) {
      const trimmed = pageContent.trim();
      if (!trimmed) continue;

      // Extract page number if present
      const match = trimmed.match(/Page (\d+):/i);
      const pageNum = match ? parseInt(match[1], 10) : pageIndex;

      // Split page into ~500 character chunks if very long, or keep as coherent section
      const paragraphs = trimmed.split('\n\n').filter((p) => p.trim().length > 0);

      if (paragraphs.length <= 3) {
        chunks.push({
          id: `${docId}-p${pageNum}-c1`,
          documentId: docId,
          documentName: docName,
          courseId,
          pageNumber: pageNum,
          sectionTitle: paragraphs[0]?.slice(0, 60) || `Page ${pageNum}`,
          content: trimmed,
        });
      } else {
        // Group paragraphs into coherent sections
        let currentChunkText = '';
        let chunkSubIndex = 1;
        for (const p of paragraphs) {
          if (currentChunkText.length + p.length > 750) {
            chunks.push({
              id: `${docId}-p${pageNum}-c${chunkSubIndex++}`,
              documentId: docId,
              documentName: docName,
              courseId,
              pageNumber: pageNum,
              sectionTitle: currentChunkText.slice(0, 60),
              content: currentChunkText.trim(),
            });
            currentChunkText = p + '\n\n';
          } else {
            currentChunkText += p + '\n\n';
          }
        }
        if (currentChunkText.trim()) {
          chunks.push({
            id: `${docId}-p${pageNum}-c${chunkSubIndex}`,
            documentId: docId,
            documentName: docName,
            courseId,
            pageNumber: pageNum,
            sectionTitle: currentChunkText.slice(0, 60),
            content: currentChunkText.trim(),
          });
        }
      }
      pageIndex++;
    }

    return chunks;
  }

  /**
   * Search chunks using lexical + keyword relevance scoring
   */
  public searchCorpus(
    query: string,
    courseId?: string,
    limit: number = 5
  ): { chunk: DocumentChunk; score: number }[] {
    const searchTerms = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    if (searchTerms.length === 0) {
      return [];
    }

    const results: { chunk: DocumentChunk; score: number }[] = [];

    for (const chunk of this.chunks.values()) {
      if (courseId && chunk.courseId !== courseId) {
        continue;
      }

      const contentLower = chunk.content.toLowerCase();
      let termMatches = 0;
      let exactPhraseBonus = 0;

      if (contentLower.includes(query.toLowerCase().trim())) {
        exactPhraseBonus += 10;
      }

      for (const term of searchTerms) {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        const matches = (contentLower.match(regex) || []).length;
        if (matches > 0) {
          termMatches += Math.min(matches, 5);
        }
      }

      const score = termMatches * 2 + exactPhraseBonus;
      if (score > 0) {
        results.push({ chunk, score });
      }
    }

    // Sort descending by relevance score
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }
}

export const ragStore = new RagStore();
