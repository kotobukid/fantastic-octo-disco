module.exports = ((redis) => {
    return (req, res, next) => {
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
    }
});