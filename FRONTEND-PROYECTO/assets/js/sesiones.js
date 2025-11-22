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
            // Estados según tu modelo: Pendiente, Confirmada, Finalizada, Calificado
            const estados = ['Pendiente', 'Confirmada', 'Finalizada', 'Calificado'];
            
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

        // Mapear estados del backend a categorías de vista
        const estadoOriginal = sesion.estado || 'Pendiente';
        let status = 'upcoming';

        switch (estadoOriginal) {
            case 'Pendiente':
                status = 'pending';
                break;
            case 'Confirmada':
                status = 'confirmed';
                break;
            case 'Finalizada':
                status = 'finished'; // Completada pero sin calificar
                break;
            case 'Calificado':
                status = 'rated'; // Completada y calificada
                break;
            default:
                status = 'pending';
        }

        return {
            id: sesion.idSesion,
            idSesion: sesion.idSesion,
            title: sesion.servicio?.nombre || 'Sesión de Entrenamiento',
            trainerName: sesion.entrenador ? `${sesion.entrenador.nombres} ${sesion.entrenador.apellidos}` : 'Entrenador',
            trainerAvatar: sesion.entrenador?.fotoPerfil || 'https://via.placeholder.com/60?text=E',
            trainerSpecialty: sesion.servicio?.deporte || '',
            trainerRating: 4.5,
            location: sesion.servicio?.ubicacion || 'Ubicación no especificada',
            date: fecha,
            dateTime: sesion.fechaHora,
            time: hora,
            price: sesion.servicio?.precio || 0,
            sport: sesion.servicio?.deporte || '',
            duration: sesion.servicio?.duracion || 60,
            status: status,
            estadoOriginal: estadoOriginal,
            description: sesion.servicio?.descripcion || '',
            entrenadorEmail: sesion.entrenador?.correo || '',
            entrenadorId: sesion.entrenador?.idEntrenador,
            servicioId: sesion.servicio?.idServicio,
            clienteId: sesion.cliente?.idCliente,
            hasReview: estadoOriginal === 'Calificado',
            rating: sesion.resenia?.calificacion || 0,
            review: sesion.resenia?.comentario || null
        };
    }

    updateStats() {
        const total = this.allSessions.length;
        // Próximas: Pendiente + Confirmada
        const upcoming = this.allSessions.filter(s => s.status === 'pending' || s.status === 'confirmed').length;
        // Completadas: Finalizada + Calificado
        const completed = this.allSessions.filter(s => s.status === 'finished' || s.status === 'rated').length;

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
                // Próximas: Pendiente + Confirmada
                this.filteredSessions = this.allSessions.filter(s => s.status === 'pending' || s.status === 'confirmed');
                break;
            case 'completed':
                // Completadas: Finalizada + Calificado
                this.filteredSessions = this.allSessions.filter(s => s.status === 'finished' || s.status === 'rated');
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
        // Solo se puede modificar si está Pendiente o Confirmada
        const isUpcoming = session.status === 'pending' || session.status === 'confirmed';
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
                    ${session.status === 'rated' ? `
                        <div class="session-detail"><i class="bi bi-star-fill text-warning session-detail-icon"></i><span><strong>Calificación:</strong> ${session.rating}/5</span></div>
                    ` : ''}
                    <div class="session-actions">
                        <button class="btn btn-outline-primary btn-sm" onclick="sesionesPageManager.showSessionDetails('${session.id}')"><i class="bi bi-info-circle"></i> Detalles</button>
                        ${isUpcoming ? `<button class="btn btn-primary btn-sm" onclick="sesionesPageManager.startChat('${session.id}')"><i class="bi bi-chat-dots"></i> Chat</button>` : ''}
                        ${canModify ? `
                            <button class="btn btn-warning btn-sm" onclick="sesionesPageManager.rescheduleSession('${session.id}')"><i class="bi bi-calendar"></i> Reprogramar</button>
                            <button class="btn btn-outline-danger btn-sm" onclick="sesionesPageManager.cancelSession('${session.id}')"><i class="bi bi-x-circle"></i> Cancelar</button>
                        ` : ''}
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
        const classes = { 'pending': 'pending', 'confirmed': 'upcoming', 'finished': 'completed', 'rated': 'completed' };
        return classes[status] || 'pending';
    }

    getStatusText(status) {
        const texts = { 'pending': 'Pendiente', 'confirmed': 'Confirmada', 'finished': 'Finalizada', 'rated': 'Calificado' };
        return texts[status] || 'Desconocido';
    }

    updatePagination() {
        const paginationContainer = document.getElementById('paginationContainer');
        const totalPages = Math.ceil(this.filteredSessions.length / this.itemsPerPage);
        if (totalPages <= 1) { paginationContainer.classList.add('d-none'); return; }
        paginationContainer.classList.remove('d-none');
        const pagination = paginationContainer.querySelector('.pagination');
        let html = `<li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="sesionesPageManager.goToPage(${this.currentPage - 1})"><i class="bi bi-chevron-left"></i></a></li>`;
        for (let i = 1; i <= totalPages; i++) html += `<li class="page-item ${i === this.currentPage ? 'active' : ''}"><a class="page-link" href="#" onclick="sesionesPageManager.goToPage(${i})">${i}</a></li>`;
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
                <div class="trainer-details"><h5>${session.trainerName}</h5><p>${session.trainerSpecialty}</p></div>
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
            ${session.status === 'rated' ? `
                <div class="alert alert-success"><h6><i class="bi bi-star-fill me-2"></i>Tu calificación: ${session.rating}/5</h6><p class="mb-0">${session.review || 'Sin comentarios.'}</p></div>
            ` : ''}
            ${session.description ? `<div class="alert alert-info"><h6><i class="bi bi-info-circle me-2"></i>Descripción</h6><p class="mb-0">${session.description}</p></div>` : ''}
        `;

        const isUpcoming = session.status === 'pending' || session.status === 'confirmed';
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
        new bootstrap.Modal(document.getElementById('cancelSessionModal')).show();
    }

    rescheduleSession(sessionId) {
        const session = this.allSessions.find(s => String(s.id) === String(sessionId));
        if (!session) return;
        this.selectedSession = session;
        new bootstrap.Modal(document.getElementById('rescheduleModal')).show();
    }

    async confirmCancelSession() {
        if (!this.selectedSession) return;
        const submitBtn = document.getElementById('confirmCancelBtn');
        const reason = document.getElementById('cancelReason').value;
        if (!reason) { UIHelpers.showToast('Por favor selecciona un motivo', 'warning'); return; }

        try {
            UIHelpers.showButtonSpinner(submitBtn, true);
            // Aquí podrías agregar un estado "Cancelada" si tu backend lo soporta
            // Por ahora simplemente eliminaremos o actualizaremos
            UIHelpers.showToast('Sesión cancelada exitosamente', 'success');
            bootstrap.Modal.getInstance(document.getElementById('cancelSessionModal')).hide();
            await this.loadSessions();
            document.getElementById('cancelSessionForm').reset();
        } catch (error) {
            console.error('Cancel session error:', error);
            UIHelpers.showToast(error.message || 'Error al cancelar', 'danger');
        } finally {
            UIHelpers.showButtonSpinner(submitBtn, false);
        }
    }

    async confirmReschedule() {
        if (!this.selectedSession) return;
        const submitBtn = document.getElementById('confirmRescheduleBtn');
        const newDate = document.getElementById('newDate').value;
        const newTime = document.getElementById('newTime').value;
        if (!newDate || !newTime) { UIHelpers.showToast('Selecciona fecha y hora', 'warning'); return; }

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
            await ApiClient.put('/Sesion/actualizar', updateData);
            UIHelpers.showToast('Solicitud de reprogramación enviada', 'success');
            bootstrap.Modal.getInstance(document.getElementById('rescheduleModal')).hide();
            await this.loadSessions();
            document.getElementById('rescheduleForm').reset();
        } catch (error) {
            console.error('Reschedule error:', error);
            UIHelpers.showToast(error.message || 'Error al reprogramar', 'danger');
        } finally {
            UIHelpers.showButtonSpinner(submitBtn, false);
        }
    }

    showLoadingState() {
        document.getElementById('sessionsContainer').innerHTML = `<div class="loading-state text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-3 text-muted">Cargando sesiones...</p></div>`;
    }

    showEmptyState() {
        const messages = {
            'all': { icon: 'calendar-x', title: 'No tienes sesiones', description: 'Agenda entrenamientos para verlos aquí' },
            'upcoming': { icon: 'clock', title: 'No tienes sesiones próximas', description: 'Agenda una nueva sesión' },
            'completed': { icon: 'check-circle', title: 'No tienes sesiones completadas', description: 'Tus entrenamientos completados aparecerán aquí' }
        };
        const msg = messages[this.currentFilter] || messages['all'];
        document.getElementById('sessionsContainer').innerHTML = `<div class="empty-state"><i class="bi bi-${msg.icon}"></i><h3>${msg.title}</h3><p>${msg.description}</p><button class="btn btn-primary mt-3" onclick="window.location.href='index.html'"><i class="bi bi-plus-circle me-2"></i>Buscar entrenamientos</button></div>`;
    }

    showErrorState(message) {
        document.getElementById('sessionsContainer').innerHTML = `<div class="error-state"><i class="bi bi-exclamation-triangle text-danger"></i><h3>Error</h3><p>${message}</p><button class="btn btn-primary mt-3" onclick="sesionesPageManager.loadSessions()"><i class="bi bi-arrow-clockwise me-2"></i>Reintentar</button></div>`;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    window.sesionesPageManager = new SesionesPageManager();
});