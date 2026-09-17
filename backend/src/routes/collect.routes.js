import { Router } from 'express';
import { collectController } from '../controllers/collect.controller.js';

const router = Router();

// GET /api/v1/collect/search?q=iphone&platforms=amazon,flipkart
router.get('/search', collectController.searchListings);

export default router;
