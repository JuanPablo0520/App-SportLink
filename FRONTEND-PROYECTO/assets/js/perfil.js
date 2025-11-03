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

    /* REEMPLAZAR la función init() en assets/js/perfil.js */

    init() {
        // Verificar autenticación
        if (!AuthManager.requireAuth()) {
            return;
        }

        this.currentUser = AuthManager.getUser();
    
        // Redirigir a perfil de entrenador si corresponde
        if (this.currentUser.tipoUsuario === 'entrenador') {
            window.location.href = 'perfil-entrenador.html';
            return;
        }
    
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
    //async loadUserProfile() {
    //    try {
    //        // TODO: Reemplazar con llamada real al API
    //        // const userData = await ApiClient.get('/user/profile', true);
    //        
    //        // Simulación temporal
    //        const userData = await this.simulateGetUserProfile();
    //        
    //        this.populateUserData(userData);
    //        this.originalFormData = this.getFormData();
//
    //    } catch (error) {
    //        console.error('Error loading user profile:', error);
    //        UIHelpers.showToast('Error al cargar el perfil de usuario', 'danger');
    //    }
    //}

    // CARGAR PERFIL DE USUARIO
    //async loadUserProfile() {
    //    try {
    //        const currentUser = AuthManager.getUser();
    //        if (!currentUser || !currentUser.idCliente) {
    //            throw new Error('Usuario no autenticado');
    //        }
//
    //        // Obtener datos actualizados del cliente
    //        const userData = await ApiClient.get(`/Cliente/obtener/${currentUser.idCliente}`);
//
    //        if (userData) {
    //            this.populateUserData(userData);
    //            this.originalFormData = this.getFormData();
    //        } else {
    //            throw new Error('No se encontraron datos del usuario');
    //        }
//
    //    } catch (error) {
    //        console.error('Error loading user profile:', error);
    //        UIHelpers.showToast('Error al cargar el perfil de usuario', 'danger');
    //    }
    //}

    async loadUserProfile() {
        try {
            const currentUser = AuthManager.getUser();
            if (!currentUser || !currentUser.idCliente && !currentUser.idEntrenador) {
                throw new Error('Usuario no autenticado');
            }

            let userData;

            // Determinar si es cliente o entrenador
            if (currentUser.tipoUsuario === 'cliente') {
                userData = await ApiClient.get(`/Cliente/obtener/${currentUser.idCliente}`);
            } else if (currentUser.tipoUsuario === 'entrenador') {
                userData = await ApiClient.get(`/Entrenador/obtener/${currentUser.idEntrenador}`);
            }

            if (userData) {
                this.populateUserData(userData, currentUser.tipoUsuario);
                this.originalFormData = this.getFormData();
            } else {
                throw new Error('No se encontraron datos del usuario');
            }

        } catch (error) {
            console.error('Error loading user profile:', error);
            UIHelpers.showToast('Error al cargar el perfil de usuario', 'danger');
        }
    }   


    populateUserData(userData) {
        console.log("Datos recibidos del backend:", userData);

        // Actualizar header
        document.getElementById('profileName').textContent = `${userData.nombres}`;
        document.getElementById('memberSince').textContent = `Miembro desde: ${userData.fechaRegistro}`;
        
        if (userData.avatar) {
            document.getElementById('profileAvatar').src = userData.fotoPerfil;
        }

        // Llenar formulario
        document.getElementById('firstName').value = userData.nombres || '';
        document.getElementById('lastName').value = userData.apellidos || '';
        document.getElementById('email').value = userData.correo || '';
        document.getElementById('phone').value = userData.telefono || '';
        document.getElementById('birthDate').value = userData.fechaNacimiento || '';
        document.getElementById('location').value = userData.ubicacion || '';
        document.getElementById('weight').value = userData.peso || '';
        document.getElementById('height').value = userData.estatura || '';
        document.getElementById('bio').value = null || '';
    }

    populateUserData(userData, tipoUsuario) {
        console.log("Datos recibidos del backend:", userData);

        // Header
        document.getElementById('profileName').textContent = 
            `${userData.nombres || userData.nombre || ''} ${userData.apellidos || ''}`;
        document.getElementById('memberSince').textContent = 
            `Miembro desde: ${userData.fechaRegistro || ''}`;

        if (userData.fotoPerfil) {
            document.getElementById('profileAvatar').src = userData.fotoPerfil;
        }

        // Campos comunes
        document.getElementById('firstName').value = userData.nombres || userData.nombre || '';
        document.getElementById('lastName').value = userData.apellidos || '';
        document.getElementById('email').value = userData.correo || '';
        document.getElementById('phone').value = userData.telefono || '';
        document.getElementById('birthDate').value = userData.fechaNacimiento || '';
        document.getElementById('location').value = userData.ubicacion || '';

        // Solo clientes
        if (tipoUsuario === 'cliente') {
            document.getElementById('weight').value = userData.peso || '';
            document.getElementById('height').value = userData.estatura || '';
            document.getElementById('bio').value = ''; // cliente no suele tener bio
        }

        // Solo entrenadores
        if (tipoUsuario === 'entrenador') {
            document.getElementById('weight').value = ''; // no aplica
            document.getElementById('height').value = ''; // no aplica
            document.getElementById('bio').value = userData.biografia || '';
        }
    }

    async loadScheduledSessions() {
        const container = document.getElementById('agendadasContainer');

        try {
            const currentUser = AuthManager.getUser();
            if (!currentUser || !currentUser.idCliente) {
                throw new Error('Usuario no autenticado');
            }

            const idCliente = currentUser.idCliente;
            const estados = ['Pendiente', 'Confirmada', 'Activa'];

            // Llamadas en paralelo a tu nuevo endpoint
            const peticiones = estados.map(estado => 
                ApiClient.get(`/Sesion/obtener/idCliente/${idCliente}/estado/${estado}`)
            );

            const resultados = await Promise.all(peticiones);

            // Combinar todas las sesiones de los distintos estados
            const todasLasSesiones = resultados.flat();

            if (!todasLasSesiones || todasLasSesiones.length === 0) {
                this.scheduledSessions = [];
                this.renderScheduledSessions([]);
                return;
            }

            // Filtrar solo sesiones futuras
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            const sesionesFuturas = todasLasSesiones.filter(sesion => {
                const fechaSesion = new Date(sesion.fechaHora);
                return fechaSesion >= hoy;
            });

            // Mapear al formato esperado por la vista
            this.scheduledSessions = sesionesFuturas.map(sesion => this.mapSesionToView(sesion));

            // Ordenar por fecha (más próximas primero)
            this.scheduledSessions.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

            // Renderizar en pantalla
            this.renderScheduledSessions(this.scheduledSessions);

        } catch (error) {
            console.error('Error loading scheduled sessions:', error);
            container.innerHTML = this.getErrorState('Error al cargar las sesiones agendadas');
        }
    }


    async loadCompletedSessions() {
        const container = document.getElementById('completadasContainer');
    
        try {
            const currentUser = AuthManager.getUser();
            if (!currentUser || !currentUser.idCliente) {
                throw new Error('Usuario no autenticado');
            }
        
            const idCliente = currentUser.idCliente;
            const estados = ['completada', 'finalizada'];
        
            // Obtener sesiones completadas y finalizadas en paralelo
            const peticiones = estados.map(estado =>
                ApiClient.get(`/Sesion/obtener/idCliente/${idCliente}/estado/${estado}`)
            );
        
            const resultados = await Promise.all(peticiones);
            const todasLasSesiones = resultados.flat();
        
            if (!todasLasSesiones || todasLasSesiones.length === 0) {
                this.completedSessions = [];
                this.renderCompletedSessions([]);
                return;
            }
        
            // Filtrar sesiones que ya ocurrieron (por fecha)
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
        
            const sesionesCompletadas = todasLasSesiones.filter(sesion => {
                const fechaSesion = new Date(sesion.fechaHora);
                return fechaSesion < hoy;
            });
        
            // Mapear al formato esperado por la vista
            this.completedSessions = sesionesCompletadas.map(sesion => {
                const mapped = this.mapSesionToView(sesion);
            
                // Si en tu backend no envías reseñas dentro de las sesiones,
                // puedes hacer otra llamada luego para obtenerlas si lo deseas.
                return {
                    ...mapped,
                    hasReview: sesion.resenia ? true : false,
                    rating: sesion.resenia ? sesion.resenia.calificacion : 0,
                    review: sesion.resenia ? sesion.resenia.comentario : null,
                    idResenia: sesion.resenia ? sesion.resenia.idResenia : null
                };
            });
        
            // Ordenar por fecha (más recientes primero)
            this.completedSessions.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
        
            // Renderizar en pantalla
            this.renderCompletedSessions(this.completedSessions);
        
        } catch (error) {
            console.error('Error loading completed sessions:', error);
            container.innerHTML = this.getErrorState('Error al cargar las sesiones completadas');
        }
    }


    // NUEVA FUNCIÓN: Mapear sesión del API al formato de vista
    mapSesionToView(sesion) {
        const fechaHora = new Date(sesion.fechaHora);

        // Extraer fecha y hora
        const fecha = fechaHora.toISOString().split('T')[0];
        const hora = fechaHora.toLocaleTimeString('es-CO', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });

        // Obtener información del servicio
        const servicioNombre = sesion.servicio?.nombre || 'Sesión de Entrenamiento';
        const deporte = sesion.servicio?.deporte || '';
        const ubicacion = sesion.servicio?.ubicacion || 'Ubicación no especificada';
        const precio = sesion.servicio?.precio || 0;
        const duracion = sesion.servicio?.duracion || 60;

        // Obtener información del entrenador
        const entrenadorNombre = sesion.entrenador 
            ? `${sesion.entrenador.nombres} ${sesion.entrenador.apellidos}`
            : 'Entrenador';

        const entrenadorEmail = sesion.entrenador?.correo || '';

        return {
            id: sesion.idSesion,
            idSesion: sesion.idSesion,
            title: servicioNombre,
            trainerName: entrenadorNombre,
            location: ubicacion,
            date: fecha,
            dateTime: sesion.fechaHora,
            time: hora,
            price: precio,
            sport: deporte,
            duration: duracion,
            status: sesion.estado || 'Pendiente',
            entrenadorEmail: entrenadorEmail,
            entrenadorId: sesion.entrenador?.idEntrenador,
            servicioId: sesion.servicio?.idServicio
        };
    }

    // ==================== MANEJO DE FORMULARIOS ====================
    //async handleProfileUpdate(e) {
    //    e.preventDefault();
    //    
    //    const submitBtn = e.target.querySelector('button[type="submit"]');
    //    const spinner = document.getElementById('saveSpinner');
    //    
    //    try {
    //        if (!Validator.validateForm(e.target)) {
    //            UIHelpers.showToast('Por favor corrige los errores en el formulario', 'warning');
    //            return;
    //        }
