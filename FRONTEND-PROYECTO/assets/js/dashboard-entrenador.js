/* assets/js/dashboard-entrenador.js - Lógica para dashboard de entrenador */

class DashboardEntrenadorManager {
    constructor() {
        this.currentTrainer = null;
        this.proximasSesiones = [];
        this.resenasRecientes = [];
        this.misServicios = [];
        this.estadisticas = {};
        
        this.init();
    }

    init() {
        // Verificar autenticación y tipo de usuario
        if (!AuthManager.requireAuth()) {
            return;
        }

        const user = AuthManager.getUser();
        
        // Verificar que sea entrenador
        if (user.tipoUsuario !== 'entrenador') {
            UIHelpers.showToast('Acceso denegado. Esta página es solo para entrenadores.', 'danger');
            setTimeout(() => window.location.href = 'index.html', 2000);
            return;
        }

        this.currentTrainer = user;
        this.initializeEventListeners();
        this.loadDashboardData();
    }

    // ==================== EVENT LISTENERS ====================
    initializeEventListeners() {
        // Botón gestionar disponibilidad
        const btnDisponibilidad = document.getElementById('btnVerDisponibilidad');
        if (btnDisponibilidad) {
            btnDisponibilidad.addEventListener('click', () => this.gestionarDisponibilidad());
        }

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                AuthManager.logout();
            });
        }
    }

    // ==================== CARGA DE DATOS ====================
    async loadDashboardData() {
        try {
            // Actualizar nombre del entrenador
            const trainerNameElement = document.getElementById('trainerName');
            if (trainerNameElement) {
                trainerNameElement.textContent = this.currentTrainer.nombres || 'Entrenador';
            }

            // Cargar datos en paralelo
            await Promise.all([
                this.loadEstadisticas(),
                this.loadProximasSesiones(),
                this.loadResenasRecientes(),
                this.loadMisServicios()
            ]);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            UIHelpers.showToast('Error al cargar los datos del dashboard', 'danger');
        }
    }

    async loadEstadisticas() {
        try {
            const idEntrenador = this.currentTrainer?.idEntrenador;
            if (!idEntrenador) {
                console.error('Entrenador no definido');
                return;
            }

            // Peticiones paralelas
            const [
                sesionesPendientes,
                serviciosActivos,
                clientesTotales,
                calificacionPromedio
            ] = await Promise.all([
                ApiClient.get(`/Sesion/obtener/estado/Pendiente/idEntrenador/${idEntrenador}`),
                ApiClient.get(`/Servicio/obtener/idEntrenador/${idEntrenador}/estado/Activo`),
                ApiClient.get(`/Sesion/obtener/cantClientes/1`),
                ApiClient.get(`/Resenia/obtener/calificacionEntrenador/${idEntrenador}`)
            ]);

            // Construir el objeto esperado por renderEstadisticas()
            const stats = {
                sesionesPendientes: sesionesPendientes?.length || 0,
                serviciosActivos: serviciosActivos?.length || 0,
                clientesTotales: clientesTotales || 0,
                calificacionPromedio: calificacionPromedio || 0
            };

            this.estadisticas = stats;
            this.renderEstadisticas(stats);

        } catch (error) {
            console.error('Error loading estadísticas:', error);
        }
    }

    async loadProximasSesiones() {
        const container = document.getElementById('proximasSesionesContainer');

        try {
            const currentTrainer = this.currentTrainer;

            if (!currentTrainer || !currentTrainer.idEntrenador) {
                throw new Error('Entrenador no autenticado');
            }

            const idEntrenador = currentTrainer.idEntrenador;
            const estados = ['Pendiente', 'Confirmada', 'activa']; // estados válidos como próximas

            // Obtener todas las sesiones del entrenador por estado (en paralelo)
            const peticiones = estados.map(estado =>
                ApiClient.get(`/Sesion/obtener/estado/${estado}/idEntrenador/${idEntrenador}`)
            );

            const resultados = await Promise.all(peticiones);
            const todasLasSesiones = resultados.flat();

            if (!todasLasSesiones || todasLasSesiones.length === 0) {
                this.proximasSesiones = [];
                this.renderProximasSesiones([]);
                return;
            }

            // Filtrar solo las futuras
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            const sesionesFuturas = todasLasSesiones.filter(sesion => {
                const fechaSesion = new Date(sesion.fechaHora);
                return fechaSesion >= hoy;
            });

            // Mapear datos según tu estructura de JSON real
            this.proximasSesiones = sesionesFuturas.map(sesion => {
                const fecha = new Date(sesion.fechaHora);

                return {
                    idSesion: sesion.idSesion,
                    servicio: sesion.servicio?.nombre || 'Sesión de Entrenamiento',
                    clienteNombre: sesion.cliente
                        ? `${sesion.cliente.nombres} ${sesion.cliente.apellidos}`
                        : 'Cliente no especificado',
                    estado: sesion.estado,
                    estadoTexto: sesion.estado.charAt(0).toUpperCase() + sesion.estado.slice(1).toLowerCase(),
                    fecha: fecha.toLocaleDateString('es-CO', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short'
                    }),
                    hora: fecha.toLocaleTimeString('es-CO', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    }),
                    ubicacion: sesion.servicio?.ubicacion || sesion.cliente?.ubicacion || 'Sin ubicación',
                    precio: sesion.servicio?.precio || 0
                };
            });

            // Ordenar por fecha más próxima
            this.proximasSesiones.sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));

            // Renderizar las sesiones
            this.renderProximasSesiones(this.proximasSesiones);

        } catch (error) {
            console.error('Error loading próximas sesiones:', error);
            container.innerHTML = this.getErrorState('Error al cargar las próximas sesiones');
        }
    }

    async loadResenasRecientes() {
        const container = document.getElementById('resenasRecientesContainer');
        
        try {
            // TODO: Reemplazar con llamada real al API
            // const resenas = await ApiClient.get(`/Resenia/entrenador/${this.currentTrainer.idEntrenador}/recientes`);
            
            // Simulación temporal
            const resenas = await this.simulateGetResenasRecientes();
            
            this.resenasRecientes = resenas;
            this.renderResenasRecientes(resenas);

            // Actualizar badge de nuevas reseñas
            const badge = document.getElementById('badgeNuevasResenias');
            if (badge) {
                const nuevas = resenas.filter(r => !r.respondida).length;
                badge.textContent = `${nuevas} nueva${nuevas !== 1 ? 's' : ''}`;
            }

        } catch (error) {
            console.error('Error loading reseñas:', error);
            container.innerHTML = this.getErrorState('Error al cargar las reseñas');
        }
    }

    async loadMisServicios() {
        const container = document.getElementById('misServiciosContainer');
        
        try {
            // TODO: Reemplazar con llamada real al API
            // const servicios = await ApiClient.get(`/Servicio/entrenador/${this.currentTrainer.idEntrenador}`);
            
            const servicios = await ApiClient.get(`/Servicio/obtener/idEntrenador/${this.currentTrainer.idEntrenador}`);
            
            // Simulación temporal
            // const servicios = await this.simulateGetMisServicios();
            
            this.misServicios = servicios;
            this.renderMisServicios(servicios);

        } catch (error) {
            console.error('Error loading servicios:', error);
            container.innerHTML = this.getErrorState('Error al cargar los servicios');
        }
    }

    // ==================== RENDERIZADO ====================
    renderEstadisticas(stats) {
        document.getElementById('statSesionesPendientes').textContent = stats.sesionesPendientes || 0;
        document.getElementById('statServiciosActivos').textContent = stats.serviciosActivos || 0;
        document.getElementById('statClientesTotales').textContent = stats.clientesTotales || 0;
        document.getElementById('statCalificacion').textContent = (stats.calificacionPromedio || 0).toFixed(1);
    }

    renderProximasSesiones(sesiones) {
        const container = document.getElementById('proximasSesionesContainer');

        if (!sesiones || sesiones.length === 0) {
            container.innerHTML = this.getEmptyState(
                'calendar-x',
                'No tienes sesiones próximas',
                'Las sesiones agendadas por tus clientes aparecerán aquí'
            );
            return;
        }

        let html = '';

        // Mostrar máximo 5 sesiones en el dashboard
        sesiones.slice(0, 5).forEach(sesion => {
            html += `
                <div class="sesion-item slide-in-left">
                    <div class="sesion-header">
                        <div class="flex-grow-1">
                            <div class="sesion-title">${sesion.servicio || 'Sesión de Entrenamiento'}</div>
                            <div class="sesion-cliente">
                                <i class="bi bi-person"></i> ${sesion.clienteNombre || 'Cliente no especificado'}
                            </div>
                        </div>
                        <span class="badge-estado badge-${(sesion.estado || '').toLowerCase()}">
                            ${sesion.estadoTexto || 'Pendiente'}
                        </span>
                    </div>
                    <div class="sesion-info">
                        <span><i class="bi bi-calendar-event"></i> ${sesion.fecha || 'Sin fecha'}</span>
                        <span><i class="bi bi-clock"></i> ${sesion.hora || 'Hora no definida'}</span>
                        <span><i class="bi bi-geo-alt"></i> ${sesion.ubicacion || 'Ubicación no disponible'}</span>
                        <span><i class="bi bi-cash-coin"></i> ${UIHelpers.formatPrice(sesion.precio || 0)}</span>
                    </div>
                    <div class="mt-2">
                        <button class="btn btn-sm btn-primary me-2" onclick="dashboardEntrenadorManager.iniciarChat('${sesion.idSesion}')">
                            <i class="bi bi-chat-dots"></i> Chat
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="dashboardEntrenadorManager.verDetallesSesion('${sesion.idSesion}')">
                            <i class="bi bi-info-circle"></i> Detalles
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    renderResenasRecientes(resenas) {
        const container = document.getElementById('resenasRecientesContainer');
        
        if (!resenas || resenas.length === 0) {
            container.innerHTML = this.getEmptyState(
                'chat-quote',
                'No tienes reseñas recientes',
                'Las evaluaciones de tus clientes aparecerán aquí'
            );
            return;
        }

        let html = '';
        
        // Mostrar máximo 3 reseñas en el dashboard
        resenas.slice(0, 3).forEach(resena => {
            html += `
                <div class="resena-item fade-in">
                    <div class="resena-header">
                        <div>
                            <div class="resena-cliente">${resena.clienteNombre}</div>
                            <div class="resena-estrellas">
                                ${this.renderEstrellas(resena.calificacion)}
                            </div>
                        </div>
                        <div class="text-end">
                            <div class="resena-fecha">${UIHelpers.formatDate(resena.fecha)}</div>
                            ${!resena.respondida ? '<span class="badge bg-warning text-dark">Nueva</span>' : ''}
                        </div>
                    </div>
                    <p class="resena-texto">"${resena.comentario}"</p>
                    ${!resena.respondida ? `
                        <div class="resena-acciones">
                            <button class="btn btn-sm btn-outline-primary" onclick="dashboardEntrenadorManager.responderResena('${resena.idResena}')">
                                <i class="bi bi-reply"></i> Responder
                            </button>
                        </div>
                    ` : resena.respuesta ? `
                        <div class="resena-acciones">
                            <small class="text-muted"><strong>Tu respuesta:</strong> ${resena.respuesta}</small>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    renderMisServicios(servicios) {
        const container = document.getElementById('misServiciosContainer');
        
        if (!servicios || servicios.length === 0) {
            container.innerHTML = this.getEmptyState(
                'briefcase',
                'No tienes servicios creados',
                '<a href="servicios-entrenador.html?action=create" class="btn btn-sm btn-primary mt-2">Crear mi primer servicio</a>'
            );
            return;
        }

        let html = '';
        
        // Mostrar máximo 4 servicios en el dashboard
        servicios.slice(0, 4).forEach(servicio => {
            html += `
                <div class="servicio-item fade-in">
                    <div class="servicio-nombre">${servicio.nombre}</div>
                    <div class="servicio-precio">${UIHelpers.formatPrice(servicio.precio)}/sesión</div>
                    <span class="servicio-deporte">${servicio.deporte}</span>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    renderEstrellas(calificacion) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= calificacion) {
                html += '<i class="bi bi-star-fill"></i>';
            } else {
                html += '<i class="bi bi-star"></i>';
            }
        }
        return html;
    }

    // ==================== ACCIONES ====================
    iniciarChat(idSesion) {
        // TODO: Implementar navegación al chat
        window.location.href = `chat.html?sesion=${idSesion}`;
    }

    verDetallesSesion(idSesion) {
        // TODO: Implementar modal o navegación a detalles
        UIHelpers.showToast('Mostrando detalles de la sesión...', 'info');
        window.location.href = `sesiones-entrenador.html?sesion=${idSesion}`;
    }

    responderResena(idResena) {
        // TODO: Implementar modal para responder reseña
        const resena = this.resenasRecientes.find(r => r.idResena === idResena);
        
        if (!resena) return;

        // Crear modal dinámico
        const modalHTML = `
            <div class="modal fade" id="responderResenaModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Responder a ${resena.clienteNombre}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <strong>Reseña original:</strong>
                                <p class="text-muted">"${resena.comentario}"</p>
                                <div class="text-warning">${this.renderEstrellas(resena.calificacion)}</div>
                            </div>
                            <form id="responderResenaForm">
                                <div class="mb-3">
                                    <label for="respuestaTexto" class="form-label">Tu respuesta</label>
                                    <textarea class="form-control" id="respuestaTexto" rows="4" 
                                        placeholder="Escribe tu respuesta profesional y amable..." required></textarea>
                                </div>
                                <div class="d-grid">
                                    <button type="submit" class="btn btn-primary">
                                        <span class="spinner-border spinner-border-sm d-none me-2"></span>
                                        Enviar respuesta
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insertar modal en el DOM
        const existingModal = document.getElementById('responderResenaModal');
        if (existingModal) existingModal.remove();
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = new bootstrap.Modal(document.getElementById('responderResenaModal'));
        modal.show();

        // Manejar submit del formulario
        document.getElementById('responderResenaForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.enviarRespuestaResena(idResena, document.getElementById('respuestaTexto').value);
            modal.hide();
        });
    }

    async enviarRespuestaResena(idResena, respuesta) {
        try {
            // TODO: Reemplazar con llamada real al API
            // await ApiClient.post(`/Resenia/${idResena}/responder`, { respuesta });
            
            // Simulación
            await new Promise(resolve => setTimeout(resolve, 800));

            UIHelpers.showToast('Respuesta enviada exitosamente', 'success');
            
            // Recargar reseñas
            await this.loadResenasRecientes();

        } catch (error) {
            console.error('Error enviando respuesta:', error);
            UIHelpers.showToast('Error al enviar la respuesta', 'danger');
        }
    }

    gestionarDisponibilidad() {
        // TODO: Implementar modal o página de gestión de disponibilidad
        UIHelpers.showToast('Función de gestión de disponibilidad en desarrollo', 'info');
    }

    // ==================== UTILIDADES ====================
    getEmptyState(icon, title, description) {
        return `
            <div class="empty-state-dashboard">
                <i class="bi bi-${icon}"></i>
                <h6>${title}</h6>
                <p>${description}</p>
            </div>
        `;
    }

    getErrorState(message) {
        return `
            <div class="empty-state-dashboard">
                <i class="bi bi-exclamation-triangle text-danger"></i>
                <h6>Error</h6>
                <p>${message}</p>
                <button class="btn btn-sm btn-primary mt-2" onclick="location.reload()">
                    <i class="bi bi-arrow-clockwise"></i> Reintentar
                </button>
            </div>
        `;
    }

    // ==================== SIMULACIONES DE API (TEMPORAL) ====================
    async simulateGetEstadisticas() {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        return {
            sesionesPendientes: 5,
            serviciosActivos: 3,
            clientesTotales: 12,
            calificacionPromedio: 4.7
        };
    }

    async simulateGetProximasSesiones() {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return [
            {
                idSesion: 'sesion1',
                servicio: 'Entrenamiento Personalizado de Fútbol',
                clienteNombre: 'Juan Pérez',
                fecha: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                hora: '10:00 AM',
                ubicacion: 'Parque El Virrey',
                precio: 80000,
                estado: 'confirmada',
                estadoTexto: 'Confirmada'
            },
            {
                idSesion: 'sesion2',
                servicio: 'Clase de Natación',
                clienteNombre: 'María García',
                fecha: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                hora: '3:00 PM',
                ubicacion: 'Piscina Compensar',
                precio: 70000,
                estado: 'pendiente',
                estadoTexto: 'Pendiente'
            },
            {
                idSesion: 'sesion3',
                servicio: 'Entrenamiento Funcional',
                clienteNombre: 'Carlos Rodríguez',
                fecha: new Date(Date.now() + 172800000).toISOString().split('T')[0],
                hora: '6:00 AM',
                ubicacion: 'Box CrossFit Norte',
                precio: 60000,
                estado: 'confirmada',
                estadoTexto: 'Confirmada'
            }
        ];
    }

    async simulateGetResenasRecientes() {
        await new Promise(resolve => setTimeout(resolve, 900));
        
        return [
            {
                idResena: 'resena1',
                clienteNombre: 'Andrea López',
                calificacion: 5,
                comentario: 'Excelente entrenador, muy profesional y paciente. Mejoré muchísimo mi técnica en pocas sesiones.',
                fecha: new Date(Date.now() - 172800000).toISOString().split('T')[0],
                respondida: false,
                respuesta: null
            },
            {
                idResena: 'resena2',
                clienteNombre: 'Pedro Martínez',
                calificacion: 4,
                comentario: 'Muy buen servicio, las clases son dinámicas y se aprende mucho. Recomendado.',
                fecha: new Date(Date.now() - 259200000).toISOString().split('T')[0],
                respondida: true,
                respuesta: 'Muchas gracias por tu comentario Pedro, es un placer trabajar contigo. ¡Sigamos mejorando!'
            },
            {
                idResena: 'resena3',
                clienteNombre: 'Laura Gómez',
                calificacion: 5,
                comentario: 'Increíble experiencia, superó mis expectativas. Las rutinas están muy bien diseñadas.',
                fecha: new Date(Date.now() - 432000000).toISOString().split('T')[0],
                respondida: false,
                respuesta: null
            }
        ];
    }

    async simulateGetMisServicios() {
        await new Promise(resolve => setTimeout(resolve, 700));
        
        return [
            {
                idServicio: 'serv1',
                nombre: 'Entrenamiento Personalizado',
                deporte: 'Fútbol',
                precio: 80000,
                activo: true
            },
            {
                idServicio: 'serv2',
                nombre: 'Clases de Natación',
                deporte: 'Natación',
                precio: 70000,
                activo: true
            },
            {
                idServicio: 'serv3',
                nombre: 'CrossFit Funcional',
                deporte: 'CrossFit',
                precio: 60000,
                activo: true
            }
        ];
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.dashboardEntrenadorManager = new DashboardEntrenadorManager();
});