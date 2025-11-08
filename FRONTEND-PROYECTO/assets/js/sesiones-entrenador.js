/* assets/js/sesiones-entrenador.js - Lógica para sesiones del entrenador */

class SesionesEntrenadorManager {
    constructor() {
        this.currentTrainer = null;
        this.allSessions = [];
        this.filteredSessions = [];
        this.currentFilter = 'all';
        this.currentSort = 'date-desc';
        this.currentPage = 1;
        this.itemsPerPage = 6;
        this.selectedSession = null;
        
        this.init();
    }

    init() {
        // Verificar autenticación
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
        this.loadSessions();
    }

    // ==================== EVENT LISTENERS ====================
    initializeEventListeners() {
        // Filtros
        document.getElementById('filterAll')?.addEventListener('click', () => this.filterSessions('all'));
        document.getElementById('filterPending')?.addEventListener('click', () => this.filterSessions('pending'));
        document.getElementById('filterConfirmed')?.addEventListener('click', () => this.filterSessions('confirmed'));
        document.getElementById('filterCompleted')?.addEventListener('click', () => this.filterSessions('completed'));

        // Ordenamiento
        const sortDropdown = document.querySelectorAll('[data-sort]');
        sortDropdown.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.sortSessions(item.getAttribute('data-sort'));
            });
        });

        // Botones de modales
        document.getElementById('btnConfirmarSesion')?.addEventListener('click', () => this.confirmarSesion());
        document.getElementById('btnFinalizarSesion')?.addEventListener('click', () => this.finalizarSesion());

        // Chat
        document.getElementById('startChatBtn')?.addEventListener('click', () => this.startChat());

        // Configurar fecha mínima
        const confirmDateInput = document.getElementById('confirmDate');
        if (confirmDateInput) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            confirmDateInput.min = tomorrow.toISOString().split('T')[0];
        }

        // Logout
        document.getElementById('logout-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            AuthManager.logout();
        });
    }

    // ==================== CARGA DE DATOS ====================
    async loadSessions() {
        try {
            this.showLoadingState();

            const idEntrenador = this.currentTrainer.idEntrenador;
            console.log('Cargando sesiones para entrenador:', idEntrenador);
            
            const estados = ['Pendiente', 'Confirmada', 'Finalizada'];

            // Obtener todas las sesiones del entrenador
            const peticiones = estados.map(estado =>
                ApiClient.get(`/Sesion/obtener/estado/${estado}/idEntrenador/${idEntrenador}`)
            );

            const resultados = await Promise.all(peticiones);
            const todasLasSesiones = resultados.flat();

            console.log('Sesiones obtenidas:', todasLasSesiones);

            // Mapear sesiones
            this.allSessions = todasLasSesiones.map(sesion => this.mapSesionToView(sesion));

            console.log('Sesiones mapeadas:', this.allSessions);

            // Actualizar estadísticas
            this.updateStats();
            
            // Aplicar filtro por defecto
            this.filterSessions(this.currentFilter);

        } catch (error) {
            console.error('Error loading sessions:', error);
            this.showErrorState('Error al cargar las sesiones');
        }
    }

    mapSesionToView(sesion) {
        const fechaHora = new Date(sesion.fechaHora);

        return {
            id: sesion.idSesion,
            idSesion: sesion.idSesion,
            title: sesion.servicio?.nombre || 'Sesión de Entrenamiento',
            clientName: sesion.cliente
                ? `${sesion.cliente.nombres} ${sesion.cliente.apellidos}`
                : 'Cliente no especificado',
            clientEmail: sesion.cliente?.correo || '',
            clientPhone: sesion.cliente?.telefono || '',
            location: sesion.servicio?.ubicacion || 'Ubicación no especificada',
            date: fechaHora.toISOString().split('T')[0],
            dateTime: sesion.fechaHora,
            time: fechaHora.toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }),
            price: sesion.servicio?.precio || 0,
            sport: sesion.servicio?.deporte || '',
            duration: sesion.servicio?.duracion || 60,
            status: sesion.estado.toLowerCase(),
            description: sesion.servicio?.descripcion || '',
            servicioId: sesion.servicio?.idServicio,
            clienteId: sesion.cliente?.idCliente
        };
    }

    updateStats() {
        const total = this.allSessions.length;
        const pending = this.allSessions.filter(s => s.status === 'pendiente').length;
        const confirmed = this.allSessions.filter(s => s.status === 'confirmada').length;
        const completed = this.allSessions.filter(s => s.status === 'finalizada').length;

        document.getElementById('totalSessions').textContent = total;
        document.getElementById('pendingSessions').textContent = pending;
        document.getElementById('confirmedSessions').textContent = confirmed;
        document.getElementById('completedSessions').textContent = completed;
    }

    // ==================== FILTROS Y ORDENAMIENTO ====================
    filterSessions(filter) {
        this.currentFilter = filter;
        
        // Actualizar botones activos
        document.querySelectorAll('.filter-buttons .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.getElementById(`filter${filter.charAt(0).toUpperCase() + filter.slice(1)}`);
        if (activeBtn) activeBtn.classList.add('active');

        // Filtrar sesiones
        switch (filter) {
            case 'pending':
                this.filteredSessions = this.allSessions.filter(s => s.status === 'pendiente');
                break;
            case 'confirmed':
                this.filteredSessions = this.allSessions.filter(s => s.status === 'confirmada');
                break;
            case 'completed':
                this.filteredSessions = this.allSessions.filter(s => s.status === 'finalizada');
                break;
            default:
                this.filteredSessions = [...this.allSessions];
        }

        this.sortSessions(this.currentSort);
    }

    sortSessions(sortType) {
        this.currentSort = sortType;

        this.filteredSessions.sort((a, b) => {
            switch (sortType) {
                case 'date-desc':
                    return new Date(b.date) - new Date(a.date);
                case 'date-asc':
                    return new Date(a.date) - new Date(b.date);
                case 'client':
                    return a.clientName.localeCompare(b.clientName);
                default:
                    return 0;
            }
        });

        this.currentPage = 1;
        this.renderSessions();
    }

    // ==================== RENDERIZADO ====================
    renderSessions() {
        const container = document.getElementById('sessionsContainer');
        
        if (this.filteredSessions.length === 0) {
            this.showEmptyState();
            return;
        }

        // Limpiar contenedor
        container.innerHTML = '';

        // Calcular paginación
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const sessionsToShow = this.filteredSessions.slice(startIndex, endIndex);

        // Agregar cards al contenedor
        sessionsToShow.forEach((session, index) => {
            const card = this.createSessionCard(session, startIndex + index);
            container.appendChild(card);
        });

        this.updatePagination();
    }

    createSessionCard(session, index) {
        const statusClass = this.getStatusClass(session.status);
        const statusText = this.getStatusText(session.status);
        const isPending = session.status === 'pendiente';
        const isConfirmed = session.status === 'confirmada';
        const isCompleted = session.status === 'finalizada';

        const card = document.createElement('div');
        card.className = 'session-card';
        card.style.animationDelay = `${index * 0.1}s`;
        
        card.innerHTML = `
            <div class="session-card-header">
                <i class="bi ${this.getSportIcon(session.sport)} session-icon"></i>
                <span class="session-status ${statusClass}">${statusText}</span>
            </div>
            <div class="session-card-body">
                <h3 class="session-title">${session.title}</h3>
                
                <div class="session-detail">
                    <i class="bi bi-person session-detail-icon"></i>
                    <span><strong>Cliente:</strong> ${session.clientName}</span>
                </div>
                
                <div class="session-detail">
                    <i class="bi bi-calendar-event session-detail-icon"></i>
                    <span><strong>Fecha:</strong> ${UIHelpers.formatDate(session.date)}</span>
                </div>
                
                <div class="session-detail">
                    <i class="bi bi-clock session-detail-icon"></i>
                    <span><strong>Hora:</strong> ${session.time}</span>
                </div>
                
                <div class="session-detail">
                    <i class="bi bi-geo-alt session-detail-icon"></i>
                    <span><strong>Ubicación:</strong> ${session.location}</span>
                </div>
                
                <div class="session-detail">
                    <i class="bi bi-cash-coin session-detail-icon"></i>
                    <span><strong>Precio:</strong> ${UIHelpers.formatPrice(session.price)}</span>
                </div>

                <div class="session-actions">
                    <button class="btn btn-outline-primary btn-sm btn-details" data-session-id="${session.id}">
                        <i class="bi bi-info-circle"></i> Detalles
                    </button>
                    
                    ${isPending ? `
                        <button class="btn btn-success btn-sm btn-confirm" data-session-id="${session.id}">
                            <i class="bi bi-check-circle"></i> Confirmar
                        </button>
                    ` : ''}
                    
                    ${isConfirmed ? `
                        <button class="btn btn-primary btn-sm btn-chat" data-session-id="${session.id}">
                            <i class="bi bi-chat-dots"></i> Chat
                        </button>
                        <button class="btn btn-info btn-sm btn-finish" data-session-id="${session.id}">
                            <i class="bi bi-flag-fill"></i> Finalizar
                        </button>
                    ` : ''}
                    
                    ${isCompleted ? `
                        <button class="btn btn-outline-secondary btn-sm" disabled>
                            <i class="bi bi-check-all"></i> Completada
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        // Agregar event listeners
        const detailsBtn = card.querySelector('.btn-details');
        if (detailsBtn) {
            detailsBtn.addEventListener('click', () => this.showSessionDetails(session.id));
        }

        const confirmBtn = card.querySelector('.btn-confirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.openConfirmarModal(session.id));
        }

        const chatBtn = card.querySelector('.btn-chat');
        if (chatBtn) {
            chatBtn.addEventListener('click', () => this.startChat(session.id));
        }

        const finishBtn = card.querySelector('.btn-finish');
        if (finishBtn) {
            finishBtn.addEventListener('click', () => this.openFinalizarModal(session.id));
        }

        return card;
    }

    getSportIcon(sport) {
        const icons = {
            'Fútbol': 'bi-dribbble',
            'Tenis': 'bi-circle',
            'Natación': 'bi-water',
            'Yoga': 'bi-heart',
            'CrossFit': 'bi-lightning',
            'Boxeo': 'bi-shield',
            'Baloncesto': 'bi-dribbble'
        };
        return icons[sport] || 'bi-trophy';
    }

    getStatusClass(status) {
        const classes = {
            'pendiente': 'pending',
            'confirmada': 'upcoming',
            'finalizada': 'completed'
        };
        return classes[status] || 'pending';
    }

    getStatusText(status) {
        const texts = {
            'pendiente': 'Pendiente',
            'confirmada': 'Confirmada',
            'finalizada': 'Finalizada'
        };
        return texts[status] || 'Desconocido';
    }

    // ==================== CONFIRMAR SESIÓN ====================
    openConfirmarModal(sessionId) {
        console.log('Abriendo modal para sesión:', sessionId);
        const session = this.allSessions.find(s => s.id === sessionId);
        
        if (!session) {
            console.error('Sesión no encontrada:', sessionId);
            UIHelpers.showToast('Sesión no encontrada', 'danger');
            return;
        }

        this.selectedSession = session;
        document.getElementById('sessionIdConfirm').value = sessionId;
        
        // Limpiar formulario
        document.getElementById('confirmarSesionForm').reset();
        document.getElementById('sessionIdConfirm').value = sessionId;
        
        const modalElement = document.getElementById('confirmarSesionModal');
        if (!modalElement) {
            console.error('Modal element not found');
            return;
        }
        
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }

    async confirmarSesion() {
        const sessionId = document.getElementById('sessionIdConfirm').value;
        const confirmDate = document.getElementById('confirmDate').value;
        const confirmTime = document.getElementById('confirmTime').value;
        const notes = document.getElementById('confirmNotes').value;

        if (!confirmDate || !confirmTime) {
            UIHelpers.showToast('Por favor selecciona fecha y hora', 'warning');
            return;
        }

        const submitBtn = document.getElementById('btnConfirmarSesion');
        
        try {
            UIHelpers.showButtonSpinner(submitBtn, true);

            // Construir fecha y hora completa
            const fechaHora = `${confirmDate}T${confirmTime}`;

            // Obtener sesión actual
            const session = this.allSessions.find(s => s.id === sessionId);
            if (!session) throw new Error('Sesión no encontrada');

            // Preparar datos para actualizar
            const updateData = {
                idSesion: sessionId,
                fechaHora: fechaHora,
                estado: 'Confirmada',
                cliente: {
                    idCliente: session.clienteId
                },
                entrenador: {
                    idEntrenador: this.currentTrainer.idEntrenador
                },
                servicio: {
                    idServicio: session.servicioId
                }
            };

            // Actualizar sesión
            const response = await ApiClient.put('/Sesion/actualizar', updateData);
            console.log("Data enviada: ", updateData);
            if (response) {
                UIHelpers.showToast('Sesión confirmada exitosamente', 'success');
                
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('confirmarSesionModal'));
                modal.hide();
                
                // Limpiar formulario
                document.getElementById('confirmarSesionForm').reset();
                
                // Recargar sesiones
                await this.loadSessions();
            }

        } catch (error) {
            console.error('Error confirmando sesión:', error);
            UIHelpers.showToast('Error al confirmar la sesión', 'danger');
        } finally {
            UIHelpers.showButtonSpinner(submitBtn, false);
        }
    }

    // ==================== FINALIZAR SESIÓN ====================
    openFinalizarModal(sessionId) {
        const session = this.allSessions.find(s => s.id === sessionId);
        if (!session) return;

        this.selectedSession = session;
        document.getElementById('sessionIdFinish').value = sessionId;
        
        const modal = new bootstrap.Modal(document.getElementById('finalizarSesionModal'));
        modal.show();
    }

    async finalizarSesion() {
        const sessionId = document.getElementById('sessionIdFinish').value;
        const notes = document.getElementById('finishNotes').value;

        const submitBtn = document.getElementById('btnFinalizarSesion');
        
        try {
            UIHelpers.showButtonSpinner(submitBtn, true);

            // Obtener sesión actual
            const session = this.allSessions.find(s => s.id === sessionId);
            if (!session) throw new Error('Sesión no encontrada');

            // Preparar datos para actualizar
            const updateData = {
                idSesion: sessionId,
                fechaHora: session.dateTime,
                estado: 'Finalizada',
                cliente: {
                    idCliente: session.clienteId
                },
                entrenador: {
                    idEntrenador: this.currentTrainer.idEntrenador
                },
                servicio: {
                    idServicio: session.servicioId
                }
            };

            // Actualizar sesión
            const response = await ApiClient.put('/Sesion/actualizar', updateData);

            if (response) {
                UIHelpers.showToast('Sesión finalizada exitosamente', 'success');
                
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('finalizarSesionModal'));
                modal.hide();
                
                // Limpiar formulario
                document.getElementById('finishNotes').value = '';
                
                // Recargar sesiones
                await this.loadSessions();
            }

        } catch (error) {
            console.error('Error finalizando sesión:', error);
            UIHelpers.showToast('Error al finalizar la sesión', 'danger');
        } finally {
            UIHelpers.showButtonSpinner(submitBtn, false);
        }
    }

    // ==================== OTRAS ACCIONES ====================
    showSessionDetails(sessionId) {
        console.log('Mostrando detalles de sesión:', sessionId);
        const session = this.allSessions.find(s => s.id === sessionId);
        
        if (!session) {
            console.error('Sesión no encontrada:', sessionId);
            UIHelpers.showToast('Sesión no encontrada', 'danger');
            return;
        }

        this.selectedSession = session;
        
        const modalBody = document.getElementById('sessionDetailBody');
        if (!modalBody) {
            console.error('Modal body not found');
            return;
        }
        
        modalBody.innerHTML = `
            <div class="client-info mb-4">
                <h5 class="mb-3"><i class="bi bi-person-circle"></i> Información del Cliente</h5>
                <p><strong>Nombre:</strong> ${session.clientName}</p>
                ${session.clientEmail ? `<p><strong>Email:</strong> ${session.clientEmail}</p>` : ''}
                ${session.clientPhone ? `<p><strong>Teléfono:</strong> ${session.clientPhone}</p>` : ''}
            </div>

            <div class="session-detail-grid">
                <div class="detail-item">
                    <h6>Deporte</h6>
                    <p><i class="bi ${this.getSportIcon(session.sport)} me-2"></i>${session.sport}</p>
                </div>
                <div class="detail-item">
                    <h6>Fecha y Hora</h6>
                    <p><i class="bi bi-calendar-event me-2"></i>${UIHelpers.formatDate(session.date)} - ${session.time}</p>
                </div>
                <div class="detail-item">
                    <h6>Duración</h6>
                    <p><i class="bi bi-clock me-2"></i>${session.duration} minutos</p>
                </div>
                <div class="detail-item">
                    <h6>Precio</h6>
                    <p><i class="bi bi-cash-coin me-2"></i>${UIHelpers.formatPrice(session.price)}</p>
                </div>
                <div class="detail-item">
                    <h6>Ubicación</h6>
                    <p><i class="bi bi-geo-alt me-2"></i>${session.location}</p>
                </div>
                <div class="detail-item">
                    <h6>Estado</h6>
                    <p><span class="badge session-status ${this.getStatusClass(session.status)}">${this.getStatusText(session.status)}</span></p>
                </div>
            </div>

            ${session.description ? `
                <div class="alert alert-info mt-3">
                    <h6><i class="bi bi-info-circle me-2"></i>Descripción del servicio</h6>
                    <p class="mb-0">${session.description}</p>
                </div>
            ` : ''}
        `;

        // Configurar botón de chat
        const isConfirmed = session.status === 'confirmada';
        const chatBtn = document.getElementById('startChatBtn');
        if (chatBtn) {
            chatBtn.classList.toggle('d-none', !isConfirmed);
        }

        const modalElement = document.getElementById('sessionDetailModal');
        if (!modalElement) {
            console.error('Modal element not found');
            return;
        }
        
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }

    startChat(sessionId = null) {
        const id = sessionId || this.selectedSession?.id;
        if (id) {
            window.location.href = `chat.html?session=${id}`;
        }
    }

    // ==================== PAGINACIÓN ====================
    updatePagination() {
        const paginationContainer = document.getElementById('paginationContainer');
        const totalPages = Math.ceil(this.filteredSessions.length / this.itemsPerPage);

        if (totalPages <= 1) {
            paginationContainer.classList.add('d-none');
            return;
        }

        paginationContainer.classList.remove('d-none');
        const pagination = paginationContainer.querySelector('.pagination');

        let html = '';
        
        html += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="sesionesEntrenadorManager.goToPage(${this.currentPage - 1})">
                    <i class="bi bi-chevron-left"></i>
                </a>
            </li>
        `;

        for (let i = 1; i <= totalPages; i++) {
            html += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="sesionesEntrenadorManager.goToPage(${i})">${i}</a>
                </li>
            `;
        }

        html += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="sesionesEntrenadorManager.goToPage(${this.currentPage + 1})">
                    <i class="bi bi-chevron-right"></i>
                </a>
            </li>
        `;

        pagination.innerHTML = html;
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredSessions.length / this.itemsPerPage);
        if (page < 1 || page > totalPages) return;

        this.currentPage = page;
        this.renderSessions();
        
        document.querySelector('.sessions-container').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    // ==================== ESTADOS ====================
    showLoadingState() {
        document.getElementById('sessionsContainer').innerHTML = `
            <div class="loading-state">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <h3 class="mt-3">Cargando tus sesiones...</h3>
            </div>
        `;
    }

    showEmptyState() {
        const messages = {
            'all': {
                icon: 'calendar-x',
                title: 'No tienes sesiones registradas',
                description: 'Las sesiones de tus clientes aparecerán aquí'
            },
            'pending': {
                icon: 'clock',
                title: 'No tienes sesiones pendientes',
                description: 'Cuando los clientes agenden sesiones aparecerán aquí'
            },
            'confirmed': {
                icon: 'check-circle',
                title: 'No tienes sesiones confirmadas',
                description: 'Las sesiones que confirmes aparecerán aquí'
            },
            'completed': {
                icon: 'archive',
                title: 'No tienes sesiones finalizadas',
                description: 'Las sesiones completadas aparecerán aquí'
            }
        };

        const message = messages[this.currentFilter] || messages['all'];

        document.getElementById('sessionsContainer').innerHTML = `
            <div class="empty-state">
                <i class="bi bi-${message.icon}"></i>
                <h3>${message.title}</h3>
                <p>${message.description}</p>
            </div>
        `;
    }

    showErrorState(message) {
        document.getElementById('sessionsContainer').innerHTML = `
            <div class="error-state">
                <i class="bi bi-exclamation-triangle text-danger"></i>
                <h3>Error al cargar sesiones</h3>
                <p>${message}</p>
                <button class="btn btn-primary mt-3" onclick="sesionesEntrenadorManager.loadSessions()">
                    <i class="bi bi-arrow-clockwise me-2"></i>Reintentar
                </button>
            </div>
        `;
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    window.sesionesEntrenadorManager = new SesionesEntrenadorManager();
});