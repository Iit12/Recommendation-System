import { Router } from 'express';
import { liveSearchController } from '../controllers/liveSearch.controller.js';

const router = Router();

// GET /api/v1/live-search/health
router.get('/health', liveSearchController.getHealth);

// GET /api/v1/live-search?q=iphone%2016
router.get('/', liveSearchController.search);

export default router;
