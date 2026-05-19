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

  if (username === 'Ignacio' && password === '1234') {
    showMessage(`¡Bienvenido, ${username}! Redirigiendo al panel...`, false);
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 800);
    return;
  }

  showMessage('Usuario o contraseña incorrectos. Usa Ignacio / 1234.', true);
});

forgotButton.addEventListener('click', () => {
  showMessage('Contacta a soporte de la ferretería para restablecer tu contraseña.', true);
});

function showMessage(message, isError) {
  loginMessage.textContent = message;
  loginMessage.classList.toggle('error', isError);
  loginMessage.style.display = 'block';
}
