const pool = require('../config/db');

exports.createUser = async(user)=>{
    const {id, name, email, password, role} = user;

    const query = 
    `INSERT INTO users (id, name, email, password, role)
     VALUES (?, ?, ?, ?, ?)`;

     await pool.execute(query, [id, name, email, password, role]);
}

exports.findByEmail = async(email)=> {
    const [rows] = await pool.execute(
        `SELECT * FROM users WHERE email = ? AND deleted_at IS NULL`, [email]
    );
    return rows[0];
}