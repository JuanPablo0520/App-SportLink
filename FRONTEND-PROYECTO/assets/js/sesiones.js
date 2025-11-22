/* assets/js/sesiones.js - Lógica específica para la página de sesiones (Cliente) */

class SesionesPageManager {
    constructor() {
        this.currentUser = null;
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
        if (!AuthManager.requireAuth()) return;
        this.currentUser = AuthManager.getUser();
        if (this.currentUser.tipoUsuario === 'entrenador') {
            window.location.href = 'sesiones-entrenador.html';
            return;
        }
        this.initializeEventListeners();
        this.loadSessions();
    }

    initializeEventListeners() {
        document.getElementById('filterAll')?.addEventListener('click', () => this.filterSessions('all'));
        document.getElementById('filterUpcoming')?.addEventListener('click', () => this.filterSessions('upcoming'));
        document.getElementById('filterCompleted')?.addEventListener('click', () => this.filterSessions('completed'));
        document.querySelectorAll('[data-sort]').forEach(item => {
            item.addEventListener('click', (e) => { e.preventDefault(); this.sortSessions(item.getAttribute('data-sort')); });
        });
        document.getElementById('newSessionBtn')?.addEventListener('click', () => { window.location.href = 'index.html'; });
        this.initializeModalHandlers();
    }

