import { Router } from 'express';
import { productController } from '../controllers/product.controller.js';
import { priceController } from '../controllers/price.controller.js';
import { trendController } from '../controllers/trend.controller.js';
import { recommendationController } from '../controllers/recommendation.controller.js';

const router = Router();

// Metadata routes
router.get('/meta/categories', productController.getCategories);
router.get('/meta/popular-searches', productController.getPopularSearches);

// Main product routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Sub-resource routes for products
router.get('/:id/prices', priceController.getProductPrices);
router.get('/:id/trends', trendController.getProductTrends);
router.get('/:id/recommendation', recommendationController.getRecommendation);

export default router;
