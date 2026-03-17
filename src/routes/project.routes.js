const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const {verifyToken} = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

router.post('/', verifyToken, projectController.createProject);
router.get("/", verifyToken, projectController.getProjects);
router.post(
  "/:projectId/members",
  verifyToken,
  projectController.addMember
);
router.get(
  "/:projectId/available-users",
  verifyToken,
  projectController.getAvailableUsers
);
router.get(
  "/:projectId/members",
  verifyToken,
  projectController.getProjectMembers
);

router.delete(
  "/:projectId/members/:userId",
  verifyToken,
  projectController.removeMember
);

router.post(
  "/:projectId/documents",
  verifyToken,
  upload.single('file'),
  projectController.uploadDocument
)

router.get(
  "/:projectId",
  verifyToken,
  projectController.getProjectDetails
);


module.exports = router;