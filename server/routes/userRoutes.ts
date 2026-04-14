// Defines user-related API endpoints.
// Module: routes.
import express from 'express';
import { protect } from '../middlewares/auth.js';
import { createUserProject, getUserCredits, getUserProject, getUserProjects, purchaseCredits, togglePublish } from '../controllers/userController.js';

const userRouter = express.Router();

// GET /credits: return current user credit balance.
userRouter.get('/credits', protect, getUserCredits);
// POST /project: create a new website project.
userRouter.post('/project', protect, createUserProject);
// GET /projects/:projectId: fetch a single project with history.
userRouter.get('/projects/:projectId', protect, getUserProject);
// GET /projects: list all projects for the user.
userRouter.get('/projects', protect, getUserProjects);
// GET /publish-toggle/:projectId: toggle published state.
userRouter.get('/publish-toggle/:projectId', protect, togglePublish);
// POST /purchase-credits: start Stripe checkout for credits.
userRouter.post('/purchase-credits', protect, purchaseCredits)

export default userRouter;
