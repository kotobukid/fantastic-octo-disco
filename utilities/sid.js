const crypto = require('crypto')


module.exports = ((redis) => {
    return (complete) => {
        const generate_single = () => {

            const key = crypto.randomBytes(32).toString('base64')

            redis.keys(`auth:${key}`).then((found) => {
                if (found.length > 0) {
                    generate_single()
                } else {
                    complete(key)
                }
            })
        }
        generate_single()
    }
})