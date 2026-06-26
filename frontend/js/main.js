const API = "http://localhost:3000/api";

let usuarioActual = JSON.parse(localStorage.getItem("usuarioActual")) || null;
let apuestaCerrarNumero = null;
let ocurrenciaGanadoraSeleccionada = null;
let pollingDatosId = null;

document.addEventListener("DOMContentLoaded", function() {
    actualizarHeader();
    iniciarEnlacesNavegacion();
    if (redirigirSiYaLogueado()) return;

    document.body.addEventListener("click", function(event) {
        const btnApuesta = event.target.closest("[data-apuesta]");
        if (btnApuesta && btnApuesta.dataset.apuesta) {
            event.preventDefault();
            verApuesta(btnApuesta.dataset.apuesta);
        }
    });

    const pagina = window.location.pathname.toLowerCase();

    if (esPaginaInicio(pagina)) {
        iniciarIndex();
    } else if (pagina.includes("login")) {
        iniciarLogin();
    } else if (pagina.includes("apuesta")) {
        iniciarApuesta();
    } else if (pagina.includes("admin")) {
        iniciarAdmin();
    }
});

function iniciarEnlacesNavegacion() {
    document.querySelectorAll(".js-link-home").forEach(function(el) {
        el.addEventListener("click", function() {
            window.location.href = "index.html";
        });
    });

    const btnVolver = document.getElementById("btnVolver");
    if (btnVolver) {
        btnVolver.addEventListener("click", function() {
            window.location.href = "index.html";
        });
    }
}

function esPaginaInicio(pagina) {
    return pagina === "/" || pagina.endsWith("/index.html") || pagina.endsWith("/index");
}

function obtenerApuestaDesdeUrl() {
    const params = new URLSearchParams(window.location.search);
    const apuestaUrl = params.get("apuesta");
    if (apuestaUrl) return apuestaUrl;

    if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const apuestaHash = hashParams.get("apuesta");
        if (apuestaHash) return apuestaHash;
    }

    return sessionStorage.getItem("apuestaSeleccionada");
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
        nav.innerHTML = "";

        const spanUsuario = document.createElement("span");
        spanUsuario.className = "header-usuario";
        spanUsuario.textContent = "👤 " + nombreCompleto;
        nav.appendChild(spanUsuario);

        if (usuarioActual.rol === "admin") {
            const btnAdmin = document.createElement("button");
            btnAdmin.className = "btn btn-outline";
            btnAdmin.textContent = "Admin";
            btnAdmin.addEventListener("click", function() {
                window.location.href = "admin.html";
            });
            nav.appendChild(btnAdmin);
        }

        const btnLogout = document.createElement("button");
        btnLogout.className = "btn btn-outline";
        btnLogout.id = "btnLogout";
        btnLogout.textContent = "Cerrar Sesión";
        btnLogout.addEventListener("click", cerrarSesion);
        nav.appendChild(btnLogout);
    } else {
        nav.innerHTML = "";
        const btnLogin = document.createElement("button");
        btnLogin.className = "btn btn-primary";
        btnLogin.textContent = "Iniciar Sesión";
        btnLogin.addEventListener("click", function() {
            window.location.href = "login.html";
        });
        nav.appendChild(btnLogin);
    }
}

function redirigirSiYaLogueado() {
    if (!usuarioActual) return false;

    const pagina = window.location.pathname;
    if (pagina.includes("login")) {
        window.location.href = usuarioActual.rol === "admin" ? "admin.html" : "index.html";
        return true;
    }
    return false;
}

/* ─── INDEX ─── */
async function iniciarIndex() {
    await cargarDatos();
    await renderizarIndex();

    if (pollingDatosId) clearInterval(pollingDatosId);
    pollingDatosId = iniciarPollingDatos(renderizarIndex);
}

async function renderizarIndex() {
    await cargarApuestasVigentes();
    await cargarApuestasCerradas();
    await cargarDestacada();
}

