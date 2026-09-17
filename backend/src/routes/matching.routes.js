/**
 * Phase 4 Matching Routes
 * Endpoint: /api/v1/matching/*
 */

import { Router } from 'express';
import { matchingController } from '../controllers/matching.controller.js';

const router = Router();

// GET /api/v1/matching/search?q=<query>&platforms=<optional>
router.get('/search', matchingController.searchAndMatch);

export default router;
