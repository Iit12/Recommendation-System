import { Router } from 'express';
import { alertController } from '../controllers/alert.controller.js';

const router = Router();

/**
 * Phase 8.4 Alert & Watchlist Routes
 * POST /api/v1/alerts/evaluate
 */
router.post('/evaluate', alertController.evaluateAlerts);

export default router;
