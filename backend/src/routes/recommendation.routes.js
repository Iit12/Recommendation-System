import { Router } from 'express';
import { recommendationController } from '../controllers/recommendation.controller.js';

const router = Router();

// Phase 7.1: GET /api/v1/recommendations/products/:productId?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/products/:productId', recommendationController.getProductRecommendation);

// Phase 2 Backward Compatibility: GET /api/v1/recommendations/:id
router.get('/:id', recommendationController.getRecommendation);

export default router;
