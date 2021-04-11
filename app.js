const path = require("path")

const express = require('express')
const passport = require('passport');
const cookieParser = require('cookie-parser')
const auth = require('./auth');
const Redis = require('ioredis')

const app = express()
const port = 3000
const redis = new Redis()

app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'pug');

app.use(passport.initialize());
app.use(cookieParser())
app.use(passport.session());

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({extended: true})) // for parsing application/x-www-form-urlencoded

app.use((req, res, next) => {
    const name = req.cookies.name
    if (!!name) {
        console.log(` you are ${name}.`)
    }

    next();
})

app.get('/', (req, res) => {
    const sid = req.cookies['sid'];

    if (sid) {
        redis.hgetall(`auth:${sid}`).then((user) => {
            if (user) {
                res.render('index', {user})
            } else {
                res.render('index', {})
            }
        })
    } else {
        res.render('index', {})
    }
})

app.post('/login', (req, res, next) => {
    console.log('LOGIN')
    const id = req.body.id.trim()
    const password = req.body.password.trim();

    auth.authenticate(id, password, (user) => {
        if (user) {
            const sid = Math.random().toString()

            redis.hmset(`auth:${sid}`, user).then(() => {
                res.cookie('sid', sid, {})
                // console.log({session: req.session})
                return res.redirect('/');
            })
        } else {
            return res.redirect('/')
        }
    })


    // passport.authenticate('local', function (err, user, info) {
    //     if (err) {
    //         return next(err);
    //     }
    //     if (!user) {
    //         return res.redirect('/login');
    //     }
    //     req.logIn(user, function (err) {
    //         if (err) {
    //             return next(err);
    //         }
    //         return res.redirect('/')
    //     });
    // })(req, res, next);

})

app.post('/', (req, res, next) => {
    res.send('POST request')
})

app.get('/logout', (req, res, next) => {
    console.log(req.cookies)
    const sid = req.cookies.sid;
    if (sid) {
        redis.del(`auth:${sid}`).then(() => {
            res.cookie('sid', '', {})
            res.redirect('/')
        })
    } else {
        res.cookie('sid', '', {})
        res.redirect('/')
    }
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})