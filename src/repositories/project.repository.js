const pool = require('../config/db');

exports.createProject = async(project)=>{
    const {id, title, description, created_by} = project;

    const query = `
    INSERT INTO projects (id, title, description, created_by)
    VALUES (?, ?, ?, ?)`;

    await pool.execute(query, [id, title, description, created_by]);
};

exports.updateProject = async(projectId, updates) => {
    const allowedFields = new Set(["title", "description", "status"]);

    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates || {})) {
        if (!allowedFields.has(key)) continue;
        fields.push(`${key} = ?`);
        values.push(value);
    }

    if (!fields.length) {
        return { affectedRows: 0 };
    }

    values.push(projectId);

    const query = `
    UPDATE projects
    SET ${fields.join(", ")}
    WHERE id = ? AND deleted_at IS NULL`;

    const [result] = await pool.execute(query, values);
    return result;
};  

exports.deleteProject = async(projectId) => {
    const query = `
    UPDATE projects
    SET deleted_at = NOW()
    WHERE id = ? AND deleted_at IS NULL`;

    await pool.execute(query, [projectId]);
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
    SELECT p.id, p.title, p.description, p.status, p.created_at, p.deleted_at, u.name as created_by
    FROM projects p
    JOIN project_members pm ON p.id = pm.project_id
    JOIN users u ON p.created_by = u.id
    WHERE pm.user_id = ? AND p.deleted_at IS NULL`;

    const [rows] = await pool.execute(query, [userId]);
    return rows;
};

exports.getAllProjects = async ({ status, search, limit = 10, offset = 0 }) => {

  let query = `
    SELECT p.id, p.title, p.description, p.status, p.created_at, p.deleted_at, u.name as created_by
    FROM projects p
    JOIN users u ON p.created_by = u.id
    WHERE p.deleted_at IS NULL
  `;

  const values = [];

  if (status) {
    query += " AND p.status = ?";
    values.push(status);
  }

  if (search) {
    query += " AND p.title LIKE ?";
    values.push(`%${search}%`);
  }

  query += ` ORDER BY p.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

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

exports.getFilteredProjects = async ({ userId, status, search, limit = 10, offset = 0 }) => {

  let query = `
    SELECT p.id, p.title, p.description, p.status, p.created_at, p.deleted_at, u.name as created_by
    FROM projects p
    JOIN project_members pm ON p.id = pm.project_id
    JOIN users u ON p.created_by = u.id
    WHERE pm.user_id = ? AND p.deleted_at IS NULL
  `;

  const values = [userId];

  if (status) {
    query += " AND p.status = ?";
    values.push(status);
  }

  if (search) {
    query += " AND p.title LIKE ?";
    values.push(`%${search}%`);
  }

  query += ` ORDER BY p.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

  const [rows] = await pool.execute(query, values);

  return rows;
};

exports.countFilteredProjects = async ({ userId, status, search }) => {

  let query = `
    SELECT COUNT(*) as total
    FROM projects p
    JOIN project_members pm ON p.id = pm.project_id
    WHERE pm.user_id = ? AND p.deleted_at IS NULL
  `;

  const values = [userId];

  if (status) {
    query += " AND p.status = ?";
    values.push(status);
  }

  if (search) {
    query += " AND p.title LIKE ?";
    values.push(`%${search}%`);
  }

  const [rows] = await pool.execute(query, values);

  return rows[0].total;
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

exports.getProjectById = async (projectId, userId, role) => {

  let query;
  let values;

  if (role === "ADMIN") {

    query = `
      SELECT *
      FROM projects
      WHERE id = ? AND deleted_at IS NULL
    `;

    values = [projectId];

  } else {

    query = `
      SELECT p.*
      FROM projects p
      JOIN project_members pm
        ON p.id = pm.project_id
      WHERE p.id = ?
      AND pm.user_id = ?
      AND p.deleted_at IS NULL
    `;

    values = [projectId, userId];

  }

  const [rows] = await pool.execute(query, values);

  return rows[0];
};

exports.getProjectMembers = async (projectId) => {

  const query = `
    SELECT u.id, u.name, u.email
    FROM users u
    JOIN project_members pm
      ON u.id = pm.user_id
    WHERE pm.project_id = ?
  `;

  const [rows] = await pool.execute(query, [projectId]);

  return rows;
};

exports.removeProjectMember = async (projectId, userId) => {

  const query = `
    DELETE FROM project_members
    WHERE project_id = ? AND user_id = ?
  `;

  await pool.execute(query, [projectId, userId]);
};
