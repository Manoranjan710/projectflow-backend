const projectService = require("../services/project.service");
const AppError = require("../utils/AppError");
const { PDFParse } = require("pdf-parse");

exports.uploadDocument = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    if (!req.file) {
      throw new AppError(400, "File is required");
    }

    const parser = new PDFParse({ data: req.file.buffer });
    let text = "";
    try {
      const result = await parser.getText();
      text = result?.text || "";
    } finally {
      await parser.destroy();
    }

    res.status(200).json({
      success: true,
      message: "Document uploaded successfully",
      data: {
        projectId,
        textLength: text.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.createProject = async (req, res, next) => {
  try {
    const result = await projectService.createProject(req.body, req.user);
    res.status(201).json({
      success: true,
      data: null,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};

exports.getProjects = async (req, res, next) => {
  try {
    const result = await projectService.getProjects(req.query, req.user);

    res.status(200).json({
      success: true,
      data: result,
      message: "Projects fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.addMember = async (req, res, next) => {
  try {
    const result = await projectService.addMember(
      req.params.projectId,
      req.body.userId,
      req.user,
    );

    res.status(200).json({
      success: true,
      message: "User added to project",
    });
  } catch (error) {
    next(error);
  }
};

exports.getAvailableUsers = async (req, res, next) => {
  try {
    const users = await projectService.getAvailableUsers(
      req.params.projectId,
      req.user,
    );

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

exports.getProjectMembers = async (req, res, next) => {
  try {
    const members = await projectService.getProjectMembers(
      req.params.projectId,
      req.user,
    );

    res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

exports.getProjectDetails = async (req, res, next) => {
  try {
    const result = await projectService.getProjectDetails(
      req.params.projectId,
      req.user,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.removeMember = async (req, res, next) => {
  try {
    await projectService.removeMember(
      req.params.projectId,
      req.params.userId,
      req.user,
    );

    res.status(200).json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    next(error);
  }
};
