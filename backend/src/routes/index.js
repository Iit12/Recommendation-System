import { Router } from 'express';
import searchRoutes from './search.routes.js';
import productRoutes from './product.routes.js';
import priceRoutes from './price.routes.js';
import trendRoutes from './trend.routes.js';
import recommendationRoutes from './recommendation.routes.js';

const router = Router();

// Mount API v1 route groups
router.use('/search', searchRoutes);
router.use('/products', productRoutes);
router.use('/prices', priceRoutes);
router.use('/trends', trendRoutes);
router.use('/recommendations', recommendationRoutes);

export default router;
