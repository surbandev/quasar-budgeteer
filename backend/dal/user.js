const _ = require('lodash');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

async function login(username, password) {
    let user = await db.dbQueryOne("SELECT * FROM users WHERE username = ?", [username]);
    if (!user) {
        return {
            token: undefined,
            error: {
                msg: "User not found"
            }
        }
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
        return {
            token: undefined,
            error: {
                msg: "Invalid Password"
            }
        }
    }

    const token = jwt.sign({ id: user.id, uid: user.uid, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return {
        token,
        userID: user.id,
        error: undefined
    };
}

async function addUser(username, password, firstname,lastname, phone, email, database) {
    let user = await db.dbQueryOne("SELECT * FROM users WHERE username = ? OR email = ?", [username, email]);
    if (!user) {
        // Hash password and create admin user
        const hashedPassword = bcrypt.hashSync(password, 10);
        user = await db.dbExecuteOne("CALL sp_users_add_user(?, ?, ?, ?, ?, ?, ?)", [username, hashedPassword, firstname,lastname, phone, email, database]);
        return user;
    } else {
        return {
            error: "Username or email already exists"
        }
    }
}

async function getUser(userID) {
    let user = await db.dbQueryOne("SELECT * FROM users WHERE id = ?", [userID]);
    if (user) {
        return { user };
    } else {
        return {
            error: "User does not exist"
        }
    }
}

async function updateUser(userID, username, password, email) {
    let user = await db.dbQueryOne("SELECT * FROM users WHERE id = ?", [userID]);
    if (!user) {
        return {
            error: "User does not exist"
        }
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    try {
        user = await db.dbExecute("CALL sp_users_update_user(?,?,?,?)", [userID, username, hashedPassword, email]);
    } catch (e) {
        console.error('Error updating user:', e);
        return {
            error: "Error updating user"
        }
    }
    return { user };
}

async function getAllUsers() {
    let users = await db.dbQuery("SELECT id, username, email FROM users ORDER BY username", []);
    return users;
}


module.exports = {
    login,
    addUser,
    getUser,
    updateUser,
    getAllUsers
}