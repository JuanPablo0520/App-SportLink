/* assets/js/perfil.js - Lógica específica para la página de perfil */

class PerfilPageManager {
    constructor() {
        this.currentUser = null;
        this.originalFormData = {};
        this.scheduledSessions = [];
        this.completedSessions = [];
        this.sessionFilters = 'all'; // 'all', 'pending'
        
        this.init();
    }

    init() {
        // Verificar autenticación
        if (!AuthManager.requireAuth()) {
            return;
        }

        this.currentUser = AuthManager.getUser();
        this.initializeEventListeners();
        this.loadUserProfile();
        this.loadScheduledSessions();
        this.loadCompletedSessions();
    }

    // ==================== EVENT LISTENERS ====================
    initializeEventListeners() {
        // Formulario de perfil
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        }

        // Botón cancelar cambios
        const cancelBtn = document.getElementById('cancelChangesBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.resetFormData());
        }

        // Formulario de cambio de contraseña
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => this.handlePasswordChange(e));
        }

        // Avatar
        this.initializeAvatarHandlers();

        // Filtros de sesiones completadas
        const filterPending = document.getElementById('filterPending');
        const filterAll = document.getElementById('filterAll');
        
        if (filterPending && filterAll) {
            filterPending.addEventListener('click', () => this.filterCompletedSessions('pending'));
            filterAll.addEventListener('click', () => this.filterCompletedSessions('all'));
        }

        // Listeners para tabs
        const tabTriggers = document.querySelectorAll('#perfilTabs button[data-bs-toggle="tab"]');
        tabTriggers.forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                const target = e.target.getAttribute('data-bs-target');
                if (target === '#agendadas' && this.scheduledSessions.length === 0) {
                    this.loadScheduledSessions();
                } else if (target === '#completadas' && this.completedSessions.length === 0) {
                    this.loadCompletedSessions();
                }
            });
        });
    }

    initializeAvatarHandlers() {
        const changeAvatarBtn = document.getElementById('changeAvatarBtn');
        const avatarFile = document.getElementById('avatarFile');
        const avatarPreview = document.getElementById('avatarPreview');
        const saveAvatarBtn = document.getElementById('saveAvatarBtn');

        if (changeAvatarBtn) {
            changeAvatarBtn.addEventListener('click', () => {
                const modal = new bootstrap.Modal(document.getElementById('avatarModal'));
                modal.show();
            });
        }

        if (avatarFile) {
            avatarFile.addEventListener('change', (e) => this.handleAvatarPreview(e));
        }

        if (saveAvatarBtn) {
            saveAvatarBtn.addEventListener('click', () => this.handleAvatarUpload());
        }
    }

    // ==================== CARGA DE DATOS ====================
    async loadUserProfile() {
        try {
            // TODO: Reemplazar con llamada real al API
            // const userData = await ApiClient.get('/user/profile', true);
            
            // Simulación temporal
            const userData = await this.simulateGetUserProfile();
            
            this.populateUserData(userData);
            this.originalFormData = this.getFormData();

        } catch (error) {
            console.error('Error loading user profile:', error);
            UIHelpers.showToast('Error al cargar el perfil de usuario', 'danger');
        }
    }

    populateUserData(userData) {
        // Actualizar header
        document.getElementById('profileName').textContent = `${userData.firstName} ${userData.lastName}`;
        document.getElementById('memberSince').textContent = `Miembro desde: ${UIHelpers.formatDate(userData.memberSince)}`;
        
        if (userData.avatar) {
            document.getElementById('profileAvatar').src = userData.avatar;
        }

        // Llenar formulario
        document.getElementById('firstName').value = userData.firstName || '';
        document.getElementById('lastName').value = userData.lastName || '';
        document.getElementById('email').value = userData.email || '';
        document.getElementById('phone').value = userData.phone || '';
        document.getElementById('birthDate').value = userData.birthDate || '';
        document.getElementById('location').value = userData.location || '';
        document.getElementById('weight').value = userData.weight || '';
        document.getElementById('height').value = userData.height || '';
        document.getElementById('bio').value = userData.bio || '';
    }

    async loadScheduledSessions() {
        const container = document.getElementById('agendadasContainer');
        
        try {
            // TODO: Reemplazar con llamada real al API
            // const sessions = await ApiClient.get('/user/sessions/scheduled', true);
            
            // Simulación temporal
            const sessions = await this.simulateGetScheduledSessions();
            
            this.scheduledSessions = sessions;
            this.renderScheduledSessions(sessions);

        } catch (error) {
            console.error('Error loading scheduled sessions:', error);
            container.innerHTML = this.getErrorState('Error al cargar las sesiones agendadas');
        }
    }

    async loadCompletedSessions() {
        const container = document.getElementById('completadasContainer');
        
        try {
            // TODO: Reemplazar con llamada real al API
            // const sessions = await ApiClient.get('/user/sessions/completed', true);
            
            // Simulación temporal
            const sessions = await this.simulateGetCompletedSessions();
            
            this.completedSessions = sessions;
            this.renderCompletedSessions(sessions);

        } catch (error) {
            console.error('Error loading completed sessions:', error);
            container.innerHTML = this.getErrorState('Error al cargar las sesiones completadas');
        }
    }

    // ==================== MANEJO DE FORMULARIOS ====================
    async handleProfileUpdate(e) {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const spinner = document.getElementById('saveSpinner');
        
        try {
            if (!Validator.validateForm(e.target)) {
                UIHelpers.showToast('Por favor corrige los errores en el formulario', 'warning');
                return;
            }

            UIHelpers.showButtonSpinner(submitBtn, true);

            const formData = this.getFormData();
            
            // TODO: Reemplazar con llamada real al API
            // const response = await ApiClient.put('/user/profile', formData, true);
            
            // Simulación temporal
            const response = await this.simulateUpdateProfile(formData);
            
            if (response.success) {
                // Actualizar datos originales
                this.originalFormData = formData;
                
                // Actualizar datos en AuthManager
                const user = AuthManager.getUser();
                AuthManager.login(AuthManager.getToken(), { ...user, ...formData });
                
                UIHelpers.showToast('Perfil actualizado exitosamente', 'success');
                
                // Actualizar header
                document.getElementById('profileName').textContent = `${formData.firstName} ${formData.lastName}`;
            } else {
                throw new Error(response.message || 'Error al actualizar perfil');
            }

        } catch (error) {
            console.error('Profile update error:', error);
            UIHelpers.showToast(error.message || 'Error al actualizar el perfil', 'danger');
        } finally {
            UIHelpers.showButtonSpinner(submitBtn, false);
        }
    }

    async handlePasswordChange(e) {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const spinner = document.getElementById('passwordSpinner');
        
        try {
            if (!Validator.validateForm(e.target)) {
                UIHelpers.showToast('Por favor corrige los errores en el formulario', 'warning');
                return;
            }

            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmNewPassword').value;

            // Validar que las contraseñas coincidan
            if (!Validator.passwordsMatch(newPassword, confirmPassword)) {
                UIHelpers.showToast('Las contraseñas nuevas no coinciden', 'danger');
                return;
            }

            UIHelpers.showButtonSpinner(submitBtn, true);

            const passwordData = {
                currentPassword,
                newPassword
            };

            // TODO: Reemplazar con llamada real al API
            // const response = await ApiClient.put('/user/password', passwordData, true);
            
            // Simulación temporal
            const response = await this.simulateChangePassword(passwordData);
            
            if (response.success) {
                UIHelpers.showToast('Contraseña cambiada exitosamente', 'success');
                document.getElementById('passwordForm').reset();
            } else {
                throw new Error(response.message || 'Error al cambiar contraseña');
            }

        } catch (error) {
            console.error('Password change error:', error);
            UIHelpers.showToast(error.message || 'Error al cambiar la contraseña', 'danger');
        } finally {
            UIHelpers.showButtonSpinner(submitBtn, false);
        }
    }

    resetFormData() {
        UIHelpers.showConfirmModal(
            'Descartar cambios',
            '¿Estás seguro que deseas descartar todos los cambios realizados?',
            () => {
                // Restaurar datos originales
                Object.keys(this.originalFormData).forEach(key => {
                    const input = document.getElementById(key);
                    if (input) {
                        input.value = this.originalFormData[key] || '';
                        input.classList.remove('is-valid', 'is-invalid');
                    }
                });
                
                UIHelpers.showToast('Cambios descartados', 'info');
            }
        );
    }

    getFormData() {
        return {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            birthDate: document.getElementById('birthDate').value,
            location: document.getElementById('location').value,
            weight: document.getElementById('weight').value,
            height: document.getElementById('height').value,
            bio: document.getElementById('bio').value.trim()
        };
    }

    // ==================== MANEJO DE AVATAR ====================
    handleAvatarPreview(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('avatarPreview');
        const saveBtn = document.getElementById('saveAvatarBtn');
        
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
                preview.style.display = 'block';
                saveBtn.disabled = false;
            };
            reader.readAsDataURL(file);
        } else {
            preview.style.display = 'none';
            saveBtn.disabled = true;
        }
    }

    async handleAvatarUpload() {
        const fileInput = document.getElementById('avatarFile');
        const saveBtn = document.getElementById('saveAvatarBtn');
        const spinner = document.getElementById('avatarSpinner');
        
        if (!fileInput.files[0]) return;

        try {
            UIHelpers.showButtonSpinner(saveBtn, true);

            const formData = new FormData();
            formData.append('avatar', fileInput.files[0]);

            // TODO: Reemplazar con llamada real al API
            // const response = await ApiClient.post('/user/avatar', formData, true);
            
            // Simulación temporal
            const response = await this.simulateUploadAvatar(formData);
            
            if (response.success) {
                // Actualizar avatar en la página
                document.getElementById('profileAvatar').src = response.avatarUrl;
                
                UIHelpers.showToast('Foto de perfil actualizada', 'success');
                
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('avatarModal'));
                modal.hide();
                
                // Limpiar formulario
                fileInput.value = '';
                document.getElementById('avatarPreview').style.display = 'none';
                saveBtn.disabled = true;
            } else {
                throw new Error(response.message || 'Error al subir imagen');
            }

        } catch (error) {
            console.error('Avatar upload error:', error);
            UIHelpers.showToast(error.message || 'Error al subir la imagen', 'danger');
        } finally {
            UIHelpers.showButtonSpinner(saveBtn, false);
        }
    }

    // ==================== RENDERIZADO DE SESIONES ====================
    renderScheduledSessions(sessions) {
        const container = document.getElementById('agendadasContainer');
        
        if (!sessions || sessions.length === 0) {
            container.innerHTML = this.getEmptyState(
                'calendar-x',
                'No tienes sesiones agendadas',
                'Cuando agendes entrenamientos aparecerán aquí'
            );
            return;
        }

        let html = '<div class="list-group">';
        
        sessions.forEach(session => {
            html += `
                <div class="list-group-item list-group-item-action slide-in-left">
                    <div class="d-flex w-100 justify-content-between align-items-start">
                        <div>
                            <h5 class="mb-1">${session.title}</h5>
                            <p class="mb-1 text-muted">
                                <i class="bi bi-person session-icon"></i> ${session.trainerName}
                            </p>
                            <p class="mb-1 text-muted">
                                <i class="bi bi-geo-alt session-icon"></i> ${session.location}
                            </p>
                            <small class="text-muted">
                                <i class="bi bi-clock session-icon"></i> ${UIHelpers.formatDate(session.date)} - ${session.time}
                            </small>
                        </div>
                        <div class="text-end">
                            <span class="badge badge-session">${session.time}</span>
                            <div class="mt-2">
                                <small class="text-success fw-bold">${UIHelpers.formatPrice(session.price)}</small>
                            </div>
                        </div>
                    </div>
                    <div class="mt-2">
                        <button class="btn btn-sm btn-primary me-2" onclick="window.location.href='chat.html?session=${session.id}'">
                            <i class="bi bi-chat-dots"></i> Chat
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="perfilPageManager.showSessionDetails('${session.id}')">
                            <i class="bi bi-info-circle"></i> Detalles
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    renderCompletedSessions(sessions) {
        const container = document.getElementById('completadasContainer');
        
        // Filtrar sesiones según filtro activo
        let filteredSessions = sessions;
        if (this.sessionFilters === 'pending') {
            filteredSessions = sessions.filter(session => !session.hasReview);
        }
        
        if (!filteredSessions || filteredSessions.length === 0) {
            const message = this.sessionFilters === 'pending' 
                ? 'No tienes sesiones pendientes de evaluar'
                : 'Aún no has completado ninguna sesión';
            const description = this.sessionFilters === 'pending'
                ? 'Todas tus sesiones han sido evaluadas'
                : 'Cuando completes entrenamientos aparecerán aquí';
                
            container.innerHTML = this.getEmptyState('check-circle', message, description);
            return;
        }

        let html = '';
        
        filteredSessions.forEach(session => {
            html += `
                <div class="session-card fade-in">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <h5 class="card-title">${session.title}</h5>
                            <span class="badge bg-success">Completada</span>
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <div class="session-detail">
                                    <span class="session-icon"><i class="bi bi-person"></i></span>
                                    <span>${session.trainerName}</span>
                                </div>
                                <div class="session-detail">
                                    <span class="session-icon"><i class="bi bi-calendar-event"></i></span>
                                    <span>${UIHelpers.formatDate(session.date)}</span>
                                </div>
                                <div class="session-detail">
                                    <span class="session-icon"><i class="bi bi-cash-coin"></i></span>
                                    <span>${UIHelpers.formatPrice(session.price)} por sesión</span>
                                </div>
                            </div>
                            <div class="col-md-6 text-end">
                                ${session.hasReview ? `
                                    <div class="star-rating mb-2">
                                        ${this.renderStars(session.rating)}
                                    </div>
                                    <small class="text-muted">${session.rating}/5 estrellas</small>
                                ` : `
                                    <small class="text-warning">Pendiente de evaluar</small>
                                `}
                            </div>
                        </div>
                        
                        ${!session.hasReview ? `
                            <form class="evaluation-form" onsubmit="perfilPageManager.submitEvaluation(event, '${session.id}')">
                                <div class="mb-3">
                                    <label class="form-label">Tu calificación:</label>
                                    <div class="rating-input" data-session="${session.id}">
                                        ${[1,2,3,4,5].map(star => `
                                            <i class="bi bi-star rating-star" data-rating="${star}"></i>
                                        `).join('')}
                                    </div>
                                    <input type="hidden" class="rating-value" value="0">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Tu comentario:</label>
                                    <textarea class="form-control" rows="3" placeholder="¿Cómo fue tu experiencia?" required></textarea>
                                </div>
                                <button type="submit" class="btn btn-primary w-100">
                                    <span class="spinner-border spinner-border-sm d-none me-2"></span>
                                    Enviar evaluación
                                </button>
                            </form>
                        ` : `
                            <div class="alert alert-light">
                                <strong>Tu comentario:</strong><br>
                                ${session.review || 'Sin comentarios adicionales.'}
                            </div>
                        `}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Inicializar rating stars
        this.initializeRatingStars();
    }

    renderStars(rating) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                html += '<i class="bi bi-star-fill"></i>';
            } else {
                html += '<i class="bi bi-star"></i>';
            }
        }
        return html;
    }

    initializeRatingStars() {
        const ratingContainers = document.querySelectorAll('.rating-input');
        
        ratingContainers.forEach(container => {
            const stars = container.querySelectorAll('.rating-star');
            const hiddenInput = container.parentNode.querySelector('.rating-value');
            
            stars.forEach((star, index) => {
                star.addEventListener('click', () => {
                    const rating = index + 1;
                    hiddenInput.value = rating;
                    
                    // Actualizar visualización de estrellas
                    stars.forEach((s, i) => {
                        if (i < rating) {
                            s.classList.remove('bi-star');
                            s.classList.add('bi-star-fill');
                        } else {
                            s.classList.remove('bi-star-fill');
                            s.classList.add('bi-star');
                        }
                    });
                });
                
                star.addEventListener('mouseover', () => {
                    const rating = index + 1;
                    stars.forEach((s, i) => {
                        if (i < rating) {
                            s.style.color = '#ffc107';
                        } else {
                            s.style.color = '';
                        }
                    });
                });
                
                star.addEventListener('mouseleave', () => {
                    stars.forEach(s => {
                        s.style.color = '';
                    });
                });
            });
        });
    }

    // ==================== FILTROS Y ACCIONES ====================
    filterCompletedSessions(filter) {
        this.sessionFilters = filter;
        
        // Actualizar botones activos
        document.getElementById('filterPending').classList.toggle('active', filter === 'pending');
        document.getElementById('filterAll').classList.toggle('active', filter === 'all');
        
        // Re-renderizar sesiones
        this.renderCompletedSessions(this.completedSessions);
    }

    async submitEvaluation(e, sessionId) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const spinner = submitBtn.querySelector('.spinner-border');
        
        try {
            const rating = parseInt(form.querySelector('.rating-value').value);
            const comment = form.querySelector('textarea').value.trim();
            
            if (rating === 0) {
                UIHelpers.showToast('Por favor selecciona una calificación', 'warning');
                return;
            }
            
            if (!comment) {
                UIHelpers.showToast('Por favor escribe un comentario', 'warning');
                return;
            }

            UIHelpers.showButtonSpinner(submitBtn, true);

            const evaluationData = {
                sessionId,
                rating,
                comment
            };

            // TODO: Reemplazar con llamada real al API
            // const response = await ApiClient.post('/user/sessions/evaluate', evaluationData, true);
            
            // Simulación temporal
            const response = await this.simulateSubmitEvaluation(evaluationData);
            
            if (response.success) {
                UIHelpers.showToast('Evaluación enviada exitosamente', 'success');
                
                // Actualizar sesión en los datos locales
                const sessionIndex = this.completedSessions.findIndex(s => s.id === sessionId);
                if (sessionIndex !== -1) {
                    this.completedSessions[sessionIndex].hasReview = true;
                    this.completedSessions[sessionIndex].rating = rating;
                    this.completedSessions[sessionIndex].review = comment;
                }
                
                // Re-renderizar
                this.renderCompletedSessions(this.completedSessions);
            } else {
                throw new Error(response.message || 'Error al enviar evaluación');
            }

        } catch (error) {
            console.error('Evaluation submission error:', error);
            UIHelpers.showToast(error.message || 'Error al enviar la evaluación', 'danger');
        } finally {
            UIHelpers.showButtonSpinner(submitBtn, false);
        }
    }

    showSessionDetails(sessionId) {
        const session = this.scheduledSessions.find(s => s.id === sessionId) || 
                       this.completedSessions.find(s => s.id === sessionId);
        
        if (session) {
            // TODO: Implementar modal de detalles de sesión
            UIHelpers.showToast(`Mostrando detalles de: ${session.title}`, 'info');
            console.log('Session details:', session);
        }
    }

    // ==================== UTILIDADES ====================
    getEmptyState(icon, title, description) {
        return `
            <div class="empty-state">
                <i class="bi bi-${icon}"></i>
                <h5>${title}</h5>
                <p>${description}</p>
            </div>
        `;
    }

    getErrorState(message) {
        return `
            <div class="empty-state">
                <i class="bi bi-exclamation-triangle text-danger"></i>
                <h5>Error</h5>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="bi bi-arrow-clockwise"></i> Reintentar
                </button>
            </div>
        `;
    }

    // ==================== SIMULACIONES DE API (TEMPORAL) ====================
    async simulateGetUserProfile() {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        return {
            id: 1,
            firstName: 'Usuario',
            lastName: 'Demo',
            email: 'demo@sportlink.com',
            phone: '3001234567',
            birthDate: '1993-05-15',
            location: 'Chapinero',
            weight: 75,
            height: 180,
            bio: 'Apasionado por los deportes y el fitness. Busco mejorar mi condición física y aprender nuevas disciplinas.',
            avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
            memberSince: '2023-03-01'
        };
    }

    async simulateUpdateProfile(data) {
        await new Promise(resolve => setTimeout(resolve, 1200));
        return { success: true };
    }

    async simulateChangePassword(data) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulación de validación de contraseña actual
        if (data.currentPassword !== '123456') {
            return { success: false, message: 'La contraseña actual es incorrecta' };
        }
        
        return { success: true };
    }

    async simulateUploadAvatar(formData) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return { 
            success: true, 
            avatarUrl: ""//'https://randomuser.me/api/portraits/men/45.jpg' 
        };
    }

    async simulateGetScheduledSessions() {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return [
            {
                id: 'session1',
                title: 'Clase de Yoga',
                trainerName: 'Laura Gómez',
                location: 'Centro Deportivo Armonía - Suba',
                date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Mañana
                time: '10:00 AM',
                price: 40000,
                sport: 'Yoga'
            },
            {
                id: 'session2',
                title: 'Entrenamiento de Fútbol',
                trainerName: 'Andrés Ramírez',
                location: 'Estadio La Campiña - Teusaquillo',
                date: new Date(Date.now() + 172800000).toISOString().split('T')[0], // Pasado mañana
                time: '2:00 PM',
                price: 50000,
                sport: 'Fútbol'
            }
        ];
    }

    async simulateGetCompletedSessions() {
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        return [
            {
                id: 'completed1',
                title: 'Natación con Carlos Méndez',
                trainerName: 'Carlos Méndez',
                date: '2024-04-05',
                price: 45000,
                hasReview: true,
                rating: 4,
                review: 'Excelente entrenamiento, muy profesional y paciente. Mejoré mucho mi técnica.'
            },
            {
                id: 'completed2',
                title: 'Fútbol con Andrés Ramírez',
                trainerName: 'Andrés Ramírez',
                date: '2024-04-03',
                price: 50000,
                hasReview: false,
                rating: 0,
                review: null
            },
            {
                id: 'completed3',
                title: 'CrossFit con María Torres',
                trainerName: 'María Torres',
                date: '2024-03-28',
                price: 35000,
                hasReview: true,
                rating: 5,
                review: 'Increíble sesión! Muy motivadora y con ejercicios variados. La recomiendo 100%.'
            }
        ];
    }

    async simulateSubmitEvaluation(data) {
        await new Promise(resolve => setTimeout(resolve, 800));
        return { success: true };
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.perfilPageManager = new PerfilPageManager();
});