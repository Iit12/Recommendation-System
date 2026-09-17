import { Router } from 'express';
import { trendController } from '../controllers/trend.controller.js';

const router = Router();

// GET /api/v1/trends
router.get('/', trendController.getAllTrends);

// GET /api/v1/trends/:id
router.get('/:id', trendController.getProductTrends);

export default router;
