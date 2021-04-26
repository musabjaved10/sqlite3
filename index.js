const express = require('express')
const app = express();
const PORT = process.env.PORT || '3000'
const flash = require('connect-flash')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const ejsMate = require('ejs-mate')
const path = require('path')
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/accounts.db');


app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')))
app.use(flash())

//use cookie parser
app.use(cookieParser('secret'));

//config session
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 86400000 1 day
    }
}));

let loggedIn = false;

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currentUser = req.session.currentUser || 'User'
    next();
});

app.get('/delete', async (req, res) => {
    await db.run('DROP TABLE users');
    res.send('Table has been deleted')
})
app.get('/createtable', async (req, res) => {
    await db.run('CREATE TABLE IF NOT EXISTS users(username TEXT, password TEXT)');
    res.send('Table has been created')
})
app.get('/insertusers', async (req, res) => {
    await db.serialize(() => {
        db.run('INSERT INTO users (username,password) VALUES(?,?)',[`Alice`,`§$Y45/912v`], function (err) {
            if (err) {
                console.log(err)
                return res.send(err.message);
            }
            console.log("New employee has been added");
        });
        db.run('INSERT INTO users (username,password) VALUES(?,?)',[`Bob`, `secret`], function (err) {
            if (err) {
                return res.send(err.message);
            }
            console.log("New employee has been added");
        });
        db.run('INSERT INTO users (username,password) VALUES(?,?)',[`Carla`, `123`], function (err) {
            if (err) {
                return res.send(err.message);
            }
            console.log("New employee has been added");
        });
        db.run('INSERT INTO users (username,password) VALUES(?,?)',[`David`, `divaD`], function (err) {
            if (err) {
                return res.send(err.message);
            }
            console.log("New employee has been added");
            return res.send(`USERS has been created!`)
        });

    });
})
app.get('/read', async (req, res) => {
    await db.serialize(() => {
        db.all('SELECT * FROM users where username=? ',['baba'], function (err,result) {
            if (err) {
                console.log(err)
                return res.send(err.message);
            }
            console.log(result.length );
            return res.send(result)
        });

    });
})

app.get('/', (req, res) => {
    res.render('login')
})
app.post('/',async (req,res)=>{
    const {username, password} = req.body
    await db.serialize(() => {
        db.all('SELECT * FROM users where username=? ',[username], function (err,result) {
            if (err) {
                console.log(err)
                return res.red(err.message);
            }
            if(result.length === 0){
                req.flash('error',`User ${username} doesn't exist`)
                return res.redirect(req.headers.referer)
            }

            db.all('SELECT * FROM users where username=? AND password = ? ',[username, password], function (err,result) {
                if (err) {
                    console.log(err)
                    return res.red(err.message);
                }
                if(result.length === 0){
                    req.flash('error',`Invalid password`)
                    console.log('Invalid password')
                    return res.redirect(req.headers.referer)
                }
                loggedIn = true
                req.session.currentUser = username
                req.flash('success','Login successful')
                return res.redirect('welcome')

            });

        });

    });
})
app.get('/welcome',(req,res)=>{
    if(loggedIn === true){
        console.log(req.session.currentUser)
        return res.render('welcome')
    }
    req.flash('error','Please login first')
    res.redirect('/')

})
app.get('/logout',(req,res)=>{
    req.flash('success','You have been logged out')
    loggedIn = false
    res.render('login')
})

app.listen(PORT, () => {
    console.log(`Server is up on port ${PORT}`)
})
