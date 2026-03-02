const { v4: uuidv4 } = require("uuid");
const projectRepository = require("../repositories/project.repository");
const AppError = require("../utils/AppError");

exports.createProject = async ({title, description}, user) => {
    if(user.role !== 'ADMIN') {
       throw new AppError(403, "Only ADMIN can create projects");
    }

    const projectId = uuidv4();
     await projectRepository.createProject({
    id: projectId,
    title,
    description,
    created_by: user.id
  });

  // Auto-add creator as member
  await projectRepository.addProjectMember({
    id: uuidv4(),
    project_id: projectId,
    user_id: user.id
  });

 return { message: "Project created successfully" };
};

exports.getMyProjects = async (user) => {
  return await projectRepository.getProjectsByUser(user.id);
}