async function cargarApuestasVigentes() {
    try {
        const apuestas = await obtenerApuestasVigentes();

        const contenedor = document.getElementById("apuestasVigentes");
        contenedor.innerHTML = "";

        if (!Array.isArray(apuestas) || apuestas.length === 0) {
            contenedor.innerHTML = "<p class='sin-apuestas'>No hay apuestas vigentes por el momento.</p>";
            return;
        }

        for (const apuesta of apuestas) {
            const detalle = await obtenerApuestaPorNumero(apuesta.apuesta);

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
                <button type="button" class="btn btn-primary" data-apuesta="${detalle.apuesta}">Ver apuesta</button>
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
        const apuestas = await obtenerApuestasCerradas();
        contenedor.innerHTML = "";

        if (apuestas.length === 0) {
            contenedor.innerHTML = "<p class='sin-apuestas'>No hay apuestas cerradas por el momento.</p>";
            return;
        }

        for (const apuesta of apuestas) {
            const detalle = await obtenerApuestaPorNumero(apuesta.apuesta);

            const ganador = obtenerGanadorDesdeDetalle(detalle);

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
                ${htmlResultadoGanador(ganador)}
                <div class="apuesta-pronosticos">
                    ${htmlPronosticos(detalle.pronosticos, true, ocurrenciaGanadoraDesdeDetalle(detalle))}
                </div>
                ${htmlApuestasPersonas(detalle.apuestasPersonas)}
                <button type="button" class="btn btn-outline" data-apuesta="${detalle.apuesta}">Ver detalle</button>
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
        const apuestas = await obtenerApuestasVigentes();
        const destacada = apuestas.find(function(a) { return a.destacada; });

        if (!destacada) {
            seccion.style.display = "none";
            return;
        }

        seccion.style.display = "block";

        const detalle = await obtenerApuestaPorNumero(destacada.apuesta);

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
            btnDestacada.dataset.apuesta = detalle.apuesta;
        }
    } catch (error) {
        console.error("Error cargando destacada:", error);
        seccion.style.display = "none";
    }
}

/* ─── LOGIN ─── */
function seleccionarPerfilRapido(btn) {
    document.getElementById("email").value = btn.dataset.email || "";
    document.getElementById("password").value = btn.dataset.password || "";

    const errorDiv = document.getElementById("errorLogin");
    if (errorDiv) errorDiv.style.display = "none";

    document.querySelectorAll(".btn-perfil").forEach(function(b) {
        b.classList.remove("activo");
    });
    btn.classList.add("activo");
}

async function cargarPerfilesRapidos() {
    const contenedor = document.getElementById("perfilesBotones");
    const seccion = document.querySelector(".perfiles-rapidos");
    if (!contenedor) return;

    try {
        await cargarDatos();
        const usuarios = await obtenerUsuarios();

        if (!Array.isArray(usuarios) || usuarios.length === 0) {
            if (seccion) seccion.style.display = "none";
            return;
        }

        contenedor.innerHTML = "";

        usuarios.forEach(function(usuario) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "btn btn-outline btn-perfil";
            btn.dataset.email = usuario.email;
            btn.dataset.password = usuario.password || "";

            const etiqueta = usuario.rol === "admin"
                ? `${usuario.nombre} (Admin)`
                : usuario.nombre;

            btn.textContent = `👤 ${etiqueta}`;
            btn.addEventListener("click", function() {
                seleccionarPerfilRapido(btn);
            });
            contenedor.appendChild(btn);
        });

    } catch (error) {
        console.error("Error cargando perfiles rápidos:", error);
        if (seccion) seccion.style.display = "none";
    }
}

