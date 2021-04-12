import {NextFunction, Response} from "express";

import * as socketio from 'socket.io'
import _deserialize_user from './middlewares/deserialize_user'

const path = require("path")
const http = require('http')
const express = require('express')
const cookieParser = require('cookie-parser')
const auth = require('./auth')
import Redis = require('ioredis');

const app = express()
const port = 3000
const redis = new Redis()

const deserialize_user = _deserialize_user(redis)

const generate_sid = require('./utilities/sid')(redis)

app.set('views', path.join(__dirname, './views'))
app.set('view engine', 'pug')

app.use(cookieParser())
app.use("/public", express.static(path.join(__dirname, './dist/public')))
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({extended: true})) // for parsing application/x-www-form-urlencoded

app.use(deserialize_user)

app.get('/', (req: Request & { user: { name: string, id: string, pass: string } }, res: Response) => {
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

const parse_header = (str: string): Record<string, string> => {
    const words = str.split(';')
    const dict: Record<string, string> = {}
    for (let i = 0; i < words.length; i++) {
        const [key, value]: string[] = words[i].split('=')
        console.log({key, value})
        dict[key.trim()] = value.trim()
    }
    return dict
}

app.post('/login', (req: Request & { body: { id: string, password: string } }, res: Response, next: NextFunction) => {
    console.log('LOGIN')
    const id = req.body.id.trim()
    const password = req.body.password.trim()

    auth.authenticate(id, password, (user: { name: string, id: string, pass: string }) => {
        if (user) {
            generate_sid((sid: string) => {
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

app.get('/logout', (req: Request & { cookies: { sid: string } }, res: Response, next: NextFunction) => {
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

app.get('/chat', (req: Request & { user: { name: string, id: string, pass: string } }, res: Response, next: NextFunction) => {
    if (!req.user.id) {
        next('login required')
    } else {
        res.render('chat', {user: req.user})
    }
})


const options = {}
const server = http.createServer(options, app)
// @ts-ignore
const _io: any = socketio(server)

_io.on("connection", (socket: socketio.Socket & { user: { name: string, id: string, pass: string } } & { handshake: { headers: { cookie: string } } }) => {
    const cookies: Record<string, string> = parse_header(socket.handshake.headers.cookie || '')
    const sid = decodeURIComponent(cookies['sid'] || '')

    if (sid) {
        redis.hgetall(`auth:${sid}`).then((user: Record<string, string>) => {
            console.log('a user connected')
            socket.user = <{ name: string, id: string, pass: string }>user

            socket.on('disconnect', () => {
                console.log('user disconnected')
            })

            socket.on('chat message', (msg: string) => {
                console.log('message: ' + msg)
                _io.emit('message', `${socket.user.name} 「${msg}」`)
            })
        })
    } else {
        socket.emit('not authenticated')
    }
})

server.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})