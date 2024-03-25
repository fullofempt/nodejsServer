
// Функция для инициализации игры крестики-нолики
function initTicTacToe(socket) {
    const cells = document.querySelectorAll('.cell');
    let currentPlayer = 'X';

    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            if (!cell.textContent) {
                cell.textContent = currentPlayer;
                socket.emit('move', { cellId: cell.id, player: currentPlayer });
                currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            }
        });
    });

    socket.on('move', ({ cellId, player }) => {
        const cell = document.getElementById(cellId);
        cell.textContent = player;
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    });
}

//функция для использования в других файлах
module.exports = { initTicTacToe };