function iniciarLogin() {
    const btnLogin = document.getElementById("btnLogin");
    if (!btnLogin) return;

    cargarPerfilesRapidos();

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

/* ─── DETALLE APUESTA ─── */
async function iniciarApuesta() {
    const numeroApuesta = obtenerApuestaDesdeUrl();

    if (!numeroApuesta) {
        mostrarErrorApuestaPagina("No se encontró la apuesta seleccionada.");
        return;
    }

    sessionStorage.setItem("apuestaSeleccionada", String(numeroApuesta));

    let soloLectura = false;

    try {
        await cargarDatos();
        const apuesta = await obtenerApuestaPorNumero(numeroApuesta);

        if (!apuesta) {
            mostrarErrorApuestaPagina("No se pudo cargar la apuesta.");
            return;
        }

        if (apuesta.estado === "cerrada" || apuestaVencida(apuesta.fechaLimite)) {
            document.querySelector(".apuesta-form-seccion").innerHTML =
                "<p class='error-mensaje'>Esta apuesta ya está cerrada o venció el plazo. No se pueden realizar apuestas.</p>";
            soloLectura = true;
        }

        document.getElementById("apuestaTitulo").textContent = apuesta.titulo;
        const ganador = obtenerGanadorDesdeDetalle(apuesta);
        document.querySelector(".apuesta-datos").innerHTML = `
            <span>📅 Fecha evento: <strong>${formatearFecha(apuesta.fechaEvento)}</strong></span>
            <span>⏰ Cierra: <strong>${formatearFecha(apuesta.fechaLimite)}</strong></span>
            <span>💰 Pozo total: <strong>${formatearMonto(apuesta.pozoBruto)}</strong></span>
            ${ganador ? `<span>🏆 Ganador: <strong>${ganador.descripcion}</strong></span>` : ""}
        `;

        const lista = document.getElementById("pronosticosList");
        lista.innerHTML = "";

        if (apuesta.estado === "cerrada") {
            const tituloPronosticos = document.querySelector(".pronosticos-seccion h3");
            if (tituloPronosticos) tituloPronosticos.textContent = "Resultado de la apuesta";
            lista.innerHTML = htmlPronosticos(apuesta.pronosticos, true, ocurrenciaGanadoraDesdeDetalle(apuesta));
            const resultadoPersonas = document.getElementById("resultadoPersonas");
            if (resultadoPersonas) {
                resultadoPersonas.innerHTML = htmlApuestasPersonas(apuesta.apuestasPersonas);
            }
        } else {
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
                    seleccionarPronostico(div, p.ocurrencia, p.dividendo);
                });
                lista.appendChild(div);
            });
        }

    } catch (error) {
        console.error("Error cargando apuesta:", error);
        mostrarErrorApuestaPagina("Error de conexión con el servidor.");
        return;
    }

    if (soloLectura) return;

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

            const ocurrencia = btnApostar.dataset.ocurrencia;
            const monto = parseFloat(document.getElementById("montoApuesta").value);
            const errorDiv = document.getElementById("errorApuesta");

            if (!ocurrencia) {
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
                        persona: usuarioActual.persona,
                        ocurrencia: ocurrencia,
                        apuesta: numeroApuesta,
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
                await cargarDatos();
                window.location.href = `apuesta.html?apuesta=${numeroApuesta}`;

            } catch (error) {
                errorDiv.textContent = "Error de conexión con el servidor";
                errorDiv.style.display = "block";
            }
        });
    }
}

function seleccionarPronostico(elemento, ocurrencia, dividendo) {
    document.querySelectorAll(".pronostico-opcion").forEach(function(el) {
        el.classList.remove("seleccionado");
    });

    elemento.classList.add("seleccionado");

    const descripcion = elemento.querySelector(".pronostico-descripcion").textContent;
    document.getElementById("pronosticoSeleccionado").value = descripcion;
    document.getElementById("btnApostar").dataset.ocurrencia = ocurrencia;

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

    await cargarDatos();
    await cargarApuestasAdmin();
    await cargarApuestasCerradasAdmin();
    await cargarUsuariosAdmin();
    iniciarCrearApuesta();
    iniciarModalCerrarApuesta();
    iniciarTabsAdmin();
    iniciarDelegacionAdmin();

    if (pollingDatosId) clearInterval(pollingDatosId);
    pollingDatosId = iniciarPollingDatos(async function() {
        await cargarApuestasAdmin();
        await cargarApuestasCerradasAdmin();
        await cargarUsuariosAdmin();
    });
}

function iniciarTabsAdmin() {
    document.querySelectorAll(".admin-tabs .tab").forEach(function(tab) {
        tab.addEventListener("click", function() {
            mostrarTab(tab.dataset.tab, tab);
        });
    });
}

function iniciarDelegacionAdmin() {
    const gridVigentes = document.getElementById("gridApuestasAdmin");
    const gridCerradas = document.getElementById("gridApuestasCerradas");

    if (gridVigentes) {
        gridVigentes.addEventListener("click", manejarAccionAdmin);
    }
    if (gridCerradas) {
        gridCerradas.addEventListener("click", manejarAccionAdmin);
    }
}

