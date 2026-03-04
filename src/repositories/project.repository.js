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

exports.getAllProjects = async ({ status, search, limit = 10, offset = 0 }) => {

  let query = `
    SELECT *
    FROM projects
    WHERE deleted_at IS NULL
  `;

  const values = [];

  if (status) {
    query += " AND status = ?";
    values.push(status);
  }

  if (search) {
    query += " AND title LIKE ?";
    values.push(`%${search}%`);
  }

  query += ` ORDER BY created_at DESC LIMIT ${offset}, ${limit}`;

  const [rows] = await pool.execute(query, values);

  return rows;
};


exports.countAllProjects = async ({ status, search }) => {

  let query = `
    SELECT COUNT(*) as total
    FROM projects
    WHERE deleted_at IS NULL
  `;

  const values = [];

  if (status) {
    query += " AND status = ?";
    values.push(status);
  }

  if (search) {
    query += " AND title LIKE ?";
    values.push(`%${search}%`);
  }

  const [rows] = await pool.execute(query, values);

  return rows[0].total;
};

exports.getAvailableUsers = async (projectId) => {

  const query = `
    SELECT u.id, u.name, u.email
    FROM users u
    WHERE u.deleted_at IS NULL
    AND u.id NOT IN (
      SELECT user_id
      FROM project_members
      WHERE project_id = ?
    )
  `;

  const [rows] = await pool.execute(query, [projectId]);

  return rows;
};

exports.getProjectMembers = async (projectId) => {
    const query = `
    SELECT u.id, u.name, u.email
    FROM users u
    JOIN project_members pm ON u.id = pm.user_id
    WHERE pm.project_id = ? AND u.deleted_at IS NULL`;

    const [rows] = await pool.execute(query, [projectId]);
    return rows;
}
