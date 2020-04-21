const supertest = require("supertest");
const app = require("./index.js");
const cookieSession = require('cookie-session');
const database = require("./database.js");
jest.mock("./database.js");

test("logged out / redirect to registration page", () => {

    return supertest(app)
        .get("/")
        .then(response => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location).toBe("/register");
        });
});

test("Users logged go '/login' redirected to '/' ", () => {

    cookieSession.mockSessionOnce({
        user : "Bob"
    });

    return supertest(app)
        .get("/login")
        .then(response => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location).toBe("/");
        });
});

test("Users logged go '/register' redirected to '/' ", () => {

    cookieSession.mockSessionOnce({
        user : {id : 1}
    });

    return supertest(app)
        .get("/register")
        .then(response => {
            expect(response.statusCode).toBe(302);
            expect(response.header.location).toBe("/");
        });
});

test("logged in Users && signed petition redirected to '/thank-you' attempt petition page || submit signature", () => {

    cookieSession.mockSessionOnce({
        user : {
            id : 1,
            signed : "true"
        }        
    });

    return supertest(app)
    .get("/")
    .then(response => {
        expect(response.statusCode).toBe(302);
        expect(response.header.location).toBe("/thank-you");
    });

});

test("logged in Users && not signed petition redirected to '/' attempt 'thank-you' ", () => {

    cookieSession.mockSessionOnce({
        user : {
            id : 1
        }        
    });

    return supertest(app)
    .get("/thank-you")
    .then(response => {
        expect(response.statusCode).toBe(302);
        expect(response.header.location).toBe("/");
    });

});

test("logged in Users && not signed petition redirected to '/' attempt 'signers'", () => {

    cookieSession.mockSessionOnce({
        user : {
            id : 1
        }        
    });

    return supertest(app)
    .get("/signers")
    .then(response => {
        expect(response.statusCode).toBe(302);
        expect(response.header.location).toBe("/");
    });

});


test("POST route for '/register' to '/profile' is working", () => {

    cookieSession.mockSessionOnce({        
    });

    database.addUser.mockResolvedValue(
        {
        
            rows:[{
            id:"2",
            firstname: "hans"
            }]
        });
    return supertest(app)
    .post("/register")
    .send( "firstname=hans&lastname=hans&email=hans&password=hallo")
    .then(response => { 
        expect(response.statusCode).toBe(302);
        expect(response.header.location).toBe("/profile");
    });
});