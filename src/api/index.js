import express from 'express';
import webhookRoutes from './webhook.js';
import promptRoutes from './prompt.js';
import postsRoutes from './posts.js';
import notificationRoutes from './notification.js';
import subscriptionRoutes from './subscription.js';

const router = express.Router();

// Register all API routes
router.use('/webhook', webhookRoutes);
router.use('/prompt', promptRoutes);
router.use('/posts', postsRoutes);
router.use('/notification', notificationRoutes);
router.use('/subscription', subscriptionRoutes);

export default router;