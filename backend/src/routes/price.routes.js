import { Router } from 'express';
import { priceController } from '../controllers/price.controller.js';

const router = Router();

// GET /api/v1/prices/:id
router.get('/:id', priceController.getProductPrices);

export default router;
