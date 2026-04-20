const { v4: uuidv4 } = require("uuid");
const projectRepository = require("../repositories/project.repository");
const AppError = require("../utils/AppError");
const { getCache, setCache, deleteCacheByPattern } = require("../utils/cache");

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

  await deleteCacheByPattern("projects:list:*");

  return { message: "Project created successfully" };
};

exports.deleteProject = async (projectId, user) => {
  if (user.role !== "ADMIN") {
    throw new AppError(403, "Only ADMIN can delete projects");
  }

  await projectRepository.deleteProject(projectId);
  await deleteCacheByPattern("projects:list:*");
  return { message: "Project deleted successfully" };
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
    const normalizedStatus = status ? status.toString().trim() : "all";
    const normalizedSearch = search ? search.toString().trim().toLowerCase() : "all";
    const cacheKey = `projects:list:${normalizedStatus}:${encodeURIComponent(normalizedSearch)}:${pageNumber}:${limitNumber}`;

    // 1. Check cache for this exact query/pagination combination
    const cachedProjects = await getCache(cacheKey);
    if (cachedProjects) {
      console.log("✅ Cache hit for project list", cacheKey);
      return cachedProjects;
    }

    console.log("Cache miss for project list, fetching from DB", cacheKey);

    projects = await projectRepository.getAllProjects({
      status,
      search,
      limit: limitNumber,
      offset,
    });

    totalCount = await projectRepository.countAllProjects({
      status,
      search,
    });

    // ✅ Cache the full response shape so it's consistent on cache hit
    const responseToCache = {
      items: projects,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNumber),
      currentPage: pageNumber,
    };

    await setCache(cacheKey, responseToCache, 120);

    return responseToCache;
  } else {
    projects = await projectRepository.getFilteredProjects({
      userId: user.id,
      status,
      search,
      limit: limitNumber,
      offset,
    });

    totalCount = await projectRepository.countFilteredProjects({
      userId: user.id,
      status,
      search,
    });

    const totalPages = Math.ceil(totalCount / limitNumber);

    return {
      items: projects,
      totalCount,
      totalPages,
      currentPage: pageNumber,
    };
  }
};

exports.addMember = async (projectId, userId, user) => {
  if (user.role !== "ADMIN") {
    throw new AppError(403, "Only admin can assign members");
  }

  await projectRepository.addProjectMember({
    id: uuidv4(),
    project_id: projectId,
    user_id: userId,
  });

  // Invalidate related caches
  await deleteCacheByPattern(`projectdetails:${projectId}:*`);
  await deleteCacheByPattern(`availableusers:${projectId}`);
};

exports.getAvailableUsers = async (projectId, user) => {
  if (user.role !== "ADMIN") {
    throw new AppError(403, "Only admin can view available users");
  }

  const cacheKey = `availableusers:${projectId}`;

  // Check cache first
  const cachedUsers = await getCache(cacheKey);
  if (cachedUsers) {
    console.log("✅ Cache hit for available users", cacheKey);
    return cachedUsers;
  }

  console.log("Cache miss for available users, fetching from DB", cacheKey);

  const users = await projectRepository.getAvailableUsers(projectId);

  // Cache the result for 120 seconds
  await setCache(cacheKey, users, 120);

  return users;
};

exports.getProjectMembers = async (projectId, user) => {
  const members = await projectRepository.getProjectMembers(projectId);

  return members;
};

exports.getProjectDetails = async (projectId, user) => {
  const cacheKey = `projectdetails:${projectId}:${user.id}`;

  // Check cache first
  const cachedDetails = await getCache(cacheKey);
  if (cachedDetails) {
    console.log("✅ Cache hit for project details", cacheKey);
    return cachedDetails;
  }

  console.log("Cache miss for project details, fetching from DB", cacheKey);

  const project = await projectRepository.getProjectById(
    projectId,
    user.id,
    user.role,
  );

  if (!project) {
    throw new AppError(403, "You are not allowed to access this project");
  }

  const members = await projectRepository.getProjectMembers(projectId);

  const responseToCache = {
    project,
    members,
  };

  // Cache the result for 120 seconds
  await setCache(cacheKey, responseToCache, 120);

  return responseToCache;
};

exports.removeMember = async (projectId, userId, user) => {
  if (user.role !== "ADMIN") {
    throw new AppError(403, "Only admin can remove members");
  }

  await projectRepository.removeProjectMember(projectId, userId);

  // Invalidate related caches
  await deleteCacheByPattern(`projectdetails:${projectId}:*`);
  await deleteCacheByPattern(`availableusers:${projectId}`);
};

exports.updateProject = async (projectId, payload, user) => {
  if (user.role !== "ADMIN") {
    throw new AppError(403, "Only ADMIN can update projects");
  }

  const { title, name, description, status } = payload || {};

  const updates = {};
  const resolvedTitle = title ?? name;

  if (resolvedTitle !== undefined) updates.title = resolvedTitle;
  if (description !== undefined) updates.description = description;
  if (status !== undefined) updates.status = status;

  if (!Object.keys(updates).length) {
    throw new AppError(
      400,
      "Provide at least one of: title/name, description, status",
    );
  }

  const result = await projectRepository.updateProject(projectId, updates);

  if (!result || result.affectedRows === 0) {
    throw new AppError(404, "Project not found");
  }

  // Invalidate all related caches
  await deleteCacheByPattern("projects:list:*");
  await deleteCacheByPattern(`projectdetails:${projectId}:*`);
  await deleteCacheByPattern(`availableusers:${projectId}`);
  return { message: "Project updated successfully" };
};
