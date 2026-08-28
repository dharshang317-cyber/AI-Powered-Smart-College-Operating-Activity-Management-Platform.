import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { processAIChat } from '../services/ai.service';

const router = Router();

router.use(authMiddleware);

// POST /api/ai/chat - Universal CampusNexus AI chat endpoint
router.post('/chat', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { message, history, actionContext } = req.body;

    if (!message || !message.trim()) {
      res.status(400).json({ error: 'Message cannot be empty' });
      return;
    }

    const aiResponse = await processAIChat(user, message.trim(), history || [], actionContext);
    res.json(aiResponse);
  } catch (err: any) {
    console.error('AI chat endpoint error:', err);
    res.status(500).json({ error: err.message || 'Error processing AI query' });
  }
});

// POST /api/ai/generate-quiz - Dedicated Faculty Quiz Generator
router.post('/generate-quiz', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    if (user.role !== 'FACULTY' && user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Only faculty can generate assessments via AI' });
      return;
    }

    const { topic, subjectName } = req.body;
    const prompt = `Generate 10 MCQs with answer keys and explanations for topic: ${topic || subjectName || 'Computer Science'}`;

    const aiResponse = await processAIChat(user, prompt, [], { type: 'GENERATE_QUIZ', payload: { topic, subjectName } });
    res.json(aiResponse);
  } catch (err: any) {
    console.error('Quiz generation error:', err);
    res.status(500).json({ error: err.message || 'Error generating quiz' });
  }
});

// GET /api/ai/suggestions - Context-aware prompt suggestion chips
router.get('/suggestions', (req: AuthenticatedRequest, res: Response) => {
  const role = req.user!.role;

  let suggestions: string[] = [];
  if (role === 'STUDENT') {
    suggestions = [
      'What are my classes today?',
      'Check my subject-wise attendance percentage',
      'Explain how Quantum Computing works',
      'Write a Python script for Binary Search',
      'Are there any pending online assessments?',
      'Tips for cracking campus placement interviews',
      'Explain React Virtual DOM vs Real DOM',
    ];
  } else if (role === 'FACULTY') {
    suggestions = [
      'Generate 10 MCQs on Database Normalization',
      'Summarize attendance trends for my classes',
      'Explain Shor’s Quantum Algorithm simply',
      'Draft an internal assessment schedule announcement',
      'Generate 5 project ideas for Cloud Computing',
    ];
  } else if (role === 'CARE_CLUB') {
    suggestions = [
      'Evidence-based strategies for student exam anxiety',
      'Framework for 1-on-1 confidential student career guidance',
      'How to structure empathetic listening responses',
      'Tips for stress management workshops on campus',
      'Explain cognitive behavioral techniques for students',
    ];
  } else if (role === 'ADMIN') {
    suggestions = [
      'Summarize this week’s campus activities & registrations',
      'Show department-wise enrollment and faculty counts',
      'Are there any students with critical attendance <70%?',
      'List pending faculty and Care Club approval requests',
      'Executive summary of campus-wide assessment scores',
    ];
  }

  res.json({ suggestions });
});

export default router;