function manejarAccionAdmin(event) {
    const btn = event.target.closest("[data-admin-action]");
    if (!btn) return;

    const numeroApuesta = btn.dataset.apuesta;
    const accion = btn.dataset.adminAction;

    if (accion === "destacar") destacarApuesta(numeroApuesta);
    else if (accion === "quitar-destacada") quitarDestacadaApuesta(numeroApuesta);
    else if (accion === "cerrar") cerrarApuesta(numeroApuesta);
}

function iniciarModalCerrarApuesta() {
    const modal = document.getElementById("modalCerrarApuesta");
    const btnCancelar = document.getElementById("btnModalCancelar");
    const btnConfirmar = document.getElementById("btnModalConfirmarCerrar");

    if (!modal) return;

    btnCancelar.addEventListener("click", ocultarModalCerrarApuesta);
    btnConfirmar.addEventListener("click", confirmarCierreApuesta);

    modal.addEventListener("click", function(event) {
        if (event.target === modal) ocultarModalCerrarApuesta();
    });
}

function ocultarModalCerrarApuesta() {
    const modal = document.getElementById("modalCerrarApuesta");
    if (modal) modal.style.display = "none";
    apuestaCerrarNumero = null;
    ocurrenciaGanadoraSeleccionada = null;
}

function seleccionarOcurrenciaGanadora(ocurrencia, elemento) {
    ocurrenciaGanadoraSeleccionada = ocurrencia;
    document.querySelectorAll(".modal-opcion").forEach(function(op) {
        op.classList.remove("seleccionada");
    });
    elemento.classList.add("seleccionada");
    const btnConfirmar = document.getElementById("btnModalConfirmarCerrar");
    if (btnConfirmar) btnConfirmar.disabled = false;
}

async function mostrarModalCerrarApuesta(numeroApuesta) {
    try {
        const detalle = await obtenerApuestaPorNumero(numeroApuesta);

        if (!detalle || !detalle.pronosticos || detalle.pronosticos.length === 0) {
            alert("No se pudo cargar los pronósticos de la apuesta");
            return;
        }

        apuestaCerrarNumero = numeroApuesta;
        ocurrenciaGanadoraSeleccionada = null;

        document.getElementById("modalCerrarTitulo").textContent = detalle.titulo;

        const contenedor = document.getElementById("modalOpcionesGanador");
        contenedor.innerHTML = "";

        detalle.pronosticos.forEach(function(p) {
            const opcion = document.createElement("label");
            opcion.className = "modal-opcion";
            opcion.innerHTML = `
                <input type="radio" name="ocurrenciaGanadora" value="${p.ocurrencia}">
                <span><strong>${p.descripcion}</strong></span>
            `;
            opcion.addEventListener("click", function() {
                seleccionarOcurrenciaGanadora(p.ocurrencia, opcion);
            });
            contenedor.appendChild(opcion);
        });

        const btnConfirmar = document.getElementById("btnModalConfirmarCerrar");
        if (btnConfirmar) btnConfirmar.disabled = true;

        document.getElementById("modalCerrarApuesta").style.display = "flex";
    } catch (error) {
        alert("Error de conexión con el servidor");
    }
}

async function confirmarCierreApuesta() {
    if (!apuestaCerrarNumero || !ocurrenciaGanadoraSeleccionada) {
        alert("Seleccioná la opción ganadora");
        return;
    }

    try {
        const res = await fetch(`${API}/apuestas/${apuestaCerrarNumero}/cerrar`, {
            method: "PUT",
            headers: headersAdmin(),
            body: JSON.stringify({ ocurrenciaGanadora: ocurrenciaGanadoraSeleccionada })
        });
        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Error al cerrar");
            return;
        }

        ocultarModalCerrarApuesta();
        alert(data.mensaje || "Apuesta cerrada y resultado registrado");
        await cargarDatos();
        await cargarApuestasAdmin();
        await cargarApuestasCerradasAdmin();
    } catch (error) {
        alert("Error de conexión con el servidor");
    }
}

