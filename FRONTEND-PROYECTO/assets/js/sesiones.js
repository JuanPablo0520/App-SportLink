/* assets/js/sesiones.js - Lógica específica para la página de sesiones */

class SesionesPageManager {
    constructor() {
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

        this.initializeEventListeners();
        this.loadSessions();
    }

    // ==================== EVENT LISTENERS ====================
    initializeEventListeners() {
        // Filtros
        document.getElementById('filterAll')?.addEventListener('click', () => this.filterSessions('all'));
        document.getElementById('filterUpcoming')?.addEventListener('click', () => this.filterSessions('upcoming'));
        document.getElementById('filterCompleted')?.addEventListener('click', () => this.filterSessions('completed'));

        // Ordenamiento
        const sortDropdown = document.querySelectorAll('[data-sort]');
        sortDropdown.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.sortSessions(item.getAttribute('data-sort'));
            });
        });

        // Botón nueva sesión
        document.getElementById('newSessionBtn')?.addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // Modales
        this.initializeModalHandlers();
    }

    initializeModalHandlers() {
        // Modal de cancelación
        document.getElementById('confirmCancelBtn')?.addEventListener('click', () => this.confirmCancelSession());

        // Modal de reprogramación
        document.getElementById('confirmRescheduleBtn')?.addEventListener('click', () => this.confirmReschedule());

        // Chat desde modal de detalles
        document.getElementById('startChatBtn')?.addEventListener('click', () => this.startChat());

        // Configurar fecha mínima para reprogramación
        const newDateInput = document.getElementById('newDate');
        if (newDateInput) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            newDateInput.min = tomorrow.toISOString().split('T')[0];
        }
    }

    // ==================== CARGA DE DATOS ====================
    async loadSessions() {
        try {
            this.showLoadingState();
            const sessions = await ApiClient.get('/sessions', true);
            
            this.allSessions = sessions;
            this.updateStats();
            this.filterSessions(this.currentFilter);

        } catch (error) {
            console.error('Error loading sessions:', error);
            this.showErrorState('Error al cargar las sesiones');
        }
    }

    updateStats() {
        const total = this.allSessions.length;
        const upcoming = this.allSessions.filter(s => s.status === 'upcoming').length;
        const completed = this.allSessions.filter(s => s.status === 'completed').length;

        document.getElementById('totalSessions').textContent = total;
        document.getElementById('upcomingSessions').textContent = upcoming;
        document.getElementById('completedSessions').textContent = completed;
    }

    // ==================== FILTROS Y ORDENAMIENTO ====================
    filterSessions(filter) {
        this.currentFilter = filter;
        
        // Actualizar botones activos
        document.querySelectorAll('.filter-buttons .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`filter${filter.charAt(0).toUpperCase() + filter.slice(1)}`).classList.add('active');

        // Filtrar sesiones
        switch (filter) {
            case 'upcoming':
                this.filteredSessions = this.allSessions.filter(s => s.status === 'upcoming' || s.status === 'pending');
                break;
            case 'completed':
                this.filteredSessions = this.allSessions.filter(s => s.status === 'completed');
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
                case 'price-desc':
                    return b.price - a.price;
                case 'price-asc':
                    return a.price - b.price;
                case 'trainer':
                    return a.trainerName.localeCompare(b.trainerName);
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

        // Calcular paginación
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const sessionsToShow = this.filteredSessions.slice(startIndex, endIndex);

        let html = '';
        sessionsToShow.forEach((session, index) => {
            html += this.createSessionCard(session, startIndex + index);
        });

        container.innerHTML = html;
        this.updatePagination();
    }

    createSessionCard(session, index) {
        const statusClass = this.getStatusClass(session.status);
        const statusText = this.getStatusText(session.status);
        const isUpcoming = session.status === 'upcoming' || session.status === 'pending';
        const canModify = isUpcoming && new Date(session.date) > new Date();

        return `
            <div class="session-card" style="animation-delay: ${index * 0.1}s">
                <div class="session-card-header">
                    <i class="bi ${this.getSportIcon(session.sport)} session-icon"></i>
                    <span class="session-status ${statusClass}">${statusText}</span>
                </div>
                <div class="session-card-body">
                    <h3 class="session-title">${session.title}</h3>
                    
                    <div class="session-detail">
                        <i class="bi bi-person session-detail-icon"></i>
                        <span><strong>Entrenador:</strong> ${session.trainerName}</span>
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
                        <button class="btn btn-outline-primary btn-sm" onclick="sesionesPageManager.showSessionDetails('${session.id}')">
                            <i class="bi bi-info-circle"></i> Detalles
                        </button>
                        ${isUpcoming ? `
                            <button class="btn btn-primary btn-sm" onclick="sesionesPageManager.startChat('${session.id}')">
                                <i class="bi bi-chat-dots"></i> Chat
                            </button>
                        ` : ''}
                        ${canModify ? `
                            <button class="btn btn-warning btn-sm" onclick="sesionesPageManager.rescheduleSession('${session.id}')">
                                <i class="bi bi-calendar"></i> Reprogramar
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="sesionesPageManager.cancelSession('${session.id}')">
                                <i class="bi bi-x-circle"></i> Cancelar
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
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
            'upcoming': 'upcoming',
            'completed': 'completed',
            'cancelled': 'cancelled',
            'pending': 'pending'
        };
        return classes[status] || 'upcoming';
    }

    getStatusText(status) {
        const texts = {
            'upcoming': 'Próxima',
            'completed': 'Completada',
            'cancelled': 'Cancelada',
            'pending': 'Pendiente'
        };
        return texts[status] || 'Desconocido';
    }

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
        
        // Botón anterior
        html += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="sesionesPageManager.goToPage(${this.currentPage - 1})" aria-label="Anterior">
                    <i class="bi bi-chevron-left"></i>
                </a>
            </li>
        `;

        // Números de página
        for (let i = 1; i <= totalPages; i++) {
            html += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="sesionesPageManager.goToPage(${i})">${i}</a>
                </li>
            `;
        }

        // Botón siguiente
        html += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="sesionesPageManager.goToPage(${this.currentPage + 1})" aria-label="Siguiente">
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
        
        // Scroll suave hacia arriba
        document.querySelector('.sessions-container').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    // ==================== ACCIONES DE SESIÓN ====================
    showSessionDetails(sessionId) {
        const session = this.allSessions.find(s => s.id === sessionId);
        if (!session) return;

        this.selectedSession = session;
        
        // Llenar modal con detalles
        const modalBody = document.getElementById('sessionDetailBody');
        modalBody.innerHTML = `
            <div class="trainer-info">
                <img src="${session.trainerAvatar}" alt="${session.trainerName}" class="trainer-avatar">
                <div class="trainer-details">
                    <h5>${session.trainerName}</h5>
                    <p>${session.trainerSpecialty}</p>
                    <small class="text-muted">${session.trainerExperience} años de experiencia</small>
                </div>
                <div class="trainer-rating">
                    <div class="star-rating">
                        ${this.renderStars(session.trainerRating)}
                    </div>
                    <span class="rating-number">${session.trainerRating}</span>
                </div>
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
                <div class="alert alert-info">
                    <h6><i class="bi bi-info-circle me-2"></i>Descripción de la sesión</h6>
                    <p class="mb-0">${session.description}</p>
                </div>
            ` : ''}

            ${session.notes ? `
                <div class="alert alert-light">
                    <h6><i class="bi bi-sticky me-2"></i>Notas adicionales</h6>
                    <p class="mb-0">${session.notes}</p>
                </div>
            ` : ''}
        `;

        // Configurar botones del modal
        const isUpcoming = session.status === 'upcoming' || session.status === 'pending';
        const canModify = isUpcoming && new Date(session.date) > new Date();

        document.getElementById('startChatBtn').classList.toggle('d-none', !isUpcoming);
        document.getElementById('cancelSessionBtn').classList.toggle('d-none', !canModify);
        document.getElementById('rescheduleBtn').classList.toggle('d-none', !canModify);

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('sessionDetailModal'));
        modal.show();
    }

    renderStars(rating) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            html += `<i class="bi ${i <= rating ? 'bi-star-fill' : 'bi-star'}"></i>`;
        }
        return html;
    }

    startChat(sessionId = null) {
        const id = sessionId || this.selectedSession?.id;
        if (id) {
            window.location.href = `chat.html?session=${id}`;
        }
    }

    cancelSession(sessionId) {
        const session = this.allSessions.find(s => s.id === sessionId);
        if (!session) return;

        this.selectedSession = session;
        
        // Mostrar modal de cancelación
        const modal = new bootstrap.Modal(document.getElementById('cancelSessionModal'));
        modal.show();
    }

    rescheduleSession(sessionId) {
        const session = this.allSessions.find(s => s.id === sessionId);
        if (!session) return;

        this.selectedSession = session;
        
        // Mostrar modal de reprogramación
        const modal = new bootstrap.Modal(document.getElementById('rescheduleModal'));
        modal.show();
    }

    async confirmCancelSession() {
        if (!this.selectedSession) return;

        const submitBtn = document.getElementById('confirmCancelBtn');
        const reason = document.getElementById('cancelReason').value;
        const comments = document.getElementById('cancelComments').value;

        if (!reason) {
            UIHelpers.showToast('Por favor selecciona un motivo de cancelación', 'warning');
            return;
        }

        try {
            UIHelpers.showButtonSpinner(submitBtn, true);

            const cancelData = {
                sessionId: this.selectedSession.id,
                reason,
                comments
            };

            const response = await ApiClient.post('/sessions/cancel', cancelData, true);
            
            if (response) {
                // Actualizar sesión local
                const sessionIndex = this.allSessions.findIndex(s => s.id === this.selectedSession.id);
                if (sessionIndex !== -1) {
                    this.allSessions[sessionIndex].status = 'cancelled';
                }

                UIHelpers.showToast('Sesión cancelada exitosamente', 'success');
                
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('cancelSessionModal'));
                modal.hide();
                
                // Actualizar vista
                this.updateStats();
                this.filterSessions(this.currentFilter);
                
                // Limpiar formulario
                document.getElementById('cancelSessionForm').reset();
            } else {
                throw new Error('Error al cancelar sesión');
            }

        } catch (error) {
            console.error('Cancel session error:', error);
            UIHelpers.showToast(error.message || 'Error al cancelar la sesión', 'danger');
        } finally {
            UIHelpers.showButtonSpinner(submitBtn, false);
        }
    }

    async confirmReschedule() {
        if (!this.selectedSession) return;

        const submitBtn = document.getElementById('confirmRescheduleBtn');
        const newDate = document.getElementById('newDate').value;
        const newTime = document.getElementById('newTime').value;
        const reason = document.getElementById('rescheduleReason').value;

        if (!newDate || !newTime) {
            UIHelpers.showToast('Por favor selecciona nueva fecha y hora', 'warning');
            return;
        }

        try {
            UIHelpers.showButtonSpinner(submitBtn, true);

            const rescheduleData = {
                sessionId: this.selectedSession.id,
                newDate,
                newTime,
                reason
            };

            const response = await ApiClient.post('/sessions/reschedule', rescheduleData, true);
            
            if (response) {
                // Actualizar sesión local
                const sessionIndex = this.allSessions.findIndex(s => s.id === this.selectedSession.id);
                if (sessionIndex !== -1) {
                    this.allSessions[sessionIndex].date = newDate;
                    this.allSessions[sessionIndex].time = newTime;
                    this.allSessions[sessionIndex].status = 'pending';
                }

                UIHelpers.showToast('Solicitud de reprogramación enviada', 'success');
                
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('rescheduleModal'));
                modal.hide();
                
                // Actualizar vista
                this.updateStats();
                this.filterSessions(this.currentFilter);
                
                // Limpiar formulario
                document.getElementById('rescheduleForm').reset();
            } else {
                throw new Error('Error al reprogramar sesión');
            }

        } catch (error) {
            console.error('Reschedule session error:', error);
            UIHelpers.showToast(error.message || 'Error al reprogramar la sesión', 'danger');
        } finally {
            UIHelpers.showButtonSpinner(submitBtn, false);
        }
    }

    // ==================== ESTADOS DE CARGA ====================
    showLoadingState() {
        document.getElementById('sessionsContainer').innerHTML = `
            <div class="loading-state">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <h3 class="mt-3">Cargando tus sesiones...</h3>
                <p>Por favor espera un momento</p>
            </div>
        `;
    }

    showEmptyState() {
        const messages = {
            'all': {
                icon: 'calendar-x',
                title: 'No tienes sesiones registradas',
                description: 'Cuando agendes entrenamientos aparecerán aquí'
            },
            'upcoming': {
                icon: 'clock',
                title: 'No tienes sesiones próximas',
                description: 'Agenda una nueva sesión para comenzar a entrenar'
            },
            'completed': {
                icon: 'check-circle',
                title: 'Aún no has completado ninguna sesión',
                description: 'Tus entrenamientos completados aparecerán aquí'
            }
        };

        const message = messages[this.currentFilter] || messages['all'];

        document.getElementById('sessionsContainer').innerHTML = `
            <div class="empty-state">
                <i class="bi bi-${message.icon}"></i>
                <h3>${message.title}</h3>
                <p>${message.description}</p>
                <button class="btn btn-primary mt-3" onclick="window.location.href='index.html'">
                    <i class="bi bi-plus-circle me-2"></i>Buscar entrenamientos
                </button>
            </div>
        `;
    }

    showErrorState(message) {
        document.getElementById('sessionsContainer').innerHTML = `
            <div class="error-state">
                <i class="bi bi-exclamation-triangle text-danger"></i>
                <h3>Error al cargar sesiones</h3>
                <p>${message}</p>
                <button class="btn btn-primary mt-3" onclick="sesionesPageManager.loadSessions()">
                    <i class="bi bi-arrow-clockwise me-2"></i>Reintentar
                </button>
            </div>
        `;
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.sesionesPageManager = new SesionesPageManager();
});