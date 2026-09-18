import { Router } from 'express';
import { alternativeController } from '../controllers/alternative.controller.js';

const router = Router();

// Phase 8.2: GET /api/v1/alternatives/products/:productId?limit=N
router.get('/products/:productId', alternativeController.getAlternativeProducts);

export default router;
