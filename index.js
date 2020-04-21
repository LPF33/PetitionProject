const express = require("express");
const expressHandlebars = require("express-handlebars");
const bodyParser = require("body-parser");
const database = require("./database");
const cookieSession = require("cookie-session");
const csurf = require("csurf");
const hashP = require("./passwords");

const app = express();
app.engine('handlebars', expressHandlebars());
app.set('view engine', 'handlebars');

app.use(
    require('cookie-parser')()
);

app.use(cookieSession({
    secret: "Mainzelmännchen can you do it?",
    maxAge: 1000 * 60 * 60 * 24 * 14
}));

app.use(express.static('static'));
app.use(bodyParser.urlencoded({extended: false}));

app.use(csurf());
app.use((request,response,next) => {
    response.locals.csrfToken = request.csrfToken();
    next();
});

app.use( (request, response, next) => { 
    if( !("user" in request.session ) && !request.url.startsWith("/register") && !request.url.startsWith("/login")){
        response.redirect(302, "/register");
    } else {
        next();
    } 
});

function loginUser(request, response, next){
    if("user" in request.session){
        response.redirect(302,"/");
    }else {
        next();
    }
}

function loginUserNotSigned(request, response, next){
    if(!("signed" in request.session.user)){
        response.redirect(302,"/");
    } else {
        next();
    }
}

app.get("/register", loginUser, (request, response) => {
    response.render("register" , {
        title: "Mainzelmännchen, join us!"
    });
});

app.post("/register", (request, response) => {
    const {firstname, lastname, email, password} = request.body;
        if(!firstname || !lastname || !email || !password){
            response.render("register", {
                title: "Mainzelmännchen, join us!",
                noinput: "Please, fill out all input fields!",
                firstname,
                lastname,
                email
            });
        } else {
            hashP.hash(password).then( hash => {
                database.addUser(firstname, lastname, email, hash)
                    .then( result => {
                        request.session.user = result.rows[0];
                        response.redirect(302,"/profile");
                    })
                    .catch( () => {
                        response.render("register", {
                            title: "Mainzelmännchen, join us!",
                            noinput: "Choose other email address",
                            firstname,
                            lastname
                        })
                    });
            })
        }  
});

app.get("/profile", (request, response) => {
    response.render("profile", {
        title: "Give us some info!"
    })
});

app.post("/profile", (request, response) => {
    const {age, city, homepage} = request.body;
    if(!age || !city || !homepage){
        response.render("profile", {
            title: "Give us some info!",
            age,
            city,
            homepage,
            noinput: "You must fill out all fields!"
        })
    } else if( !homepage.startsWith("http://") && !homepage.startsWith("https://")) {
        response.render("profile", {
            title: "Give us some info!",
            age,
            city,
            noinput: "Homepage must start with http or https!"
        })
    } else {
        let user_id = request.session.user.id;
        database.addUserProfile(user_id ,age , city ,homepage)
            .then( () => {
                response.redirect(302,"/");
            })
            .catch( error => response.send("An error occurred!")); 
    }    
});

app.get("/profile/edit", (request, response) => {
    database.getUserData(request.session.user.id)
        .then( result => { 
            const {firstname, lastname, email, age, city, homepage} = result.rows[0];
            response.render("editprofile" , {
                title: "Mainzelmännchen, we need a change!",
                firstname,
                lastname,
                email,
                age,
                city,
                homepage
            });
        })
        .catch( error => response.send("An error occurred!"));
});

app.post("/profile/edit", (request, response) => {
    if(!("user" in request.session)){
        response.redirect(302,"/login");
    } else {
        const {firstname, lastname, email, password, age, city, homepage} = request.body;
        
        if(!firstname || !lastname || !email || !age || !city || !homepage){
            database.getUserData(request.session.user.id)
                .then( result => { 
                    const {firstname, lastname, email, age, city, homepage} = result.rows[0];
                        response.render("editprofile" , {
                        title: "Mainzelmännchen, we need a change!",
                        firstname,
                        lastname,
                        email,
                        age,
                        city,
                        homepage,
                        error : "true"
                    });
                })
                .catch( error => response.send("An error occurred!"));
        } else {
            const updateUserData = database.updateUserData(firstname,lastname,email,request.session.user.id);
            const upsertUserProfile = database.upsertUserProfile(request.session.user.id, age,city,homepage);
            let updatePassword; 

            if(password){
                hashP.hash(password)
                    .then(newPassword => 
                        updatePassword = database.updatePassword(newPassword, request.session.user.id))
                    .catch( error => response.send("An error occurred!"));  
            }

            Promise.all([
                updateUserData,
                upsertUserProfile,
                updatePassword
            ]).then( () => {
                    response.redirect(302,"/thank-you");
            }).catch( error => response.send("An error occurred!"));
        }         
    }
});

