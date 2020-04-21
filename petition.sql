DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS user_profile;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    firstname VARCHAR(200) NOT NULL,
    lastname VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    password_hash VARCHAR(250) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id), 
    signaturecode TEXT
);

CREATE TABLE user_profile (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    age INTEGER NOT NULL,
    city  VARCHAR(250) NOT NULL,
    homepage VARCHAR(250) NOT NULL
);