const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const {verifyToken} = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

const debugUploadRequest = (req, res, next) => {
  if (process.env.DEBUG_PDF_UPLOAD !== "true") return next();

  console.log("[documents] headers:", {
    "content-type": req.headers["content-type"],
    "content-length": req.headers["content-length"],
  });

  next();
};

router.post('/', verifyToken, projectController.createProject);
router.delete('/:projectId', verifyToken, projectController.deleteProject);
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
  debugUploadRequest,
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "pdf", maxCount: 1 },
    { name: "document", maxCount: 1 },
  ]),
  projectController.uploadDocument
)

router.post(
  "/:projectId/ask",
  verifyToken,
  projectController.askProjectQuestion
);

router.get(
  "/:projectId",
  verifyToken,
  projectController.getProjectDetails
);


module.exports = router;