app.get("/login" , loginUser, (request, response) => {
    response.render("login" , {
        title: "Mainzelmännchen, do the ironing!"
    });   
});

app.post("/login", (request, response) => {
    const {email, password} = request.body;
    if(!email || !password){
        response.render("login", {
            title: "Mainzelmännchen, do the ironing!",
            noinput: "Please, fill in email and password!",
            email: email
        });
    } else {
        database.getUser(email)
            .then( user => { 
                hashP.compare(password, user.rows[0].password_hash)
                    .then( valid => { 
                        if(valid){ 
                            request.session.user = user.rows[0]; 
                            database.hasSignature(user.rows[0].id)
                            .then( result => { 
                                if(result.rows.length === 0){
                                    response.redirect(302,"/");
                                } else {
                                    request.session.user.signed = result.rows[0].case;
                                    response.redirect(302,"/thank-you");
                                }                                 
                            })
                            .catch( () => response.send("An error occurred!"));  
                        } else {
                            response.render("login", { 
                                title: "Mainzelmännchen, get it done!",
                                noinput: "Please, check your email or password!"
                            });
                        }

                    })
                    .catch( () => response.send("An error occurred!")); 
            })
            .catch( () => {
                response.render("login", {
                    title: "Mainzelmännchen, get it done!",
                    noinput: "Please, check your email or password!"
                })
            });       
    }
});

app.get("/", (request, response) => {
    if(!("signed" in request.session.user)){
        response.render("welcome",
        {
            title: "NO MORE IRONING",
            fillin : "SIGN NOW !!!"
        });             
    } else {
        response.redirect(302,"/thank-you");
    }    
});

app.post("/sign-petition", (request, response) => {
    const {signaturecode} = request.body;

    if(!signaturecode){
        response.render("welcome",
        {
            title: "NO MORE IRONING",
            nofillin : "Please, we need your signature!"
        });
    } else {        
        const user_id = request.session.user.id;
        database.addSignatures(user_id, signaturecode)
            .then(result => {
                request.session.signatureId = result.rows[0].id;
                request.session.user.signed = "True";
                response.redirect(302,"/thank-you");
            })
            .catch( () => response.send("An error occurred!"));         
    }       
});

app.get("/thank-you", loginUserNotSigned, (request, response) => {
    Promise.all([
        database.getSignature(request.session.user.id),
        database.countSigners()
    ]).then( result => { 
        let signCode = "";
        if("signatureId" in request.session){
            signCode = result[0].rows[0].signaturecode;
        } 
        response.render("thanks",
            {
                title: "Mainzelmännchen, do the ironing!",
                signer: request.session.user.firstname,
                signature: signCode,
                number : result[1].rows[0].count
            }) 
    }).catch( () => response.send("An error occurred!"));      
});

app.post("/unsign-petition", (request, response) => {
    database.deleteSignature(request.session.user.id)
        .then( () => {
            delete request.session.user.signed;            
            response.redirect(302, "/");       
        })
        .catch( () => response.send("An error occurred!")); 
});

app.get("/signers", loginUserNotSigned, (request, response) => {
    database.showSigners()
        .then(result => {
            response.render("signers",
                {   
                    title: "Mainzelmännchen, help!",
                    signers : result.rows
                })        
        })
        .catch( () => response.send("An error occurred!"));     
});

app.get("/signers/:city", loginUserNotSigned, (request, response) => { 
    database.citySigners(request.params.city)
        .then(result => {
            response.render("signersCity",
                {   
                    title: "Mainzelmännchen, help!",
                    signers : result.rows,
                    city: request.params.city
                })        
        })
        .catch( () => response.send("An error occurred!"));     
});

app.post("/delete", (request, response) => {
    database.deleteAccount(request.session.user.id)
        .then( () => {
            response.render("logout", {
                signer: request.session.user.firstname,
                goodbye: "It is a great pity, that you are leaving us !",
                goodbye2: "Goodbye, ",
                direct: "register"
            })
            delete request.session.user;
            delete request.session.signatureId;
        })
        .catch( () => response.send("Please write an email"));  
});

app.get("/logout", (request, response) => {     
    response.render("logout",
    {
        signer: request.session.user.firstname,
        goodbye: "Thanks for your visit !",
        goodbye2: "See you next time,",
        direct: "login"

    })
    delete request.session.user;
    delete request.session.signatureId;
}); 

if(require.main == module){
    app.listen(process.env.PORT || 8080);
}

module.exports = app;
