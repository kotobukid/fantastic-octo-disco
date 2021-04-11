const path = require("path")
const http = require('http')
const express = require('express')
const cookieParser = require('cookie-parser')
const auth = require('./auth')
const Redis = require('ioredis')
const socketio = require("socket.io")

const app = express()
const port = 3000
const redis = new Redis()

const deserialize_user = require('./middlewares/deserialize_user')(redis)
const generate_sid = require('./utilities/sid')(redis)

app.set('views', path.join(__dirname, './views'))
app.set('view engine', 'pug')

// app.use(passport.initialize())
app.use(cookieParser())
// app.use(passport.session())
app.use("/public", express.static(path.join(__dirname, './public')))
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({extended: true})) // for parsing application/x-www-form-urlencoded

app.use(deserialize_user)

app.get('/', (req, res) => {
    const user = req.user
    if (user && user.id) {
        console.log({user})
        console.log('authenticated')
        res.render('index', {user})
    } else {
        console.log('anonymous')
        res.render('index', {})
    }
})

const parse_header = (str) => {
    const words = str.split(';')
    const dict = {}
    for (let i = 0; i < words.length; i++) {
        const [key, value] = words[i].split('=')
        console.log({key, value})
        dict[key.trim()] = value.trim()
    }
    return dict
}

app.post('/login', (req, res, next) => {
    console.log('LOGIN')
    const id = req.body.id.trim()
    const password = req.body.password.trim()

    auth.authenticate(id, password, (user) => {
        if (user) {
            generate_sid((sid) => {
                const key = `auth:${sid}`
                // const expires = 10 // 10秒
                const expires = 60 * 60 * 24 * 7    // 1週間

                redis.hmset(key, user).then(() => {
                    redis.expire(key, expires).then(() => {
                        res.cookie('aaa', 'ABC', {})   //Cookieにsid以外のものが設定されている場合を想定したノイズ
                        res.cookie('sid', sid, {})
                        res.cookie('bbb', 'XYZ', {})
                        return res.redirect('/')
                    })
                })
            })
        } else {
            return res.redirect('/')
        }
    })
})

app.get('/logout', (req, res, next) => {
    const sid = req.cookies.sid
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

app.get('/chat', (req, res, next) => {
    if (!req.user.id) {
        next('login required')
    } else {
        res.render('chat', {user: req.user})
    }
})


const options = {}
const server = http.createServer(options, app)
const io = socketio(server)

io.on("connection", (socket) => {
    const cookies = parse_header(socket.handshake.headers.cookie)
    const sid = decodeURIComponent(cookies['sid'] || '')

    if (sid) {
        redis.hgetall(`auth:${sid}`).then((user) => {
            console.log('a user connected')
            socket.user = user

            socket.on('disconnect', () => {
                console.log('user disconnected')
            })

            socket.on('chat message', (msg) => {
                console.log('message: ' + msg)
                io.emit('message', `${socket.user.name} 「${msg}」`)
            })
        })
    } else {
        socket.emit('not authenticated')
    }
})

server.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})