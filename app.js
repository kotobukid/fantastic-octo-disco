const express = require('express')
const passport = require('passport');
const app = express()
const port = 3000

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

app.get('/', (req, res) => {
    console.log('GET')
    res.send('<form action="" method="POST"><label>ID:<input type="text" name="id" value=""></label><br /><input type="submit" value="login"></form>')
})

app.post('/', (req, res, next) => {
    console.log('POST')
    console.log(req.body)
    res.send('POST request')
})


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})