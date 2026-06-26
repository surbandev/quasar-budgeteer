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
    try {
        const existing = await db.dbQueryOneSession(
            `SELECT id FROM users
             WHERE username COLLATE utf8mb4_general_ci = ?
                OR email COLLATE utf8mb4_general_ci = ?
             LIMIT 1`,
            [username, email],
        );
        if (existing) {
            return { error: "Username or email already exists" };
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
        return await addUserDirect(username, hashedPassword, firstname, lastname, phone, email);
    } catch (e) {
        console.error('Error in addUser:', e);
        return { error: e.sqlMessage || e.message || 'Failed to create user' };
    }
}

async function addUserDirect(username, hashedPassword, firstname, lastname, phone, email) {
    const id = uuidv4();
    const uid = uuidv4();

    await db.dbExecuteSession(
        `INSERT INTO users (id, uid, username, password, firstname, lastname, phone, email, \`db\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, uid, username, hashedPassword, firstname, lastname, phone || '', email, ''],
    );

    return { id, username, email };
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

async function updateUser(userID, username, email, password) {
    let user = await db.dbQueryOne("SELECT * FROM users WHERE id = ?", [userID]);
    if (!user) {
        return {
            error: "User does not exist"
        }
    }

    try {
        if (password) {
            const hashedPassword = bcrypt.hashSync(password, 10);
            await db.dbExecute("CALL sp_users_update_user(?,?,?,?)", [userID, username, hashedPassword, email]);
        } else {
            await db.dbExecute("UPDATE users SET username = ?, email = ? WHERE id = ?", [username, email, userID]);
        }
    } catch (e) {
        console.error('Error updating user:', e);
        return {
            error: "Error updating user"
        }
    }
    return { user };
}

async function getUserByUsername(username) {
    return db.dbQueryOne("SELECT id, username, email FROM users WHERE username = ?", [username]);
}

async function deleteUser(userID) {
    const user = await db.dbQueryOne("SELECT id FROM users WHERE id = ?", [userID]);
    if (!user) {
        return { error: "User does not exist" };
    }

    try {
        await db.dbExecute("DELETE FROM users WHERE id = ?", [userID]);
        return { success: true };
    } catch (e) {
        console.error('Error deleting user:', e);
        return { error: "Unable to delete user. They may still have linked data." };
    }
}

async function getAllUsers() {
    let users = await db.dbQuery(
        "SELECT id, username, email, firstname, lastname, phone FROM users ORDER BY username",
        [],
    );
    return users;
}


module.exports = {
    login,
    addUser,
    getUser,
    updateUser,
    getAllUsers,
    getUserByUsername,
    deleteUser
}