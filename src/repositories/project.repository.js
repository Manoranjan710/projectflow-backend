const pool = require('../config/db');

exports.createProject = async(project)=>{
    const {id, title, description, created_by} = project;

    const query = `
    INSERT INTO projects (id, title, description, created_by)
    VALUES (?, ?, ?, ?)`;

    await pool.execute(query, [id, title, description, created_by]);
};

exports.addProjectMember = async(member) => {
    const {id, project_id,  user_id} = member;

    const query = `
    INSERT INTO project_members (id, project_id, user_id)
    VALUES (?, ?, ?)`;

    await pool.execute(query, [id, project_id, user_id]);
};

exports.getProjectsByUser = async(userId) => {
    const query =`
    SELECT p.*
    FROM projects p
    JOIN project_members pm ON p.id = pm.project_id
    WHERE pm.user_id = ? AND p.deleted_at IS NULL`;

    const [rows] = await pool.execute(query, [userId]);
    return rows;
};