async function cargarApuestasAdmin() {
    try {
        const vigentes = await obtenerApuestasVigentes();

        const grid = document.getElementById("gridApuestasAdmin");
        grid.innerHTML = "";

        const hayDestacada = vigentes.some(function(a) {
            return a.destacada;
        });

        vigentes.forEach(function(apuesta) {
            let btnDestacar = "";

            if (apuesta.destacada) {
                btnDestacar = `<button type="button" class="btn btn-secondary btn-small" data-admin-action="quitar-destacada" data-apuesta="${apuesta.apuesta}">☆ Quitar destacada</button>`;
            } else if (!hayDestacada) {
                btnDestacar = `<button type="button" class="btn btn-warning btn-small" data-admin-action="destacar" data-apuesta="${apuesta.apuesta}">⭐ Destacar</button>`;
            }

            const card = document.createElement("div");
            card.classList.add("apuesta-card", "admin-card");
            card.innerHTML = `
                <div class="apuesta-estado vigente">Vigente</div>
                <h3>${apuesta.titulo}${apuesta.destacada ? " ⭐" : ""}</h3>
                <div class="apuesta-datos">
                    <span>📅 ${formatearFecha(apuesta.fechaEvento)}</span>
                    <span>⏰ Cierra: ${formatearFecha(apuesta.fechaLimite)}</span>
                </div>
                <div class="admin-acciones">
                    ${btnDestacar}
                    <button type="button" class="btn btn-danger btn-small" data-admin-action="cerrar" data-apuesta="${apuesta.apuesta}">🏆 Cerrar y definir resultado</button>
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
        const cerradas = await obtenerApuestasCerradas();
        grid.innerHTML = "";

        if (cerradas.length === 0) {
            grid.innerHTML = "<p class='sin-apuestas'>No hay apuestas cerradas.</p>";
            return;
        }

        for (const apuesta of cerradas) {
            const detalle = await obtenerApuestaPorNumero(apuesta.apuesta);
            const ganador = obtenerGanadorDesdeDetalle(detalle);
            const sinResultado = detalle.estadoDb !== "FIN";

            const card = document.createElement("div");
            card.classList.add("apuesta-card", "admin-card", "finalizada");
            card.innerHTML = `
                <div class="apuesta-estado cerrada">${sinResultado ? "Pendiente de resultado" : "Cerrada"}</div>
                <h3>${detalle.titulo}</h3>
                <div class="apuesta-datos">
                    <span>📅 ${formatearFecha(detalle.fechaEvento)}</span>
                    <span>⏰ Cerró: ${formatearFecha(detalle.fechaLimite)}</span>
                    <span>💰 Pozo: ${formatearMonto(detalle.pozoBruto)}</span>
                </div>
                ${sinResultado ? `<p class="modal-ayuda">El admin debe definir qué opción ganó para registrar GAN/PER.</p>` : htmlResultadoGanador(ganador)}
                <div class="apuesta-pronosticos">
                    ${htmlPronosticos(detalle.pronosticos, !sinResultado, ocurrenciaGanadoraDesdeDetalle(detalle))}
                </div>
                ${sinResultado ? "" : htmlApuestasPersonas(detalle.apuestasPersonas)}
                ${sinResultado ? `<div class="admin-acciones"><button type="button" class="btn btn-danger btn-small" data-admin-action="cerrar" data-apuesta="${detalle.apuesta}">🏆 Definir resultado</button></div>` : ""}
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
        const usuarios = await obtenerUsuarios();

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
                await cargarDatos();
                window.location.reload();

            } catch (error) {
                alert("Error de conexión con el servidor");
            }
        });
    }
}

async function destacarApuesta(numeroApuesta) {
    try {
        const res = await fetch(`${API}/apuestas/${numeroApuesta}/destacar`, {
            method: "PUT",
            headers: headersAdmin()
        });
        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Error al destacar");
            return;
        }

        alert(data.mensaje || "Apuesta destacada");
        await cargarDatos();
        await cargarApuestasAdmin();
    } catch (error) {
        alert("Error de conexión con el servidor");
    }
}

async function quitarDestacadaApuesta(numeroApuesta) {
    try {
        const res = await fetch(`${API}/apuestas/${numeroApuesta}/quitar-destacada`, {
            method: "PUT",
            headers: headersAdmin()
        });
        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Error al quitar destacada");
            return;
        }

        alert(data.mensaje || "Destacada quitada");
        await cargarDatos();
        await cargarApuestasAdmin();
    } catch (error) {
        alert("Error de conexión con el servidor");
    }
}

