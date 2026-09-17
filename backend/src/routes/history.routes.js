/**
 * Phase 5 History Routes
 * Endpoint: /api/v1/history/*
 */

import { Router } from 'express';
import { historyController } from '../controllers/history.controller.js';

const router = Router();

// POST /api/v1/history/collect - Run collection + matching + persistence
router.post('/collect', historyController.collectAndPersist);

// GET /api/v1/history/products/:productId - Retrieve historical observations
router.get('/products/:productId', historyController.getProductHistory);

// GET /api/v1/history/products/:productId/latest - Retrieve latest prices per platform
router.get('/products/:productId/latest', historyController.getLatestProductPrices);

// GET /api/v1/history/products/:productId/summary - Retrieve historical summary stats
router.get('/products/:productId/summary', historyController.getProductHistorySummary);

export default router;
