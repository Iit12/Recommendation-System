import { Router } from 'express';
import searchRoutes from './search.routes.js';
import productRoutes from './product.routes.js';
import priceRoutes from './price.routes.js';
import trendRoutes from './trend.routes.js';
import recommendationRoutes from './recommendation.routes.js';
import collectRoutes from './collect.routes.js';
import matchingRoutes from './matching.routes.js';
import historyRoutes from './history.routes.js';
import dealRoutes from './deal.routes.js';
import alternativeRoutes from './alternative.routes.js';
import personalizedRoutes from './personalized.routes.js';

const router = Router();

// Mount API v1 route groups
router.use('/search', searchRoutes);
router.use('/products', productRoutes);
router.use('/prices', priceRoutes);
router.use('/trends', trendRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/collect', collectRoutes);
router.use('/matching', matchingRoutes);
router.use('/history', historyRoutes);
router.use('/deals', dealRoutes);
router.use('/alternatives', alternativeRoutes);
router.use('/personalized', personalizedRoutes);

export default router;

