const USERS = [
    {id: 'taro', pass: 'taro', name: '太郎'},
    {id: 'jiro', pass: 'jiro', name: '次郎'},
    {id: 'saburo', pass: 'saburo', name: '三郎'},
    {id: 'hanako', pass: 'hanako', name: '花子'},
    {id: 'yuri', pass: 'yuri', name: '百合'},
]


const authenticate = (login_id, password, next) => {
    let found = false;

    for (let i = 0; i < USERS.length; i++) {
        if (USERS[i].id === login_id && USERS[i].pass === password) {
            found = true;
            return next(USERS[i])
        }
    }

    next(null)
}

const select_user_by_id = (id, next) => {
    for (let i = 0; i < USERS.length; i++) {
        if (USERS[i].id === id) {
            return next(USERS[i])
        }
    }
    return next(null)
}

module.exports = {
    authenticate,
    select_user_by_id
}