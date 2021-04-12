import * as io from 'socket.io-client';
// @ts-ignore
const socket: SocketIOClient.Socket = io.default()
 
window.onload = () => {
    const form: HTMLElement = document.getElementById('form')!
    const input: HTMLInputElement = <HTMLInputElement>document.getElementById('input')
    const messages: HTMLElement = document.getElementById('messages')!

    form.addEventListener('submit', function (e) {
        e.preventDefault()
        if (input.value) {
            socket.emit('chat message', input.value)
            input.value = ''
        }
    })

    socket.on('message', (msg: string) => {
        const item = document.createElement('li')
        item.textContent = msg
        messages.appendChild(item)
        window.scrollTo(0, document.body.scrollHeight)
    })

    socket.on('not authenticated', () => {
        socket.disconnect()
        alert('セッションの有効期限が切れています')
        location.assign('/')
    })
}