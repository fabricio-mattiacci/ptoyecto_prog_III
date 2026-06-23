const API = "http://localhost:3000/api";

let usuarioActual = JSON.parse(localStorage.getItem("usuarioActual")) || null;

async function fetchApuestasCerradas() {
    let res = await fetch(`${API}/apuestas/cerradas`);
    if (!res.ok) {
        res = await fetch(`${API}/apuestas/finalizadas`);
    }
    if (!res.ok) {
        throw new Error("No se pudieron cargar las apuestas cerradas");
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

document.addEventListener("DOMContentLoaded", function() {
    actualizarHeader();
    if (redirigirSiYaLogueado()) return;

    document.body.addEventListener("click", function(event) {
        const btnApuesta = event.target.closest("[data-apuesta-id]");
        if (btnApuesta && btnApuesta.dataset.apuestaId) {
            event.preventDefault();
            verApuesta(btnApuesta.dataset.apuestaId);
        }
    });

    const pagina = window.location.pathname.toLowerCase();

    if (esPaginaInicio(pagina)) {
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

function esPaginaInicio(pagina) {
    return pagina === "/" || pagina.endsWith("/index.html") || pagina.endsWith("/index");
}

function obtenerIdApuestaDesdeUrl() {
    const params = new URLSearchParams(window.location.search);
    const idUrl = params.get("id");
    if (idUrl) return idUrl;

    if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const idHash = hashParams.get("id");
        if (idHash) return idHash;
    }

    return sessionStorage.getItem("apuestaId");
}

function mostrarErrorApuestaPagina(mensaje) {
    const titulo = document.getElementById("apuestaTitulo");
    const contenido = document.querySelector(".apuesta-detalle-contenido");
    if (titulo) titulo.textContent = "Apuesta no disponible";
    if (contenido) {
        contenido.innerHTML = `<p class="error-mensaje">${mensaje}</p>`;
    }
}

/* ─── HEADER ─── */
function actualizarHeader() {
    usuarioActual = JSON.parse(localStorage.getItem("usuarioActual")) || null;
    const nav = document.querySelector(".header-nav");
    if (!nav) return;

    if (usuarioActual) {
        const nombreCompleto = usuarioActual.nombre + (usuarioActual.apellido ? " " + usuarioActual.apellido : "");
        const btnAdmin = usuarioActual.rol === "admin"
            ? `<button class="btn btn-outline" onclick="window.location.href='admin.html'">Admin</button>`
            : "";

        nav.innerHTML = `
            <span class="header-usuario">👤 ${nombreCompleto}</span>
            ${btnAdmin}
            <button class="btn btn-outline" id="btnLogout">Cerrar Sesión</button>
        `;

        document.getElementById("btnLogout").addEventListener("click", cerrarSesion);
    } else {
        nav.innerHTML = `
            <button class="btn btn-outline" onclick="window.location.href='login.html'">Iniciar Sesión</button>
            <button class="btn btn-primary" onclick="window.location.href='registro.html'">Registrarse</button>
        `;
    }
}

function redirigirSiYaLogueado() {
    if (!usuarioActual) return false;

    const pagina = window.location.pathname;
    if (pagina.includes("login") || pagina.includes("registro")) {
        window.location.href = usuarioActual.rol === "admin" ? "admin.html" : "index.html";
        return true;
    }
    return false;
}

/* ─── INDEX ─── */
async function iniciarIndex() {
    await cargarApuestasVigentes();
    await cargarApuestasCerradas();
    await cargarDestacada();
}

async function cargarApuestasVigentes() {
    try {
        const res = await fetch(`${API}/apuestas/vigentes`);
        const apuestas = await res.json();

        const contenedor = document.getElementById("apuestasVigentes");
        contenedor.innerHTML = "";

        if (!Array.isArray(apuestas) || apuestas.length === 0) {
            contenedor.innerHTML = "<p class='sin-apuestas'>No hay apuestas vigentes por el momento.</p>";
            return;
        }

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
                    <span>💰 Pozo: ${formatearMonto(detalle.pozoBruto)}</span>
                </div>
                <div class="apuesta-pronosticos">
                    ${htmlPronosticos(detalle.pronosticos)}
                </div>
                <button type="button" class="btn btn-primary" data-apuesta-id="${detalle.id}">Ver apuesta</button>
            `;
            contenedor.appendChild(card);
        }
    } catch (error) {
        console.error("Error cargando apuestas vigentes:", error);
    }
}

async function cargarApuestasCerradas() {
    const contenedor = document.getElementById("apuestasCerradas");
    if (!contenedor) return;

    try {
        const apuestas = await fetchApuestasCerradas();
        contenedor.innerHTML = "";

        if (apuestas.length === 0) {
            contenedor.innerHTML = "<p class='sin-apuestas'>No hay apuestas cerradas por el momento.</p>";
            return;
        }

        for (const apuesta of apuestas) {
            const resP = await fetch(`${API}/apuestas/${apuesta.id}`);
            const detalle = await resP.json();

            const card = document.createElement("div");
            card.classList.add("apuesta-card", "finalizada");
            card.innerHTML = `
                <div class="apuesta-estado cerrada">Cerrada</div>
                <h3>${detalle.titulo}</h3>
                <div class="apuesta-datos">
                    <span>📅 ${formatearFecha(detalle.fechaEvento)}</span>
                    <span>⏰ Cerró: ${formatearFecha(detalle.fechaLimite)}</span>
                    <span>💰 Pozo: ${formatearMonto(detalle.pozoBruto)}</span>
                </div>
                <div class="apuesta-pronosticos">
                    ${htmlPronosticos(detalle.pronosticos)}
                </div>
                <button type="button" class="btn btn-outline" data-apuesta-id="${detalle.id}">Ver detalle</button>
            `;
            contenedor.appendChild(card);
        }
    } catch (error) {
        console.error("Error cargando apuestas cerradas:", error);
        contenedor.innerHTML = "<p class='sin-apuestas'>No se pudieron cargar las apuestas cerradas.</p>";
    }
}

async function cargarDestacada() {
    const seccion = document.querySelector(".destacada");
    if (!seccion) return;

    try {
        const res = await fetch(`${API}/apuestas/vigentes`);
        const apuestas = await res.json();
        const destacada = apuestas.find(a => a.destacada);

        if (!destacada) {
            seccion.style.display = "none";
            return;
        }

        seccion.style.display = "block";

        const resP = await fetch(`${API}/apuestas/${destacada.id}`);
        const detalle = await resP.json();

        document.querySelector(".destacada-titulo").textContent = detalle.titulo;
        document.querySelector(".destacada-info").innerHTML = `
            <span>📅 Fecha evento: ${formatearFecha(detalle.fechaEvento)}</span>
            <span>⏰ Cierra: ${formatearFecha(detalle.fechaLimite)}</span>
            <span>💰 Pozo: ${formatearMonto(detalle.pozoBruto)}</span>
        `;
        document.querySelector(".destacada-pronosticos").innerHTML = detalle.pronosticos.map(p => `
            <div class="pronostico-card">
                <p>${p.descripcion}</p>
                <span class="monto-apostado">${formatearMonto(p.totalApostado)} apostado</span>
                <span class="dividendo">${formatearDividendo(p.dividendo)}x</span>
            </div>
        `).join("");

        const btnDestacada = document.getElementById("btnApostarDestacada");
        if (btnDestacada) {
            btnDestacada.dataset.apuestaId = detalle.id;
        }
    } catch (error) {
        console.error("Error cargando destacada:", error);
        seccion.style.display = "none";
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
            usuarioActual = data;

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
    const id = obtenerIdApuestaDesdeUrl();

    if (!id) {
        mostrarErrorApuestaPagina("No se encontró la apuesta seleccionada.");
        return;
    }

    sessionStorage.setItem("apuestaId", String(id));

    try {
        const res = await fetch(`${API}/apuestas/${id}`);
        const apuesta = await res.json();

        if (!res.ok || apuesta.error) {
            mostrarErrorApuestaPagina(apuesta.error || "No se pudo cargar la apuesta.");
            return;
        }

        if (apuesta.estado === "cerrada") {
            document.querySelector(".apuesta-form-seccion").innerHTML =
                "<p class='error-mensaje'>Esta apuesta ya está cerrada. No se pueden realizar apuestas.</p>";
        }

        document.getElementById("apuestaTitulo").textContent = apuesta.titulo;
        document.querySelector(".apuesta-datos").innerHTML = `
            <span>📅 Fecha evento: <strong>${formatearFecha(apuesta.fechaEvento)}</strong></span>
            <span>⏰ Cierra: <strong>${formatearFecha(apuesta.fechaLimite)}</strong></span>
            <span>💰 Pozo total: <strong>${formatearMonto(apuesta.pozoBruto)}</strong></span>
        `;

        const lista = document.getElementById("pronosticosList");
        lista.innerHTML = "";
        apuesta.pronosticos.forEach(function(p) {
            const div = document.createElement("div");
            div.classList.add("pronostico-opcion");
            div.innerHTML = `
                <div class="pronostico-info">
                    <p class="pronostico-descripcion">${p.descripcion}</p>
                    <p class="pronostico-apostadores">${formatearMonto(p.totalApostado)} apostado</p>
                </div>
                <div class="pronostico-dividendo">
                    <span class="dividendo">${formatearDividendo(p.dividendo)}x</span>
                </div>
            `;
            div.addEventListener("click", function() {
                seleccionarPronostico(div, p.id, p.dividendo);
            });
            lista.appendChild(div);
        });

    } catch (error) {
        console.error("Error cargando apuesta:", error);
        mostrarErrorApuestaPagina("Error de conexión con el servidor.");
        return;
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
                    headers: headersAuth(),
                    body: JSON.stringify({
                        idUsuario: usuarioActual.id,
                        idPronostico: idPronostico,
                        idApuesta: id,
                        monto: monto
                    })
                });

                const data = await res.json();

                if (!res.ok) {
                    errorDiv.textContent = data.error || "No se pudo realizar la apuesta";
                    errorDiv.style.display = "block";
                    return;
                }

                alert("¡Apuesta realizada con éxito!");
                window.location.href = `apuesta.html?id=${id}`;

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
    await cargarApuestasCerradasAdmin();
    await cargarUsuariosAdmin();
    iniciarCrearApuesta();
}

async function cargarApuestasAdmin() {
    try {
        const resV = await fetch(`${API}/apuestas/vigentes`);
        const vigentes = await resV.json();

        const grid = document.getElementById("gridApuestasAdmin");
        grid.innerHTML = "";

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
            grid.appendChild(card);
        });

    } catch (error) {
        console.error("Error cargando apuestas admin:", error);
    }
}

async function cargarApuestasCerradasAdmin() {
    const grid = document.getElementById("gridApuestasCerradas");
    if (!grid) return;

    try {
        const cerradas = await fetchApuestasCerradas();
        grid.innerHTML = "";

        if (cerradas.length === 0) {
            grid.innerHTML = "<p class='sin-apuestas'>No hay apuestas cerradas.</p>";
            return;
        }

        for (const apuesta of cerradas) {
            const resP = await fetch(`${API}/apuestas/${apuesta.id}`);
            const detalle = await resP.json();

            const card = document.createElement("div");
            card.classList.add("apuesta-card", "admin-card", "finalizada");
            card.innerHTML = `
                <div class="apuesta-estado cerrada">Cerrada</div>
                <h3>${detalle.titulo}</h3>
                <div class="apuesta-datos">
                    <span>📅 ${formatearFecha(detalle.fechaEvento)}</span>
                    <span>⏰ Cerró: ${formatearFecha(detalle.fechaLimite)}</span>
                    <span>💰 Pozo: ${formatearMonto(detalle.pozoBruto)}</span>
                </div>
                <div class="apuesta-pronosticos">
                    ${htmlPronosticos(detalle.pronosticos)}
                </div>
            `;
            grid.appendChild(card);
        }

    } catch (error) {
        console.error("Error cargando apuestas cerradas admin:", error);
        grid.innerHTML = "<p class='sin-apuestas'>No se pudieron cargar las apuestas cerradas.</p>";
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
                    headers: headersAdmin(),
                    body: JSON.stringify({ titulo, fechaEvento, fechaLimite, pronosticos })
                });

                const data = await res.json();

                if (!res.ok) {
                    alert(data.error || "Error al crear la apuesta");
                    return;
                }

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
        const res = await fetch(`${API}/apuestas/${id}/destacar`, {
            method: "PUT",
            headers: headersAdmin()
        });
        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Error al destacar");
            return;
        }

        alert(data.mensaje || "Apuesta destacada");
        await cargarApuestasAdmin();
    } catch (error) {
        alert("Error de conexión con el servidor");
    }
}

async function cerrarApuesta(id) {
    if (!confirm("¿Cerrar esta apuesta? Ya no se podrán hacer apuestas nuevas.")) {
        return;
    }

    try {
        const res = await fetch(`${API}/apuestas/${id}/cerrar`, {
            method: "PUT",
            headers: headersAdmin()
        });
        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Error al cerrar");
            return;
        }

        alert(data.mensaje || "Apuesta cerrada");
        await cargarApuestasAdmin();
        await cargarApuestasCerradasAdmin();
    } catch (error) {
        alert("Error de conexión con el servidor");
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

    if (tabId === "apuestasCerradas") {
        cargarApuestasCerradasAdmin();
    } else if (tabId === "apuestasVigentes") {
        cargarApuestasAdmin();
    }
}

/* ─── HELPERS ─── */
function headersAdmin() {
    return {
        "Content-Type": "application/json",
        "rol": usuarioActual ? usuarioActual.rol : ""
    };
}

function headersAuth() {
    return {
        "Content-Type": "application/json",
        "usuario": usuarioActual ? String(usuarioActual.id) : ""
    };
}

function verApuesta(id) {
    if (!id) return;
    sessionStorage.setItem("apuestaId", String(id));
    window.location.href = `apuesta.html?id=${encodeURIComponent(id)}`;
}

window.verApuesta = verApuesta;

function formatearFecha(fecha) {
    if (!fecha) return "-";
    const d = new Date(fecha);
    return d.toLocaleDateString("es-AR");
}

function formatearMonto(monto) {
    return "$" + Number(monto || 0).toLocaleString("es-AR");
}

function formatearDividendo(dividendo) {
    const valor = Number(dividendo || 0);
    return valor > 0 ? valor.toFixed(2) : "0";
}

function htmlPronosticos(pronosticos) {
    return pronosticos.map(function(p) {
        return `
            <div class="pronostico">
                <span>${p.descripcion}</span>
                <div class="pronostico-stats">
                    <span class="monto-apostado">${formatearMonto(p.totalApostado)}</span>
                    <span class="dividendo">${formatearDividendo(p.dividendo)}x</span>
                </div>
            </div>
        `;
    }).join("");
}

function cerrarSesion() {
    localStorage.removeItem("usuarioActual");
    usuarioActual = null;
    window.location.href = "index.html";
}