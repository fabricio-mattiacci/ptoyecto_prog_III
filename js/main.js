const API = "http://localhost:3000/api";

let usuarioActual = JSON.parse(localStorage.getItem("usuarioActual")) || null;

document.addEventListener("DOMContentLoaded", function() {
    actualizarHeader();

    const pagina = window.location.pathname;

    if (pagina.includes("index") || pagina === "/" || pagina.endsWith("/")) {
        iniciarIndex();
    } else if (pagina.includes("login")) {
        iniciarLogin();
    } else if (pagina.includes("registro")) {
        iniciarRegistro();
    } else if (pagina.includes("apuesta")) {
        iniciarApuesta();
    } else if (pagina.includes("admin")) {
        iniciarAdmin();
    }
});

/* ─── HEADER ─── */
function actualizarHeader() {
    const btnLogout = document.getElementById("btnLogout");
    const headerUsuario = document.querySelector(".header-usuario");

    if (btnLogout) {
        btnLogout.addEventListener("click", cerrarSesion);
    }

    if (headerUsuario && usuarioActual) {
        headerUsuario.textContent = "👤 " + usuarioActual.nombre;
    }
}

/* ─── INDEX ─── */
async function iniciarIndex() {
    await cargarApuestasVigentes();
    await cargarApuestasFinalizadas();
    await cargarDestacada();
}

async function cargarApuestasVigentes() {
    try {
        const res = await fetch(`${API}/apuestas/vigentes`);
        const apuestas = await res.json();

        const contenedor = document.getElementById("apuestasVigentes");
        contenedor.innerHTML = "";

        for (const apuesta of apuestas) {
            const resP = await fetch(`${API}/apuestas/${apuesta.id}`);
            const detalle = await resP.json();

            const card = document.createElement("div");
            card.classList.add("apuesta-card");
            card.innerHTML = `
                <div class="apuesta-estado vigente">Vigente</div>
                <h3>${detalle.titulo}</h3>
                <div class="apuesta-datos">
                    <span>📅 ${formatearFecha(detalle.fechaEvento)}</span>
                    <span>⏰ Cierra: ${formatearFecha(detalle.fechaLimite)}</span>
                </div>
                <div class="apuesta-pronosticos">
                    ${detalle.pronosticos.map(p => `
                        <div class="pronostico">
                            <span>${p.descripcion}</span>
                            <span class="dividendo">${p.dividendo}x</span>
                        </div>
                    `).join("")}
                </div>
                <button class="btn btn-primary" onclick="verApuesta(${detalle.id})">Ver apuesta</button>
            `;
            contenedor.appendChild(card);
        }
    } catch (error) {
        console.error("Error cargando apuestas vigentes:", error);
    }
}

async function cargarApuestasFinalizadas() {
    try {
        const res = await fetch(`${API}/apuestas/finalizadas`);
        const apuestas = await res.json();

        const contenedor = document.getElementById("apuestasFinalizadas");
        contenedor.innerHTML = "";

        for (const apuesta of apuestas) {
            const card = document.createElement("div");
            card.classList.add("apuesta-card", "finalizada");
            card.innerHTML = `
                <div class="apuesta-estado cerrada">Cerrada</div>
                <h3>${apuesta.titulo}</h3>
                <div class="apuesta-datos">
                    <span>📅 ${formatearFecha(apuesta.fechaEvento)}</span>
                </div>
            `;
            contenedor.appendChild(card);
        }
    } catch (error) {
        console.error("Error cargando apuestas finalizadas:", error);
    }
}

async function cargarDestacada() {
    try {
        const res = await fetch(`${API}/apuestas/vigentes`);
        const apuestas = await res.json();
        const destacada = apuestas.find(a => a.destacada);

        if (!destacada) return;

        const resP = await fetch(`${API}/apuestas/${destacada.id}`);
        const detalle = await resP.json();

        document.querySelector(".destacada-titulo").textContent = detalle.titulo;
        document.querySelector(".destacada-info").innerHTML = `
            <span>📅 Fecha evento: ${formatearFecha(detalle.fechaEvento)}</span>
            <span>⏰ Cierra: ${formatearFecha(detalle.fechaLimite)}</span>
        `;
        document.querySelector(".destacada-pronosticos").innerHTML = detalle.pronosticos.map(p => `
            <div class="pronostico-card">
                <p>${p.descripcion}</p>
                <span class="dividendo">${p.dividendo}x</span>
            </div>
        `).join("");

        document.querySelector(".destacada .btn-primary").onclick = function() {
            verApuesta(detalle.id);
        };
    } catch (error) {
        console.error("Error cargando destacada:", error);
    }
}

