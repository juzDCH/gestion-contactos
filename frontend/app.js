const API = 'https://gestion-contactos-nn65.onrender.com';

// =================== NAVEGACIÓN ===================
function mostrarSeccion(seccion) {
    document.getElementById('seccion-personas').style.display = seccion === 'personas' ? 'block' : 'none';
    document.getElementById('seccion-grupos').style.display = seccion === 'grupos' ? 'block' : 'none';
    document.getElementById('btn-personas').classList.toggle('active', seccion === 'personas');
    document.getElementById('btn-grupos').classList.toggle('active', seccion === 'grupos');
    if (seccion === 'personas') cargarPersonas();
    if (seccion === 'grupos') cargarGrupos();
}

// =================== PERSONAS ===================
async function cargarPersonas() {
    const res = await fetch(`${API}/personas/`);
    const personas = await res.json();
    const contenedor = document.getElementById('lista-personas');
    if (personas.length === 0) {
        contenedor.innerHTML = '<p style="color:#888">No hay personas registradas.</p>';
        return;
    }
    contenedor.innerHTML = personas.map(p => `
        <div class="card">
            ${p.fotografia
                ? `<img src="${API}${p.fotografia}" alt="foto">`
                : `<div class="avatar">👤</div>`}
            <h3>${p.nombres} ${p.apellidos}</h3>
            <span class="grupo-badge">${p.grupo || 'Sin grupo'}</span>
            <p class="info">📧 ${p.correo || '—'}</p>
            <p class="info">📱 ${p.nro_celular || '—'}</p>
            <p class="info">📍 ${p.direccion || '—'}</p>
            ${p.observaciones ? `<p class="info">📝 ${p.observaciones}</p>` : ''}
            <span class="estado ${p.esta_activo ? 'activo' : 'inactivo'}">
                ${p.esta_activo ? '✅ Activo' : '❌ Inactivo'}
            </span>
            <div class="card-actions">
                <button class="btn-edit" onclick="editarPersona('${p.id}')">✏️ Editar</button>
                <button class="btn-delete" onclick="eliminarPersona('${p.id}')">🗑️ Eliminar</button>
            </div>
        </div>
    `).join('');
}

function abrirModalPersona() {
    document.getElementById('titulo-modal-persona').textContent = 'Nueva Persona';
    document.getElementById('persona-id').value = '';
    document.getElementById('form-persona').reset();
    document.getElementById('preview-foto').style.display = 'none';
    cargarGruposSelect();
    document.getElementById('modal-persona').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

async function editarPersona(id) {
    const res = await fetch(`${API}/personas/${id}`);
    const p = await res.json();
    document.getElementById('titulo-modal-persona').textContent = 'Editar Persona';
    document.getElementById('persona-id').value = p.id;
    document.getElementById('p-nombres').value = p.nombres;
    document.getElementById('p-apellidos').value = p.apellidos;
    document.getElementById('p-correo').value = p.correo || '';
    document.getElementById('p-celular').value = p.nro_celular || '';
    document.getElementById('p-direccion').value = p.direccion || '';
    document.getElementById('p-observaciones').value = p.observaciones || '';
    document.getElementById('p-activo').value = p.esta_activo ? 'true' : 'false';
    if (p.fotografia) {
        document.getElementById('preview-foto').src = `${API}${p.fotografia}`;
        document.getElementById('preview-foto').style.display = 'block';
    }
    await cargarGruposSelect();
    document.getElementById('p-grupo').value = p.grupo_id;
    document.getElementById('modal-persona').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

async function eliminarPersona(id) {
    if (!confirm('¿Desactivar esta persona?')) return;
    await fetch(`${API}/personas/${id}`, { method: 'DELETE' });
    cargarPersonas();
}

document.getElementById('form-persona').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('persona-id').value;
    const formData = new FormData();
    formData.append('nombres', document.getElementById('p-nombres').value);
    formData.append('apellidos', document.getElementById('p-apellidos').value);
    formData.append('correo', document.getElementById('p-correo').value);
    formData.append('nro_celular', document.getElementById('p-celular').value);
    formData.append('direccion', document.getElementById('p-direccion').value);
    formData.append('observaciones', document.getElementById('p-observaciones').value);
    formData.append('esta_activo', document.getElementById('p-activo').value);
    formData.append('grupo_id', document.getElementById('p-grupo').value);
    const foto = document.getElementById('p-foto').files[0];
    if (foto) formData.append('fotografia', foto);

    const url = id ? `${API}/personas/${id}` : `${API}/personas/`;
    const method = id ? 'PUT' : 'POST';
    await fetch(url, { method, body: formData });
    cerrarModal('modal-persona');
    cargarPersonas();
});

document.getElementById('p-foto').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            document.getElementById('preview-foto').src = ev.target.result;
            document.getElementById('preview-foto').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// =================== GRUPOS ===================
async function cargarGrupos() {
    const res = await fetch(`${API}/grupos/`);
    const grupos = await res.json();
    const contenedor = document.getElementById('lista-grupos');
    if (grupos.length === 0) {
        contenedor.innerHTML = '<p style="padding:20px; color:#888">No hay grupos registrados.</p>';
        return;
    }
    contenedor.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Grupo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${grupos.map(g => `
                    <tr>
                        <td>${g.grupo}</td>
                        <td><span class="estado ${g.esta_activo ? 'activo' : 'inactivo'}">
                            ${g.esta_activo ? '✅ Activo' : '❌ Inactivo'}
                        </span></td>
                        <td>
                            <button class="btn-edit" onclick="editarGrupo('${g.id}', '${g.grupo}', ${g.esta_activo})">✏️ Editar</button>
                            <button class="btn-delete" onclick="eliminarGrupo('${g.id}')">🗑️ Eliminar</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function cargarGruposSelect() {
    const res = await fetch(`${API}/grupos/`);
    const grupos = await res.json();
    const select = document.getElementById('p-grupo');
    select.innerHTML = grupos
        .filter(g => g.esta_activo)
        .map(g => `<option value="${g.id}">${g.grupo}</option>`)
        .join('');
}

function abrirModalGrupo() {
    document.getElementById('titulo-modal-grupo').textContent = 'Nuevo Grupo';
    document.getElementById('grupo-id').value = '';
    document.getElementById('form-grupo').reset();
    document.getElementById('modal-grupo').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

function editarGrupo(id, nombre, activo) {
    document.getElementById('titulo-modal-grupo').textContent = 'Editar Grupo';
    document.getElementById('grupo-id').value = id;
    document.getElementById('g-nombre').value = nombre;
    document.getElementById('g-activo').value = activo ? 'true' : 'false';
    document.getElementById('modal-grupo').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

async function eliminarGrupo(id) {
    if (!confirm('¿Desactivar este grupo?')) return;
    await fetch(`${API}/grupos/${id}`, { method: 'DELETE' });
    cargarGrupos();
}

document.getElementById('form-grupo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('grupo-id').value;
    const data = {
        grupo: document.getElementById('g-nombre').value,
        esta_activo: document.getElementById('g-activo').value === 'true'
    };
    const url = id ? `${API}/grupos/${id}` : `${API}/grupos/`;
    const method = id ? 'PUT' : 'POST';
    await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    cerrarModal('modal-grupo');
    cargarGrupos();
});

// =================== UTILS ===================
function cerrarModal(id) {
    document.getElementById(id).style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

function cerrarTodosModales() {
    cerrarModal('modal-persona');
    cerrarModal('modal-grupo');
}

// Cargar personas al inicio
cargarPersonas();