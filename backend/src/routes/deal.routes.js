import { Router } from 'express';
import { dealController } from '../controllers/deal.controller.js';

const router = Router();

// Phase 8.1: GET /api/v1/deals/products/:productId?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/products/:productId', dealController.getProductDeals);

export default router;
