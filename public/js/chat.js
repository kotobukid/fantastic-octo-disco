const socket = io();

window.onload = () => {
    const form = document.getElementById('form')
    const input = document.getElementById('input')
    const messages = document.getElementById('messages')

    form.addEventListener('submit', function (e) {
        e.preventDefault()
        if (input.value) {
            socket.emit('chat message', input.value);
            input.value = ''
        }
    });

    socket.on('message', (msg) => {
        const item = document.createElement('li');
        item.textContent = msg
        messages.appendChild(item)
        window.scrollTo(0, document.body.scrollHeight)
    })

    socket.on('not authenticated', () => {
        socket.disconnect();
        alert('セッションの有効期限が切れています');
        location.assign('/')
    })
}