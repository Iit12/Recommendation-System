import { Router } from 'express';
import { trendController } from '../controllers/trend.controller.js';

const router = Router();

// Phase 6: GET /api/v1/trends/products/:productId/platforms
router.get('/products/:productId/platforms', trendController.getPlatformTrendAnalysis);

// Phase 6: GET /api/v1/trends/products/:productId
router.get('/products/:productId', trendController.getProductTrendAnalysis);

// Phase 2: GET /api/v1/trends
router.get('/', trendController.getAllTrends);

// Phase 2: GET /api/v1/trends/:id
router.get('/:id', trendController.getProductTrends);

export default router;
