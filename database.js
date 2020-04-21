var spicedPg = require("spiced-pg");

var dbUrl = process.env.DATABASE_URL || 'postgres:lars:lars@localhost:5432/lars';
var db = spicedPg(dbUrl);

const showSigners = () => {
    return db.query(`SELECT users.firstname, users.lastname, user_profile.age, user_profile.city, user_profile.homepage FROM users 
                        JOIN user_profile  ON ( users.id = user_profile.user_id ) JOIN signatures ON ( users.id = signatures.user_id );`);
}

const addSignatures = (user_id, signaturecode) => {
    return db.query('INSERT INTO signatures (user_id, signaturecode) VALUES ($1, $2) RETURNING id;',
    [user_id ,signaturecode]);
}

const countSigners = () => {
    return db.query('Select COUNT(id) FROM signatures;');
}

const getSignature = id => {
    return db.query('SELECT signaturecode FROM signatures WHERE user_id = $1;',
    [id]
    );
}

const hasSignature = id => {
    return db.query(`SELECT user_id, CASE WHEN user_id IS NOT NULL THEN 'True' ELSE 'False' END
                        FROM signatures WHERE user_id = $1;`,
                        [id]);
}

const addUser = (firstname, lastname, email, password_hash) => {
    return db.query('INSERT INTO users (firstname, lastname, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id,firstname;',
    [firstname, lastname, email, password_hash]
    );
}

const getUser = email => {
    return db.query('SELECT id, firstname, password_hash FROM users WHERE email = $1;',
    [email]
    );
} 

const addUserProfile = (user_id ,age , city ,homepage) => {
    return db.query('INSERT INTO user_profile (user_id ,age , city ,homepage) VALUES ($1, $2, $3, $4)',
    [user_id ,age , city ,homepage]
    );
}

const citySigners = city => {
    return db.query(`SELECT users.firstname, users.lastname, user_profile.age, user_profile.homepage FROM users
                        JOIN user_profile ON ( users.id = user_profile.user_id )  
                            JOIN signatures ON ( users.id = signatures.user_id ) 
                                WHERE user_profile.city = $1 ;`,
    [city]
    );
}

const getUserData = id => {
    return db.query(`SELECT users.firstname, users.lastname, users.email, user_profile.age, user_profile.city,
                    user_profile.homepage FROM users JOIN user_profile ON users.id = user_profile.user_id WHERE users.id = $1;`,
        [id]
        );
}

const deleteSignature = id => {
    return db.query('DELETE FROM signatures where user_id = $1',
    [id]
    );
}

const updateUserData = (firstname,lastname,email,id) => {
    return db.query(`UPDATE users SET firstname = $1,
                                        lastname = $2,
                                        email = $3
                                        WHERE id = $4`,
    [firstname,lastname,email,id]
    );
}

const upsertUserProfile = (id, age, city, homepage) => {
    return db.query(`INSERT INTO user_profile (user_id, age, city, homepage)
                            VALUES ($1,$2,$3,$4)
                                ON CONFLICT (user_id) 
                                    DO UPDATE 
                                        SET age = $2,
                                            city = $3,
                                            homepage = $4;`,
    [id, age, city, homepage]
    );
}

const updatePassword = (password, id) => {
    return db.query('UPDATE users SET password_hash = $1 WHERE id = $2',
    [password, id]
    );
}

const deleteAccount = id => {
    return Promise.all([
        db.query(`DELETE FROM user_profile WHERE user_id = $1`, [id]),
        db.query(`DELETE FROM signatures WHERE user_id = $1`, [id]),
        db.query(`DELETE FROM users WHERE id = $1`, [id])
    ]).then(result => result
    ).catch(error => "An error occured"+error);
}

exports.showSigners = showSigners;
exports.addSignatures = addSignatures;
exports.countSigners = countSigners;
exports.getSignature = getSignature;
exports.hasSignature = hasSignature;
exports.addUser = addUser;
exports.getUser = getUser;
exports.addUserProfile = addUserProfile;
exports.citySigners = citySigners;
exports.getUserData = getUserData;
exports.deleteSignature = deleteSignature;
exports.updateUserData = updateUserData;
exports.upsertUserProfile = upsertUserProfile;
exports.updatePassword = updatePassword;
exports.deleteAccount = deleteAccount;