//
    //        UIHelpers.showButtonSpinner(submitBtn, true);
//
    //        const formData = this.getFormData();
    //        
    //        // TODO: Reemplazar con llamada real al API
    //        // const response = await ApiClient.put('/user/profile', formData, true);
    //        
    //        // Simulación temporal
    //        const response = await this.simulateUpdateProfile(formData);
    //        
    //        if (response.success) {
    //            // Actualizar datos originales
    //            this.originalFormData = formData;
    //            
    //            // Actualizar datos en AuthManager
    //            const user = AuthManager.getUser();
    //            AuthManager.login(AuthManager.getToken(), { ...user, ...formData });
    //            
    //            UIHelpers.showToast('Perfil actualizado exitosamente', 'success');
    //            
    //            // Actualizar header
    //            document.getElementById('profileName').textContent = `${formData.firstName} ${formData.lastName}`;
    //        } else {
    //            throw new Error(response.message || 'Error al actualizar perfil');
    //        }
//
    //    } catch (error) {
    //        console.error('Profile update error:', error);
    //        UIHelpers.showToast(error.message || 'Error al actualizar el perfil', 'danger');
    //    } finally {
    //        UIHelpers.showButtonSpinner(submitBtn, false);
    //    }
    //}
//
    //async handlePasswordChange(e) {
    //    e.preventDefault();
    //    
    //    const submitBtn = e.target.querySelector('button[type="submit"]');
    //    const spinner = document.getElementById('passwordSpinner');
    //    
    //    try {
    //        if (!Validator.validateForm(e.target)) {
    //            UIHelpers.showToast('Por favor corrige los errores en el formulario', 'warning');
    //            return;
    //        }
