// Defines project-related API endpoints.
// Module: routes.
import express from 'express';
import { protect } from '../middlewares/auth.js';
import { deleteProject, getProjectById, getProjectPreview, getPublishedProjects, makeRevision, rollbackToVersion, saveProjectCode } from '../controllers/projectController.js';

const projectRouter = express.Router();

// POST /revision/:projectId: create a new AI-generated revision.
projectRouter.post('/revision/:projectId', protect, makeRevision);
// PUT /save/:projectId: save custom code for a project.
projectRouter.put('/save/:projectId', protect, saveProjectCode);
// GET /rollback/:projectId/:versionId: restore a previous version.
projectRouter.get('/rollback/:projectId/:versionId', protect, rollbackToVersion);
// DELETE /:projectId: remove a project owned by the user.
projectRouter.delete('/:projectId', protect, deleteProject);
// GET /preview/:projectId: fetch full project data for preview.
projectRouter.get('/preview/:projectId', protect, getProjectPreview);
// GET /published: list all published projects.
projectRouter.get('/published', getPublishedProjects);
// GET /published/:projectId: fetch public code for a project.
projectRouter.get('/published/:projectId', getProjectById);

export default projectRouter;
