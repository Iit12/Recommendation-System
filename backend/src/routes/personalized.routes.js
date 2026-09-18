import { Router } from 'express';
import { personalizedController } from '../controllers/personalized.controller.js';

const router = Router();

// Phase 8.3: POST /api/v1/personalized/recommendations
router.post('/recommendations', personalizedController.getPersonalizedRecommendations);

export default router;