async function cerrarApuesta(numeroApuesta) {
    await mostrarModalCerrarApuesta(numeroApuesta);
}

/* ─── TABS ADMIN ─── */
function mostrarTab(tabId, tabBtn) {
    document.querySelectorAll(".tab-contenido").forEach(function(tab) {
        tab.style.display = "none";
    });

    document.querySelectorAll(".tab").forEach(function(tab) {
        tab.classList.remove("activo");
    });

    document.getElementById(tabId).style.display = "block";
    if (tabBtn) tabBtn.classList.add("activo");

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
        "usuario": usuarioActual ? String(usuarioActual.persona) : ""
    };
}

function verApuesta(numeroApuesta) {
    if (!numeroApuesta) return;
    sessionStorage.setItem("apuestaSeleccionada", String(numeroApuesta));
    window.location.href = `apuesta.html?apuesta=${encodeURIComponent(numeroApuesta)}`;
}

function obtenerGanadorDesdeDetalle(detalle) {
    if (!detalle || !detalle.apuestasPersonas) return null;

    const apGanadora = detalle.apuestasPersonas.find(function(ap) {
        return ap.resultado === "GAN";
    });

    if (!apGanadora) return null;

    if (detalle.pronosticos) {
        const pronostico = detalle.pronosticos.find(function(p) {
            return p.ocurrencia === apGanadora.ocurrencia;
        });
        if (pronostico) return pronostico;
    }

    return { descripcion: apGanadora.descripcion, ocurrencia: apGanadora.ocurrencia };
}

function apuestaConResultado(detalle) {
    return detalle.apuestasPersonas && detalle.apuestasPersonas.some(function(ap) {
        return ap.resultado === "GAN" || ap.resultado === "PER";
    });
}

function ocurrenciaGanadoraDesdeDetalle(detalle) {
    const ganador = obtenerGanadorDesdeDetalle(detalle);
    return ganador ? ganador.ocurrencia : null;
}

function apuestaVencida(fechaLimite) {
    if (!fechaLimite) return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const cierre = new Date(fechaLimite + "T00:00:00");
    return hoy > cierre;
}

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

function htmlPronosticos(pronosticos, mostrarResultado, ocurrenciaGanadora) {
    if (!pronosticos || pronosticos.length === 0) return "";

    return pronosticos.map(function(p) {
        let badge = "";
        if (mostrarResultado && ocurrenciaGanadora && p.ocurrencia === ocurrenciaGanadora) {
            badge = `<span class="badge ganador">Ganó</span>`;
        } else if (mostrarResultado && ocurrenciaGanadora) {
            badge = `<span class="badge perdedor">Perdió</span>`;
        }

        return `
            <div class="pronostico">
                <span>${p.descripcion} ${badge}</span>
                <div class="pronostico-stats">
                    <span class="monto-apostado">${formatearMonto(p.totalApostado)}</span>
                    <span class="dividendo">${formatearDividendo(p.dividendo)}x</span>
                </div>
            </div>
        `;
    }).join("");
}

function htmlResultadoGanador(ganador) {
    if (!ganador) return "";
    return `
        <div class="apuesta-resultado">
            <strong>Resultado:</strong> ${ganador.descripcion}
        </div>
    `;
}

function htmlApuestasPersonas(apuestasPersonas) {
    if (!apuestasPersonas || apuestasPersonas.length === 0) return "";

    const filas = apuestasPersonas.map(function(ap) {
        const clase = ap.resultado === "GAN" ? "ganador" : "perdedor";
        return `
            <div class="resultado-persona">
                <span>${ap.nombre} ${ap.apellido} — ${ap.descripcion}</span>
                <span>${formatearMonto(ap.importe)}</span>
                <span class="badge ${clase}">${ap.resultado || "—"}</span>
            </div>
        `;
    }).join("");

    return `
        <div class="apuesta-resultado">
            <strong>Apuestas de personas:</strong>
            ${filas}
        </div>
    `;
}

function cerrarSesion() {
    localStorage.removeItem("usuarioActual");
    usuarioActual = null;
    window.location.href = "index.html";
}