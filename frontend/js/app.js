// UI wiring for the demo frontend
document.addEventListener('DOMContentLoaded', () => {
  const output = document.getElementById('output');
  const apiBaseInput = document.getElementById('apiBase');
  const flaskBaseInput = document.getElementById('flaskBase');
  const userTokenInput = document.getElementById('userToken');
  const saveBtn = document.getElementById('saveConfig');

  // initialize values from localStorage
  apiBaseInput.value = localStorage.getItem('apiBase') || apiBaseInput.value;
  userTokenInput.value = localStorage.getItem('userToken') || '';

  saveBtn.addEventListener('click', () => {
    const apiBase = apiBaseInput.value.trim();
    const token = userTokenInput.value.trim();
    localStorage.setItem('apiBase', apiBase);
    localStorage.setItem('userToken', token);
    API.setApiBase(apiBase);
    API.setUserToken(token);
    renderOutput({ message: 'Config saved', apiBase, token: token ? '***' : '(none)' });
  });

  // Register
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = { nombre: fd.get('nombre'), email: fd.get('email'), password: fd.get('password') };
    const r = await API.register(payload);
    renderOutput(r);
  });

  // Login
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = { login: fd.get('login'), password: fd.get('password') };
    const r = await API.login(payload);
    // if token present, store as user-token
    if (r && r.body && r.body['user-token']) {
      API.setUserToken(r.body['user-token']);
      document.getElementById('userToken').value = r.body['user-token'];
    }
    renderOutput(r);
  });

  // Command
  document.getElementById('commandForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = { texto: fd.get('texto') };
    const r = await API.processCommand(payload);
    renderOutput(r);
  });

  // Create Cita
  document.getElementById('createCitaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      titulo: fd.get('titulo'),
      fecha: fd.get('fecha'),
      hora_inicio: fd.get('hora_inicio'),
      lugar: fd.get('lugar'),
      descripcion: fd.get('descripcion')
    };
    const r = await API.createCita(payload);
    renderOutput(r);
  });

  document.getElementById('listCitas').addEventListener('click', async () => {
    const r = await API.listCitas();
    renderOutput(r);
  });

  document.getElementById('getCita').addEventListener('click', async () => {
    const id = document.getElementById('citaId').value.trim();
    if (!id) return renderOutput({ error: 'Provide an ID' });
    const r = await API.getCitaById(id);
    renderOutput(r);
  });

  document.getElementById('deleteCita').addEventListener('click', async () => {
    const id = document.getElementById('citaId').value.trim();
    if (!id) return renderOutput({ error: 'Provide an ID' });
    const r = await API.deleteCita(id);
    renderOutput(r);
  });

  function renderOutput(obj) {
    output.textContent = JSON.stringify(obj, null, 2);
  }

  // apply initial config
  API.setApiBase(localStorage.getItem('apiBase') || apiBaseInput.value);
  API.setUserToken(localStorage.getItem('userToken') || '');
});