/* ─── LOGIN ─── */
function iniciarLogin() {
    const btnLogin = document.getElementById("btnLogin");
    if (!btnLogin) return;

    btnLogin.addEventListener("click", async function() {
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        const errorDiv = document.getElementById("errorLogin");

        if (!email || !password) {
            errorDiv.textContent = "Completá todos los campos";
            errorDiv.style.display = "block";
            return;
        }

        try {
            const res = await fetch(`${API}/usuarios/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                errorDiv.textContent = data.error;
                errorDiv.style.display = "block";
                return;
            }

            localStorage.setItem("usuarioActual", JSON.stringify(data));

            if (data.rol === "admin") {
                window.location.href = "admin.html";
            } else {
                window.location.href = "index.html";
            }

        } catch (error) {
            errorDiv.textContent = "Error de conexión con el servidor";
            errorDiv.style.display = "block";
        }
    });
}

/* ─── REGISTRO ─── */
function iniciarRegistro() {
    const btnRegistro = document.getElementById("btnRegistro");
    if (!btnRegistro) return;

    btnRegistro.addEventListener("click", async function() {
        const nombre = document.getElementById("nombre").value.trim();
        const apellido = document.getElementById("apellido").value.trim();
        const fechaNacimiento = document.getElementById("fechaNacimiento").value;
        const dni = document.getElementById("dni").value.trim();
        const email = document.getElementById("email").value.trim();
        const telefono = document.getElementById("telefono").value.trim();
        const password = document.getElementById("password").value.trim();
        const confirmarPassword = document.getElementById("confirmarPassword").value.trim();
        const errorDiv = document.getElementById("errorRegistro");

        if (!nombre || !apellido || !fechaNacimiento || !email || !password) {
            errorDiv.textContent = "Completá todos los campos obligatorios";
            errorDiv.style.display = "block";
            return;
        }

        if (password !== confirmarPassword) {
            errorDiv.textContent = "Las contraseñas no coinciden";
            errorDiv.style.display = "block";
            return;
        }

        try {
            const res = await fetch(`${API}/usuarios/registro`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre, apellido, email, password, fechaNacimiento, dni, telefono })
            });

            const data = await res.json();

            if (!res.ok) {
                errorDiv.textContent = data.error;
                errorDiv.style.display = "block";
                return;
            }

            window.location.href = "login.html";

        } catch (error) {
            errorDiv.textContent = "Error de conexión con el servidor";
            errorDiv.style.display = "block";
        }
    });
}

/* ─── DETALLE APUESTA ─── */
async function iniciarApuesta() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        window.location.href = "index.html";
        return;
    }

    try {
        const res = await fetch(`${API}/apuestas/${id}`);
        const apuesta = await res.json();

        document.getElementById("apuestaTitulo").textContent = apuesta.titulo;
        document.querySelector(".apuesta-datos").innerHTML = `
            <span>📅 Fecha evento: <strong>${formatearFecha(apuesta.fechaEvento)}</strong></span>
            <span>⏰ Cierra: <strong>${formatearFecha(apuesta.fechaLimite)}</strong></span>
        `;

        const lista = document.getElementById("pronosticosList");
        lista.innerHTML = "";
        apuesta.pronosticos.forEach(function(p) {
            const div = document.createElement("div");
            div.classList.add("pronostico-opcion");
            div.innerHTML = `
                <div class="pronostico-info">
                    <p class="pronostico-descripcion">${p.descripcion}</p>
                </div>
                <div class="pronostico-dividendo">
                    <span class="dividendo">${p.dividendo}x</span>
                </div>
            `;
            div.addEventListener("click", function() {
                seleccionarPronostico(div, p.id, p.dividendo);
            });
            lista.appendChild(div);
        });

    } catch (error) {
        console.error("Error cargando apuesta:", error);
    }

    const montoInput = document.getElementById("montoApuesta");
    if (montoInput) {
        montoInput.addEventListener("input", function() {
            const pronostico = document.getElementById("pronosticoSeleccionado").value;
            if (pronostico) {
                const dividendo = document.querySelector(".pronostico-opcion.seleccionado .dividendo").textContent;
                actualizarResumen(pronostico, dividendo);
            }
        });
    }

    const btnApostar = document.getElementById("btnApostar");
    if (btnApostar) {
        btnApostar.addEventListener("click", async function() {
            if (!usuarioActual) {
                window.location.href = "login.html";
                return;
            }

            const idPronostico = btnApostar.dataset.idPronostico;
            const monto = parseFloat(document.getElementById("montoApuesta").value);
            const errorDiv = document.getElementById("errorApuesta");

            if (!idPronostico) {
                errorDiv.textContent = "Seleccioná un pronóstico";
                errorDiv.style.display = "block";
                return;
            }

            if (!monto || monto <= 0 || monto > 100000) {
                errorDiv.textContent = "El monto debe ser entre $1 y $100.000";
                errorDiv.style.display = "block";
                return;
            }

            try {
                const res = await fetch(`${API}/pronosticos/apostar`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        idUsuario: usuarioActual.id,
                        idPronostico: idPronostico,
                        idApuesta: id,
                        monto: monto
                    })
                });

                const data = await res.json();

                if (!res.ok) {
                    errorDiv.textContent = data.error;
                    errorDiv.style.display = "block";
                    return;
                }

                alert("¡Apuesta realizada con éxito!");
                window.location.href = "index.html";

            } catch (error) {
                errorDiv.textContent = "Error de conexión con el servidor";
                errorDiv.style.display = "block";
            }
        });
    }
}

function seleccionarPronostico(elemento, id, dividendo) {
    document.querySelectorAll(".pronostico-opcion").forEach(function(el) {
        el.classList.remove("seleccionado");
    });

    elemento.classList.add("seleccionado");

    const descripcion = elemento.querySelector(".pronostico-descripcion").textContent;
    document.getElementById("pronosticoSeleccionado").value = descripcion;
    document.getElementById("btnApostar").dataset.idPronostico = id;

    actualizarResumen(descripcion, dividendo + "x");
}

function actualizarResumen(pronostico, dividendo) {
    const monto = parseFloat(document.getElementById("montoApuesta").value) || 0;
    const divNum = parseFloat(dividendo);
    const ganancia = monto * divNum;

    document.getElementById("resumenPronostico").textContent = pronostico;
    document.getElementById("resumenMonto").textContent = "$" + monto.toLocaleString();
    document.getElementById("resumenDividendo").textContent = dividendo;
    document.getElementById("resumenGanancia").textContent = "$" + ganancia.toLocaleString();
    document.getElementById("resumenApuesta").style.display = "block";
}

/* ─── ADMIN ─── */
async function iniciarAdmin() {
    if (!usuarioActual || usuarioActual.rol !== "admin") {
        window.location.href = "login.html";
        return;
    }

    await cargarApuestasAdmin();
    await cargarUsuariosAdmin();
    iniciarCrearApuesta();
}

async function cargarApuestasAdmin() {
    try {
        const resV = await fetch(`${API}/apuestas/vigentes`);
        const vigentes = await resV.json();

        const contenedorVigentes = document.getElementById("apuestasVigentes");
        contenedorVigentes.innerHTML = "<h2>Apuestas Vigentes</h2>";

        vigentes.forEach(function(apuesta) {
            const card = document.createElement("div");
            card.classList.add("apuesta-card", "admin-card");
            card.innerHTML = `
                <div class="apuesta-estado vigente">Vigente</div>
                <h3>${apuesta.titulo}</h3>
                <div class="apuesta-datos">
                    <span>📅 ${formatearFecha(apuesta.fechaEvento)}</span>
                    <span>⏰ Cierra: ${formatearFecha(apuesta.fechaLimite)}</span>
                </div>
                <div class="admin-acciones">
                    <button class="btn btn-warning btn-small" onclick="destacarApuesta(${apuesta.id})">⭐ Destacar</button>
                    <button class="btn btn-danger btn-small" onclick="cerrarApuesta(${apuesta.id})">🔒 Cerrar</button>
                </div>
            `;
            contenedorVigentes.appendChild(card);
        });

        // Cargar pendientes
        const resP = await fetch(`${API}/apuestas/vigentes`);

    } catch (error) {
        console.error("Error cargando apuestas admin:", error);
    }
}

async function cargarUsuariosAdmin() {
    try {
        const res = await fetch(`${API}/usuarios`);
        const usuarios = await res.json();

        const tbody = document.querySelector(".tabla-usuarios tbody");
        tbody.innerHTML = "";

        usuarios.forEach(function(u) {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${u.nombre} ${u.apellido}</td>
                <td>${u.email}</td>
                <td>${formatearFecha(u.fechaNacimiento)}</td>
                <td><span class="badge ${u.rol}">${u.rol}</span></td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error cargando usuarios:", error);
    }
}

function iniciarCrearApuesta() {
    const btnAgregarPronostico = document.getElementById("btnAgregarPronostico");
    if (btnAgregarPronostico) {
        btnAgregarPronostico.addEventListener("click", function() {
            const container = document.getElementById("pronosticosContainer");
            const cantidad = container.querySelectorAll(".pronostico-input").length + 1;

            if (cantidad > 10) {
                alert("Máximo 10 pronósticos");
                return;
            }

            const div = document.createElement("div");
            div.classList.add("pronostico-input");
            div.innerHTML = `<input type="text" placeholder="Pronóstico ${cantidad}" class="pronostico-desc">`;
            container.appendChild(div);
        });
    }

    const btnCrearApuesta = document.getElementById("btnCrearApuesta");
    if (btnCrearApuesta) {
        btnCrearApuesta.addEventListener("click", async function() {
            const titulo = document.getElementById("nuevoTitulo").value.trim();
            const fechaEvento = document.getElementById("nuevaFechaEvento").value;
            const fechaLimite = document.getElementById("nuevaFechaLimite").value;
            const pronosticos = Array.from(document.querySelectorAll(".pronostico-desc"))
                .map(p => p.value.trim())
                .filter(p => p !== "");

            if (!titulo || !fechaEvento || !fechaLimite || pronosticos.length < 2) {
                alert("Completá todos los campos y agregá al menos 2 pronósticos");
                return;
            }

            try {
                const res = await fetch(`${API}/apuestas`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ titulo, fechaEvento, fechaLimite, pronosticos })
                });

                const data = await res.json();
                alert(data.mensaje);
                window.location.reload();

            } catch (error) {
                alert("Error de conexión con el servidor");
            }
        });
    }
}

async function destacarApuesta(id) {
    try {
        await fetch(`${API}/apuestas/${id}/destacar`, { method: "PUT" });
        alert("Apuesta destacada");
        window.location.reload();
    } catch (error) {
        alert("Error al destacar");
    }
}

async function cerrarApuesta(id) {
    try {
        await fetch(`${API}/apuestas/${id}/cerrar`, { method: "PUT" });
        alert("Apuesta cerrada");
        window.location.reload();
    } catch (error) {
        alert("Error al cerrar");
    }
}

/* ─── TABS ADMIN ─── */
function mostrarTab(tabId) {
    document.querySelectorAll(".tab-contenido").forEach(function(tab) {
        tab.style.display = "none";
    });

    document.querySelectorAll(".tab").forEach(function(tab) {
        tab.classList.remove("activo");
    });

    document.getElementById(tabId).style.display = "block";
    event.target.classList.add("activo");
}

/* ─── HELPERS ─── */
function verApuesta(id) {
    window.location.href = `apuesta.html?id=${id}`;
}

function formatearFecha(fecha) {
    if (!fecha) return "-";
    const d = new Date(fecha);
    return d.toLocaleDateString("es-AR");
}

function cerrarSesion() {
    localStorage.removeItem("usuarioActual");
    window.location.href = "index.html";
}