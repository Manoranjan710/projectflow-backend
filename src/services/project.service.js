const { v4: uuidv4 } = require("uuid");
const projectRepository = require("../repositories/project.repository");
const AppError = require("../utils/AppError");

exports.createProject = async ({ title, description }, user) => {
  if (user.role !== "ADMIN") {
    throw new AppError(403, "Only ADMIN can create projects");
  }

  const projectId = uuidv4();
  await projectRepository.createProject({
    id: projectId,
    title,
    description,
    created_by: user.id,
  });

  // Auto-add creator as member
  await projectRepository.addProjectMember({
    id: uuidv4(),
    project_id: projectId,
    user_id: user.id,
  });

  return { message: "Project created successfully" };
};

exports.getMyProjects = async (user) => {
  return await projectRepository.getProjectsByUser(user.id);
};

exports.getProjects = async (queryParams, user) => {
  const { page = 1, limit = 10, status, search } = queryParams;

  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 10;
  const offset = (pageNumber - 1) * limitNumber;

  let projects;
  let totalCount;

  if (user.role === "ADMIN") {

    projects = await projectRepository.getAllProjects({
      status,
      search,
      limit: limitNumber,
      offset
    });

    totalCount = await projectRepository.countAllProjects({
      status,
      search
    });

  } else {

    projects = await projectRepository.getFilteredProjects({
      userId: user.id,
      status,
      search,
      limit: limitNumber,
      offset
    });

    totalCount = await projectRepository.countFilteredProjects({
      userId: user.id,
      status,
      search
    });

  }

  const totalPages = Math.ceil(totalCount / limitNumber);

  return {
    items: projects,
    totalCount,
    totalPages,
    currentPage: pageNumber
  };
};

exports.addMember = async (projectId, userId, user) => {

  if (user.role !== "ADMIN") {
    throw new AppError(403, "Only admin can assign members");
  }

  await projectRepository.addProjectMember({
    id: uuidv4(),
    project_id: projectId,
    user_id: userId
  });

};

exports.getAvailableUsers = async (projectId, user) => {

  if (user.role !== "ADMIN") {
    throw new AppError(403, "Only admin can view available users");
  }

  const users = await projectRepository.getAvailableUsers(projectId);

  return users;
};

exports.getProjectMembers = async (projectId, user) => {
  
  const members = await projectRepository.getProjectMembers(projectId);

  return members;
};

exports.getProjectDetails = async (projectId, user) => {

  const project = await projectRepository.getProjectById(
    projectId,
    user.id,
    user.role
  );

  if (!project) {
    throw new AppError(403, "You are not allowed to access this project");
  }

  const members = await projectRepository.getProjectMembers(projectId);

  return {
    project,
    members
  };
};