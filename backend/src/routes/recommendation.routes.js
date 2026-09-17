import { Router } from 'express';
import { recommendationController } from '../controllers/recommendation.controller.js';

const router = Router();

// GET /api/v1/recommendations/:id
router.get('/:id', recommendationController.getRecommendation);

export default router;
