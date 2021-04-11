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
    const sid = req.cookies.sid
    if (!!sid) {
        redis.hgetall(`auth:${sid}`).then((data) => {
            if (data) {
                req.user = data
            }
            next()
        });
    } else {
        next();
    }
})

app.get('/', (req, res) => {
    const user = req.user;
    if (user && user.id) {
        console.log({user})
        console.log('authenticated')
        res.render('index', {user})
    } else {
        console.log('anonymous')
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
            const key = `auth:${sid}`
            const expires = 10; // 10秒
            // const expires = 60 * 60 * 24 * 7;    // 1週間

            redis.hmset(key, user).then(() => {
                redis.expire(key, expires).then(() => {
                    res.cookie('sid', sid, {})
                    return res.redirect('/')
                })
            })
        } else {
            return res.redirect('/')
        }
    })
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