const projectService = require('../services/project.service');

exports.createProject = async(req, res, next) => {
    try{
        const result = await projectService.createProject(req.body, req.user);
        res.status(201).json({
            success:true,
            data: null,
            message: result.message
        });
    } catch(err){
        next(err);
    }
};

exports.getMyProjects = async(req, res, next) => {
    try{
        const projects = await projectService.getProjectsByUser(req.user);
        res.status(200).json({
            success:true,
            data: projects,
            message: "Projects retrieved successfully"
        });
    }catch(err){
        next(err);
    }           
};