    initializeModalHandlers() {
        document.getElementById('confirmCancelBtn')?.addEventListener('click', () => this.confirmCancelSession());
        document.getElementById('confirmRescheduleBtn')?.addEventListener('click', () => this.confirmReschedule());
        document.getElementById('startChatBtn')?.addEventListener('click', () => this.startChat());
        const newDateInput = document.getElementById('newDate');
        if (newDateInput) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            newDateInput.min = tomorrow.toISOString().split('T')[0];
        }
    }

    async loadSessions() {
        try {
            this.showLoadingState();
            if (!this.currentUser?.idCliente) throw new Error('Usuario no autenticado');
            const idCliente = this.currentUser.idCliente;
            const estados = ['Pendiente', 'Confirmada', 'Activa', 'Completada', 'Finalizada'];
            const peticiones = estados.map(estado =>
                ApiClient.get(`/Sesion/obtener/idCliente/${idCliente}/estado/${estado}`)
            );
            const resultados = await Promise.all(peticiones);
            const todasLasSesiones = resultados.flat();
            if (!todasLasSesiones || todasLasSesiones.length === 0) {
                this.allSessions = [];
                this.updateStats();
                this.filterSessions(this.currentFilter);
                return;
            }
            this.allSessions = todasLasSesiones.map(sesion => this.mapSesionToView(sesion));
            this.updateStats();
            this.filterSessions(this.currentFilter);
        } catch (error) {
            console.error('Error loading sessions:', error);
            this.showErrorState('Error al cargar las sesiones');
        }
    }

    mapSesionToView(sesion) {
        const fechaHora = sesion.fechaHora ? new Date(sesion.fechaHora) : new Date();
        const fecha = fechaHora.toISOString().split('T')[0];
        const hora = fechaHora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const esFutura = fechaHora >= hoy;
        let status = 'upcoming';
        const estadoLower = (sesion.estado || '').toLowerCase();
        if (estadoLower === 'completada' || estadoLower === 'finalizada') {
            status = 'completed';
        } else if (estadoLower === 'cancelada') {
            status = 'cancelled';
        } else if (estadoLower === 'pendiente') {
            status = 'pending';
        } else if (esFutura) {
            status = 'upcoming';
        } else {
            status = 'completed';
        }
        return {
            id: sesion.idSesion,
            idSesion: sesion.idSesion,
            title: sesion.servicio?.nombre || 'Sesión de Entrenamiento',
            trainerName: sesion.entrenador ? `${sesion.entrenador.nombres} ${sesion.entrenador.apellidos}` : 'Entrenador',
            trainerAvatar: sesion.entrenador?.fotoPerfil || 'https://via.placeholder.com/60?text=E',
            trainerSpecialty: sesion.servicio?.deporte || '',
            trainerExperience: 5,
            trainerRating: 4.5,
            location: sesion.servicio?.ubicacion || 'Ubicación no especificada',
            date: fecha,
            dateTime: sesion.fechaHora,
            time: hora,
            price: sesion.servicio?.precio || 0,
            sport: sesion.servicio?.deporte || '',
            duration: sesion.servicio?.duracion || 60,
            status: status,
            description: sesion.servicio?.descripcion || '',
            entrenadorEmail: sesion.entrenador?.correo || '',
            entrenadorId: sesion.entrenador?.idEntrenador,
            servicioId: sesion.servicio?.idServicio,
            clienteId: sesion.cliente?.idCliente
        };
    }

    updateStats() {
        const total = this.allSessions.length;
        const upcoming = this.allSessions.filter(s => s.status === 'upcoming' || s.status === 'pending').length;
        const completed = this.allSessions.filter(s => s.status === 'completed').length;
        document.getElementById('totalSessions').textContent = total;
        document.getElementById('upcomingSessions').textContent = upcoming;
        document.getElementById('completedSessions').textContent = completed;
    }

    filterSessions(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-buttons .btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(`filter${filter.charAt(0).toUpperCase() + filter.slice(1)}`);
        if (activeBtn) activeBtn.classList.add('active');
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
                case 'date-desc': return new Date(b.date) - new Date(a.date);
                case 'date-asc': return new Date(a.date) - new Date(b.date);
                case 'price-desc': return b.price - a.price;
                case 'price-asc': return a.price - b.price;
                case 'trainer': return a.trainerName.localeCompare(b.trainerName);
                default: return 0;
            }
        });
        this.currentPage = 1;
        this.renderSessions();
    }

    renderSessions() {
        const container = document.getElementById('sessionsContainer');
        if (this.filteredSessions.length === 0) { this.showEmptyState(); return; }
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const sessionsToShow = this.filteredSessions.slice(startIndex, endIndex);
        let html = '';
        sessionsToShow.forEach((session, index) => { html += this.createSessionCard(session, startIndex + index); });
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
                    <div class="session-detail"><i class="bi bi-person session-detail-icon"></i><span><strong>Entrenador:</strong> ${session.trainerName}</span></div>
                    <div class="session-detail"><i class="bi bi-calendar-event session-detail-icon"></i><span><strong>Fecha:</strong> ${UIHelpers.formatDate(session.date)}</span></div>
                    <div class="session-detail"><i class="bi bi-clock session-detail-icon"></i><span><strong>Hora:</strong> ${session.time}</span></div>
                    <div class="session-detail"><i class="bi bi-geo-alt session-detail-icon"></i><span><strong>Ubicación:</strong> ${session.location}</span></div>
                    <div class="session-detail"><i class="bi bi-cash-coin session-detail-icon"></i><span><strong>Precio:</strong> ${UIHelpers.formatPrice(session.price)}</span></div>
                    <div class="session-actions">
                        <button class="btn btn-outline-primary btn-sm" onclick="sesionesPageManager.showSessionDetails('${session.id}')"><i class="bi bi-info-circle"></i> Detalles</button>
                        ${isUpcoming ? `<button class="btn btn-primary btn-sm" onclick="sesionesPageManager.startChat('${session.id}')"><i class="bi bi-chat-dots"></i> Chat</button>` : ''}
                        ${canModify ? `<button class="btn btn-warning btn-sm" onclick="sesionesPageManager.rescheduleSession('${session.id}')"><i class="bi bi-calendar"></i> Reprogramar</button><button class="btn btn-outline-danger btn-sm" onclick="sesionesPageManager.cancelSession('${session.id}')"><i class="bi bi-x-circle"></i> Cancelar</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    getSportIcon(sport) {
        const icons = { 'Fútbol': 'bi-dribbble', 'Tenis': 'bi-circle', 'Natación': 'bi-water', 'Yoga': 'bi-heart', 'CrossFit': 'bi-lightning', 'Boxeo': 'bi-shield', 'Baloncesto': 'bi-dribbble' };
        return icons[sport] || 'bi-trophy';
    }

    getStatusClass(status) {
        const classes = { 'upcoming': 'upcoming', 'completed': 'completed', 'cancelled': 'cancelled', 'pending': 'pending' };
        return classes[status] || 'upcoming';
    }

    getStatusText(status) {
        const texts = { 'upcoming': 'Próxima', 'completed': 'Completada', 'cancelled': 'Cancelada', 'pending': 'Pendiente' };
        return texts[status] || 'Desconocido';
    }

    updatePagination() {
        const paginationContainer = document.getElementById('paginationContainer');
        const totalPages = Math.ceil(this.filteredSessions.length / this.itemsPerPage);
        if (totalPages <= 1) { paginationContainer.classList.add('d-none'); return; }
        paginationContainer.classList.remove('d-none');
        const pagination = paginationContainer.querySelector('.pagination');
        let html = `<li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="sesionesPageManager.goToPage(${this.currentPage - 1})"><i class="bi bi-chevron-left"></i></a></li>`;
        for (let i = 1; i <= totalPages; i++) { html += `<li class="page-item ${i === this.currentPage ? 'active' : ''}"><a class="page-link" href="#" onclick="sesionesPageManager.goToPage(${i})">${i}</a></li>`; }
        html += `<li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" onclick="sesionesPageManager.goToPage(${this.currentPage + 1})"><i class="bi bi-chevron-right"></i></a></li>`;
        pagination.innerHTML = html;
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredSessions.length / this.itemsPerPage);
        if (page < 1 || page > totalPages) return;
        this.currentPage = page;
        this.renderSessions();
        document.querySelector('.sessions-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    showSessionDetails(sessionId) {
        const session = this.allSessions.find(s => String(s.id) === String(sessionId));
        if (!session) return;
        this.selectedSession = session;
        const modalBody = document.getElementById('sessionDetailBody');
        modalBody.innerHTML = `
            <div class="trainer-info">
                <img src="${session.trainerAvatar}" alt="${session.trainerName}" class="trainer-avatar">
                <div class="trainer-details"><h5>${session.trainerName}</h5><p>${session.trainerSpecialty}</p><small class="text-muted">${session.trainerExperience || 5} años de experiencia</small></div>
                <div class="trainer-rating"><div class="star-rating">${this.renderStars(session.trainerRating || 4.5)}</div><span class="rating-number">${session.trainerRating || 4.5}</span></div>
            </div>
            <div class="session-detail-grid">
                <div class="detail-item"><h6>Deporte</h6><p><i class="bi ${this.getSportIcon(session.sport)} me-2"></i>${session.sport}</p></div>
                <div class="detail-item"><h6>Fecha y Hora</h6><p><i class="bi bi-calendar-event me-2"></i>${UIHelpers.formatDate(session.date)} - ${session.time}</p></div>
                <div class="detail-item"><h6>Duración</h6><p><i class="bi bi-clock me-2"></i>${session.duration} minutos</p></div>
                <div class="detail-item"><h6>Precio</h6><p><i class="bi bi-cash-coin me-2"></i>${UIHelpers.formatPrice(session.price)}</p></div>
                <div class="detail-item"><h6>Ubicación</h6><p><i class="bi bi-geo-alt me-2"></i>${session.location}</p></div>
                <div class="detail-item"><h6>Estado</h6><p><span class="badge session-status ${this.getStatusClass(session.status)}">${this.getStatusText(session.status)}</span></p></div>
            </div>
            ${session.description ? `<div class="alert alert-info"><h6><i class="bi bi-info-circle me-2"></i>Descripción de la sesión</h6><p class="mb-0">${session.description}</p></div>` : ''}
        `;
        const isUpcoming = session.status === 'upcoming' || session.status === 'pending';
        const canModify = isUpcoming && new Date(session.date) > new Date();
        document.getElementById('startChatBtn').classList.toggle('d-none', !isUpcoming);
        document.getElementById('cancelSessionBtn').classList.toggle('d-none', !canModify);
        document.getElementById('rescheduleBtn').classList.toggle('d-none', !canModify);
        const modal = new bootstrap.Modal(document.getElementById('sessionDetailModal'));
        modal.show();
    }

    renderStars(rating) {
        let html = '';
        for (let i = 1; i <= 5; i++) html += `<i class="bi ${i <= rating ? 'bi-star-fill' : 'bi-star'}"></i>`;
        return html;
    }

    startChat(sessionId = null) {
        const id = sessionId || this.selectedSession?.id;
        if (id) window.location.href = `chat.html?session=${id}`;
    }

    cancelSession(sessionId) {
        const session = this.allSessions.find(s => String(s.id) === String(sessionId));
        if (!session) return;
        this.selectedSession = session;
        const modal = new bootstrap.Modal(document.getElementById('cancelSessionModal'));
        modal.show();
    }

    rescheduleSession(sessionId) {
        const session = this.allSessions.find(s => String(s.id) === String(sessionId));
        if (!session) return;
        this.selectedSession = session;
        const modal = new bootstrap.Modal(document.getElementById('rescheduleModal'));
        modal.show();
    }

    async confirmCancelSession() {
        if (!this.selectedSession) return;
        const submitBtn = document.getElementById('confirmCancelBtn');
        const reason = document.getElementById('cancelReason').value;
        if (!reason) { UIHelpers.showToast('Por favor selecciona un motivo de cancelación', 'warning'); return; }
        try {
            UIHelpers.showButtonSpinner(submitBtn, true);
            const updateData = {
                idSesion: this.selectedSession.id,
                fechaHora: this.selectedSession.dateTime,
                estado: 'Cancelada',
                cliente: { idCliente: this.selectedSession.clienteId || this.currentUser.idCliente },
                entrenador: { idEntrenador: this.selectedSession.entrenadorId },
                servicio: { idServicio: this.selectedSession.servicioId }
            };
            const response = await ApiClient.put('/Sesion/actualizar', updateData);
            if (response) {
                const sessionIndex = this.allSessions.findIndex(s => String(s.id) === String(this.selectedSession.id));
                if (sessionIndex !== -1) this.allSessions[sessionIndex].status = 'cancelled';
                UIHelpers.showToast('Sesión cancelada exitosamente', 'success');
                const modal = bootstrap.Modal.getInstance(document.getElementById('cancelSessionModal'));
                modal.hide();
                this.updateStats();
                this.filterSessions(this.currentFilter);
                document.getElementById('cancelSessionForm').reset();
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
        if (!newDate || !newTime) { UIHelpers.showToast('Por favor selecciona nueva fecha y hora', 'warning'); return; }
        try {
            UIHelpers.showButtonSpinner(submitBtn, true);
            const fechaHora = `${newDate}T${newTime}:00`;
            const updateData = {
                idSesion: this.selectedSession.id,
                fechaHora: fechaHora,
                estado: 'Pendiente',
                cliente: { idCliente: this.selectedSession.clienteId || this.currentUser.idCliente },
                entrenador: { idEntrenador: this.selectedSession.entrenadorId },
                servicio: { idServicio: this.selectedSession.servicioId }
            };
            const response = await ApiClient.put('/Sesion/actualizar', updateData);
            if (response) {
                const sessionIndex = this.allSessions.findIndex(s => String(s.id) === String(this.selectedSession.id));
                if (sessionIndex !== -1) {
                    this.allSessions[sessionIndex].date = newDate;
                    this.allSessions[sessionIndex].time = newTime;
                    this.allSessions[sessionIndex].status = 'pending';
                }
                UIHelpers.showToast('Solicitud de reprogramación enviada', 'success');
                const modal = bootstrap.Modal.getInstance(document.getElementById('rescheduleModal'));
                modal.hide();
                this.updateStats();
                this.filterSessions(this.currentFilter);
                document.getElementById('rescheduleForm').reset();
            }
        } catch (error) {
            console.error('Reschedule session error:', error);
            UIHelpers.showToast(error.message || 'Error al reprogramar la sesión', 'danger');
        } finally {
            UIHelpers.showButtonSpinner(submitBtn, false);
        }
    }

    showLoadingState() {
        document.getElementById('sessionsContainer').innerHTML = `<div class="loading-state text-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div><p class="mt-3 text-muted">Cargando tus sesiones...</p></div>`;
    }

    showEmptyState() {
        const messages = {
            'all': { icon: 'calendar-x', title: 'No tienes sesiones registradas', description: 'Cuando agendes entrenamientos aparecerán aquí' },
            'upcoming': { icon: 'clock', title: 'No tienes sesiones próximas', description: 'Agenda una nueva sesión para comenzar a entrenar' },
            'completed': { icon: 'check-circle', title: 'Aún no has completado ninguna sesión', description: 'Tus entrenamientos completados aparecerán aquí' }
        };
        const message = messages[this.currentFilter] || messages['all'];
        document.getElementById('sessionsContainer').innerHTML = `<div class="empty-state"><i class="bi bi-${message.icon}"></i><h3>${message.title}</h3><p>${message.description}</p><button class="btn btn-primary mt-3" onclick="window.location.href='index.html'"><i class="bi bi-plus-circle me-2"></i>Buscar entrenamientos</button></div>`;
    }

    showErrorState(message) {
        document.getElementById('sessionsContainer').innerHTML = `<div class="error-state"><i class="bi bi-exclamation-triangle text-danger"></i><h3>Error al cargar sesiones</h3><p>${message}</p><button class="btn btn-primary mt-3" onclick="sesionesPageManager.loadSessions()"><i class="bi bi-arrow-clockwise me-2"></i>Reintentar</button></div>`;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    window.sesionesPageManager = new SesionesPageManager();
});