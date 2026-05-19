const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const forgotButton = document.getElementById('forgotButton');

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    showMessage('Por favor completa usuario y contraseña.', true);
    return;
  }

  showMessage(`¡Bienvenido, ${username}! Has ingresado correctamente.`, false);
});

forgotButton.addEventListener('click', () => {
  showMessage('Contacta a soporte de la ferretería para restablecer tu contraseña.', true);
});

function showMessage(message, isError) {
  loginMessage.textContent = message;
  loginMessage.classList.toggle('error', isError);
  loginMessage.style.display = 'block';
}