//
    //        const currentPassword = document.getElementById('currentPassword').value;
    //        const newPassword = document.getElementById('newPassword').value;
    //        const confirmPassword = document.getElementById('confirmNewPassword').value;
//
    //        // Validar que las contraseñas coincidan
    //        if (!Validator.passwordsMatch(newPassword, confirmPassword)) {
    //            UIHelpers.showToast('Las contraseñas nuevas no coinciden', 'danger');
    //            return;
    //        }
//
    //        UIHelpers.showButtonSpinner(submitBtn, true);
//
    //        const passwordData = {
    //            currentPassword,
    //            newPassword
    //        };
//
    //        // TODO: Reemplazar con llamada real al API
    //        // const response = await ApiClient.put('/user/password', passwordData, true);
    //        
    //        // Simulación temporal
    //        const response = await this.simulateChangePassword(passwordData);
    //        
    //        if (response.success) {
    //            UIHelpers.showToast('Contraseña cambiada exitosamente', 'success');
    //            document.getElementById('passwordForm').reset();
    //        } else {
    //            throw new Error(response.message || 'Error al cambiar contraseña');
    //        }
//
    //    } catch (error) {
    //        console.error('Password change error:', error);
    //        UIHelpers.showToast(error.message || 'Error al cambiar la contraseña', 'danger');
    //    } finally {
    //        UIHelpers.showButtonSpinner(submitBtn, false);
    //    }
    //}

    // ACTUALIZAR PERFIL
    async handleProfileUpdate(e) {
        e.preventDefault();

        const submitBtn = e.target.querySelector('button[type="submit"]');

        try {
            if (!Validator.validateForm(e.target)) {
                UIHelpers.showToast('Por favor corrige los errores en el formulario', 'warning');
                return;
            }

            UIHelpers.showButtonSpinner(submitBtn, true);

            const formData = this.getFormData();
            const currentUser = AuthManager.getUser();
            console.log("Formulario", formData)
            if (!currentUser) {
                throw new Error("No hay usuario autenticado");
            }

            let updateData = {};
            let response = null;

            // 🔹 Si es CLIENTE
            if (currentUser.tipoUsuario === "cliente") {
                updateData = {
                    idCliente: currentUser.idCliente,
                    nombres: formData.firstName,
                    apellidos: formData.lastName,
                    correo: formData.email,
                    contrasenia: currentUser.contrasenia, // Mantener contraseña actual
                    fotoPerfil: null,
                    fechaNacimiento: formData.birthDate ? new Date(formData.birthDate).getTime() : null,
                    estatura: formData.height ? parseFloat(formData.height) : null,
                    peso: formData.weight ? parseFloat(formData.weight) : null,
                    telefono: formData.phone,
                    ubicacion: formData.location,
                    fechaRegistro: null
                };
                console.log("UpdateData", updateData)
                response = await ApiClient.put('/Cliente/actualizar', updateData);
            }

            // 🔹 Si es ENTRENADOR
            if (currentUser.tipoUsuario === "entrenador") {
                updateData = {
                    idEntrenador: currentUser.idEntrenador,
                    nombres: formData.firstName,
                    apellidos: formData.lastName,
                    correo: formData.email,
                    contrasenia: currentUser.contrasenia,
                    especialidad: formData.specialty ? [formData.specialty] : currentUser.especialidad || [],
                    certificaciones: currentUser.certificaciones || [],
                    fotoPerfil: currentUser.fotoPerfil || null,
                    fechaRegistro: currentUser.fechaRegistro || null,
                    resenias: currentUser.resenias || [],
                    sesiones: currentUser.sesiones || [],
                    servicios: currentUser.servicios || []
                };

                response = await ApiClient.put('/Entrenador/actualizar', updateData);
            }

            if (response) {
                // Actualizar datos originales
                this.originalFormData = formData;

                // 🔹 Guardar nuevamente en sesión con tipoUsuario
                AuthManager.login(AuthManager.getToken(), { ...response, tipoUsuario: currentUser.tipoUsuario });

                UIHelpers.showToast('Perfil actualizado exitosamente', 'success');

                // Actualizar header (usa nombres para ambos tipos)
                document.getElementById('profileName').textContent = response.nombres;
            } else {
                throw new Error('Error al actualizar perfil');
            }

        } catch (error) {
            console.error('Profile update error:', error);
            UIHelpers.showToast(error.message || 'Error al actualizar el perfil', 'danger');
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
        
            // Buscar la sesión
            const sesion = this.completedSessions.find(s => s.id === sessionId);
            if (!sesion) {
                throw new Error('Sesión no encontrada');
            }
        
            const currentUser = AuthManager.getUser();
            
            // Crear reseña
            const reseniaData = {
                idResenia: null,
                calificacion: rating,
                comentario: comment,
                fecha: new Date().toISOString().split('T')[0],
                cliente: {
                    idCliente: currentUser.idCliente,
                    nombres: currentUser.nombres,
                    apellidos: currentUser.apellidos,
                    correo: currentUser.correo,
                    contrasenia: currentUser.contrasenia,
                    fotoPerfil: currentUser.fotoPerfil || null,
                    fechaNacimiento: currentUser.fechaNacimiento || null,
                    estatura: currentUser.estatura || null,
                    peso: currentUser.peso || null,
                    telefono: currentUser.telefono || null,
                    ubicacion: currentUser.ubicacion || null,
                    fechaRegistro: currentUser.fechaRegistro || null
                },
                entrenador: {
                    idEntrenador: sesion.entrenadorId,
                    nombres: sesion.trainerName.split(' ')[0],
                    apellidos: sesion.trainerName.split(' ').slice(1).join(' '),
                    correo: sesion.entrenadorEmail || '',
                    contrasenia: '',
                    especialidad: [sesion.sport],
                    certificaciones: [],
                    fotoPerfil: null,
                    fechaRegistro: null
                },
                sesion: {
                    idSesion: sesion.idSesion,
                    fechaHora: sesion.dateTime,
                    estado: sesion.status
                }
            };
        
            console.log('Enviando reseña:', reseniaData);
        
            // Crear reseña en el API
            const response = await ApiClient.post('/Resenia/crear', reseniaData);
            
            if (response) {
                UIHelpers.showToast('Evaluación enviada exitosamente', 'success');
                
                // Actualizar sesión en los datos locales
                const sessionIndex = this.completedSessions.findIndex(s => s.id === sessionId);
                if (sessionIndex !== -1) {
                    this.completedSessions[sessionIndex].hasReview = true;
                    this.completedSessions[sessionIndex].rating = rating;
                    this.completedSessions[sessionIndex].review = comment;
                    this.completedSessions[sessionIndex].idResenia = response.idResenia;
                }
                
                // Re-renderizar
                this.renderCompletedSessions(this.completedSessions);
            } else {
                throw new Error('No se pudo crear la reseña');
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