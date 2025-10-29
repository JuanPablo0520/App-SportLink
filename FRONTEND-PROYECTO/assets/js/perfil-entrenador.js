/* assets/js/perfil-entrenador.js - Lógica para perfil de entrenador */

class PerfilEntrenadorManager {
    constructor() {
        this.currentTrainer = null;
        this.originalFormData = {};
        this.especialidades = [];
        this.certificaciones = [];
        this.resenias = [];
        this.certificacionModal = null;
        
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
        this.loadTrainerProfile();
        this.loadEstadisticas();
    }

    // ==================== EVENT LISTENERS ====================
    initializeEventListeners() {
        // Formulario de perfil
        document.getElementById('profileForm')?.addEventListener('submit', (e) => this.handleProfileUpdate(e));

        // Botón cancelar cambios
        document.getElementById('cancelChangesBtn')?.addEventListener('click', () => this.resetFormData());

        // Formulario de cambio de contraseña
        document.getElementById('passwordForm')?.addEventListener('submit', (e) => this.handlePasswordChange(e));

        // Avatar
        this.initializeAvatarHandlers();

        // Especialidades
        document.getElementById('addEspecialidadBtn')?.addEventListener('click', () => this.addEspecialidadField());

        // Certificaciones
        document.getElementById('addCertificacionBtn')?.addEventListener('click', () => this.openCertificacionModal());
        document.getElementById('certificacionForm')?.addEventListener('submit', (e) => this.handleAddCertificacion(e));

        // Tabs
        document.querySelectorAll('#perfilTabs button[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                const target = e.target.getAttribute('data-bs-target');
                if (target === '#certificaciones' && this.certificaciones.length === 0) {
                    this.loadCertificaciones();
                } else if (target === '#resenias' && this.resenias.length === 0) {
                    this.loadResenias();
                }
            });
        });

        // Logout
        document.getElementById('logout-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            AuthManager.logout();
        });
    }

    initializeAvatarHandlers() {
        document.getElementById('changeAvatarBtn')?.addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('avatarModal'));
            modal.show();
        });

        document.getElementById('avatarFile')?.addEventListener('change', (e) => this.handleAvatarPreview(e));
        document.getElementById('saveAvatarBtn')?.addEventListener('click', () => this.handleAvatarUpload());
    }

    // ==================== CARGA DE DATOS ====================
    async loadTrainerProfile() {
        try {
            // TODO: Reemplazar con llamada real al API
            const trainer = await ApiClient.get(`/Entrenador/obtener/${this.currentTrainer.idEntrenador}`);
            
            //const trainer = await this.simulateGetTrainerProfile();
            
            this.populateTrainerData(trainer);
            this.originalFormData = this.getFormData();

        } catch (error) {
            console.error('Error loading trainer profile:', error);
            UIHelpers.showToast('Error al cargar el perfil', 'danger');
        }
    }

    populateTrainerData(trainer) {
        // Header
        document.getElementById('profileName').textContent = `${trainer.nombres} ${trainer.apellidos}`;
        document.getElementById('memberSince').textContent = `Miembro desde: ${UIHelpers.formatDate(trainer.fechaRegistro)}`;
        
        if (trainer.fotoPerfil) {
            document.getElementById('profileAvatar').src = trainer.fotoPerfil;
        }

        // Especialidades en header
        const specialtiesContainer = document.getElementById('trainerSpecialties');
        specialtiesContainer.innerHTML = '';
        trainer.especialidad.forEach(esp => {
            specialtiesContainer.innerHTML += `<span class="specialty-badge">${esp}</span>`;
        });

        // Formulario
        document.getElementById('firstName').value = trainer.nombres || '';
        document.getElementById('lastName').value = trainer.apellidos || '';
        document.getElementById('email').value = trainer.correo || '';
        document.getElementById('phone').value = trainer.telefono || '';
        document.getElementById('bio').value = trainer.biografia || '';

        // Especialidades editables
        this.especialidades = [...trainer.especialidad];
        this.renderEspecialidades();
    }

    async loadEstadisticas() {
        try {
            // TODO: Reemplazar con llamada real al API
            // const stats = await ApiClient.get(`/Entrenador/estadisticas/${this.currentTrainer.idEntrenador}`);
            
            const stats = await this.simulateGetEstadisticas();
            
            document.getElementById('statServicios').textContent = stats.serviciosActivos || 0;
            document.getElementById('statSesiones').textContent = stats.sesionesTotales || 0;
            document.getElementById('statCalificacion').textContent = (stats.calificacionPromedio || 0).toFixed(1);
            document.getElementById('statResenias').textContent = stats.totalResenias || 0;

        } catch (error) {
            console.error('Error loading estadísticas:', error);
        }
    }

    async loadCertificaciones() {
        const container = document.getElementById('certificacionesContainer');
        
        try {
            // TODO: Reemplazar con llamada real al API
            // const certs = await ApiClient.get(`/Entrenador/${this.currentTrainer.idEntrenador}/certificaciones`);
            
            const certs = await this.simulateGetCertificaciones();
            
            this.certificaciones = certs;
            this.renderCertificaciones(certs);

        } catch (error) {
            console.error('Error loading certificaciones:', error);
            container.innerHTML = this.getErrorState('Error al cargar certificaciones');
        }
    }

    async loadResenias() {
        const container = document.getElementById('reseniasContainer');
        
        try {
            // TODO: Reemplazar con llamada real al API
            // const resenias = await ApiClient.get(`/Resenia/entrenador/${this.currentTrainer.idEntrenador}`);
            
            const resenias = await this.simulateGetResenias();
            
            this.resenias = resenias;
            this.renderResenias(resenias);

            // Actualizar promedio
            const promedio = resenias.length > 0 
                ? resenias.reduce((sum, r) => sum + r.calificacion, 0) / resenias.length 
                : 0;
            document.getElementById('promedioResenias').textContent = promedio.toFixed(1);
            document.getElementById('totalResenias').textContent = resenias.length;

        } catch (error) {
            console.error('Error loading reseñas:', error);
            container.innerHTML = this.getErrorState('Error al cargar reseñas');
        }
    }

    // ==================== ESPECIALIDADES ====================
    renderEspecialidades() {
        const container = document.getElementById('especialidadesContainer');
        container.innerHTML = '';

        this.especialidades.forEach((esp, index) => {
            const div = document.createElement('div');
            div.className = 'input-group mb-2';
            div.innerHTML = `
                <select class="form-select especialidad-select" data-index="${index}" required>
                    <option value="">Seleccionar deporte</option>
                    <option value="Fútbol" ${esp === 'Fútbol' ? 'selected' : ''}>Fútbol</option>
                    <option value="Tenis" ${esp === 'Tenis' ? 'selected' : ''}>Tenis</option>
                    <option value="Natación" ${esp === 'Natación' ? 'selected' : ''}>Natación</option>
                    <option value="Boxeo" ${esp === 'Boxeo' ? 'selected' : ''}>Boxeo</option>
                    <option value="CrossFit" ${esp === 'CrossFit' ? 'selected' : ''}>CrossFit</option>
                    <option value="Entrenamiento funcional" ${esp === 'Entrenamiento funcional' ? 'selected' : ''}>Entrenamiento funcional</option>
                    <option value="Baloncesto" ${esp === 'Baloncesto' ? 'selected' : ''}>Baloncesto</option>
                    <option value="Voleibol" ${esp === 'Voleibol' ? 'selected' : ''}>Voleibol</option>
                    <option value="Artes marciales" ${esp === 'Artes marciales' ? 'selected' : ''}>Artes marciales</option>
                    <option value="Yoga" ${esp === 'Yoga' ? 'selected' : ''}>Yoga</option>
                    <option value="Pilates" ${esp === 'Pilates' ? 'selected' : ''}>Pilates</option>
                    <option value="Otro" ${esp === 'Otro' ? 'selected' : ''}>Otro</option>
                </select>
                <button class="btn btn-outline-danger" type="button" onclick="perfilEntrenadorManager.removeEspecialidad(${index})">
                    <i class="bi bi-trash"></i>
                </button>
            `;
            container.appendChild(div);
        });

        // Event listeners para actualizar array
        document.querySelectorAll('.especialidad-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.especialidades[index] = e.target.value;
            });
        });
    }

    addEspecialidadField() {
        this.especialidades.push('');
        this.renderEspecialidades();
    }

    removeEspecialidad(index) {
        this.especialidades.splice(index, 1);
        this.renderEspecialidades();
    }

    // ==================== CERTIFICACIONES ====================
    openCertificacionModal() {
        const modalElement = document.getElementById('certificacionModal');
        if (!this.certificacionModal) {
            this.certificacionModal = new bootstrap.Modal(modalElement);
        }
        document.getElementById('certificacionForm').reset();
        this.certificacionModal.show();
    }

    async handleAddCertificacion(e) {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        try {
            UIHelpers.showButtonSpinner(submitBtn, true);

            const formData = new FormData();
            formData.append('idEntrenador', this.currentTrainer.idEntrenador);
            formData.append('nombre', document.getElementById('certNombre').value.trim());
            formData.append('institucion', document.getElementById('certInstitucion').value.trim());
            formData.append('fecha', document.getElementById('certFecha').value);
            formData.append('archivo', document.getElementById('certArchivo').files[0]);

            // TODO: Reemplazar con llamada real al API
            // await ApiClient.post('/Entrenador/certificacion/agregar', formData);
            
            await new Promise(resolve => setTimeout(resolve, 1000));

            UIHelpers.showToast('Certificación agregada exitosamente', 'success');
            this.certificacionModal.hide();
            await this.loadCertificaciones();

        } catch (error) {
            console.error('Error adding certificacion:', error);
            UIHelpers.showToast('Error al agregar la certificación', 'danger');
        } finally {
            UIHelpers.showButtonSpinner(submitBtn, false);
        }
    }

    renderCertificaciones(certs) {
        const container = document.getElementById('certificacionesContainer');
        
        if (!certs || certs.length === 0) {
            container.innerHTML = this.getEmptyState(
                'file-earmark-check',
                'No tienes certificaciones agregadas',
                'Agrega tus certificaciones para generar más confianza en tus clientes'
            );
            return;
        }

        let html = '';
        
        certs.forEach(cert => {
            html += `
                <div class="certification-item fade-in">
                    <div class="certification-icon">
                        <i class="bi bi-award-fill"></i>
                    </div>
                    <div class="certification-info flex-grow-1">
                        <h6>${cert.nombre}</h6>
                        <p><strong>Institución:</strong> ${cert.institucion}</p>
                        ${cert.fecha ? `<p><small class="text-muted">Emitido: ${UIHelpers.formatDate(cert.fecha)}</small></p>` : ''}
                    </div>
                    <div>
                        <a href="${cert.url}" target="_blank" class="btn btn-sm btn-outline-primary me-2">
                            <i class="bi bi-file-pdf"></i> Ver
                        </a>
                        <button class="btn btn-sm btn-outline-danger" onclick="perfilEntrenadorManager.eliminarCertificacion('${cert.id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    async eliminarCertificacion(certId) {
        UIHelpers.showConfirmModal(
            'Eliminar certificación',
            '¿Estás seguro que deseas eliminar esta certificación?',
            async () => {
                try {
                    // TODO: Reemplazar con llamada real al API
                    // await ApiClient.delete(`/Entrenador/certificacion/${certId}`);
                    
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    UIHelpers.showToast('Certificación eliminada', 'success');
                    await this.loadCertificaciones();

                } catch (error) {
                    console.error('Error deleting certificacion:', error);
                    UIHelpers.showToast('Error al eliminar la certificación', 'danger');
                }
            },
            'danger'
        );
    }

    // ==================== RESEÑAS ====================
    renderResenias(resenias) {
        const container = document.getElementById('reseniasContainer');
        
        if (!resenias || resenias.length === 0) {
            container.innerHTML = this.getEmptyState(
                'chat-quote',
                'Aún no tienes reseñas',
                'Las evaluaciones de tus clientes aparecerán aquí'
            );
            return;
        }

        let html = '';
        
        resenias.forEach(resena => {
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
                        </div>
                    </div>
                    <p class="resena-texto">"${resena.comentario}"</p>
                    ${resena.respuesta ? `
                        <div class="alert alert-light mt-2 mb-0">
                            <strong>Tu respuesta:</strong><br>
                            ${resena.respuesta}
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    renderEstrellas(calificacion) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            html += i <= calificacion ? '<i class="bi bi-star-fill"></i>' : '<i class="bi bi-star"></i>';
        }
        return html;
    }

    // ==================== FORMULARIOS ====================
    async handleProfileUpdate(e) {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        try {
            if (!Validator.validateForm(e.target)) {
                UIHelpers.showToast('Por favor completa todos los campos requeridos', 'warning');
                return;
            }

            // Validar que haya al menos una especialidad
            if (this.especialidades.filter(e => e).length === 0) {
                UIHelpers.showToast('Debes agregar al menos una especialidad', 'warning');
                return;
            }

            UIHelpers.showButtonSpinner(submitBtn, true);

            const formData = {
                idEntrenador: this.currentTrainer.idEntrenador,
                nombres: document.getElementById('firstName').value.trim(),
                apellidos: document.getElementById('lastName').value.trim(),
                correo: document.getElementById('email').value.trim(),
                contrasenia: this.currentTrainer.contrasenia,
                especialidad: this.especialidades.filter(e => e),
                certificaciones: this.currentTrainer.certificaciones || [],
                fotoPerfil: this.currentTrainer.fotoPerfil || null,
                biografia: document.getElementById('bio').value.trim(),
                telefono: document.getElementById('phone').value.trim(),
                fechaRegistro: this.currentTrainer.fechaRegistro || null,
                resenias: this.currentTrainer.resenias || [],
                sesiones: this.currentTrainer.sesiones || [],
                servicios: this.currentTrainer.servicios || []
            };

            // TODO: Reemplazar con llamada real al API
            const response = await ApiClient.put('/Entrenador/actualizar', formData);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            //const response = formData;

            if (response) {
                this.originalFormData = this.getFormData();
                AuthManager.login(AuthManager.getToken(), { ...response, tipoUsuario: 'entrenador' });
                
                UIHelpers.showToast('Perfil actualizado exitosamente', 'success');
                
                // Actualizar header
                document.getElementById('profileName').textContent = `${response.nombres} ${response.apellidos}`;
                
                // Actualizar especialidades en header
                const specialtiesContainer = document.getElementById('trainerSpecialties');
                specialtiesContainer.innerHTML = '';
                response.especialidad.forEach(esp => {
                    specialtiesContainer.innerHTML += `<span class="specialty-badge">${esp}</span>`;
                });
            }

        } catch (error) {
            console.error('Profile update error:', error);
            UIHelpers.showToast('Error al actualizar el perfil', 'danger');
        } finally {
            UIHelpers.showButtonSpinner(submitBtn, false);
        }
    }

    async handlePasswordChange(e) {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        try {
            if (!Validator.validateForm(e.target)) {
                UIHelpers.showToast('Por favor completa todos los campos', 'warning');
                return;
            }

            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmNewPassword').value;

            if (!Validator.passwordsMatch(newPassword, confirmPassword)) {
                UIHelpers.showToast('Las contraseñas nuevas no coinciden', 'danger');
                return;
            }

            UIHelpers.showButtonSpinner(submitBtn, true);

            // TODO: Reemplazar con llamada real al API
            // await ApiClient.put('/Entrenador/cambiar-password', { 
            //     idEntrenador: this.currentTrainer.idEntrenador,
            //     passwordActual: currentPassword,
            //     passwordNueva: newPassword 
            // });
            
            await new Promise(resolve => setTimeout(resolve, 1000));

            UIHelpers.showToast('Contraseña cambiada exitosamente', 'success');
            document.getElementById('passwordForm').reset();

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
                this.loadTrainerProfile();
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
            bio: document.getElementById('bio').value.trim(),
            especialidades: [...this.especialidades]
        };
    }

    // ==================== AVATAR ====================
    handleAvatarPreview(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('avatarPreview');
        const saveBtn = document.getElementById('saveAvatarBtn');
        
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                UIHelpers.showToast('La imagen no debe superar 5MB', 'warning');
                return;
            }
            
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
        
        if (!fileInput.files[0]) return;

        try {
            UIHelpers.showButtonSpinner(saveBtn, true);

            const formData = new FormData();
            formData.append('idEntrenador', this.currentTrainer.idEntrenador);
            formData.append('fotoPerfil', fileInput.files[0]);

            // TODO: Reemplazar con llamada real al API
            // const response = await ApiClient.post('/Entrenador/actualizar-foto', formData);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            const response = { fotoUrl: URL.createObjectURL(fileInput.files[0]) };

            document.getElementById('profileAvatar').src = response.fotoUrl;
            
            UIHelpers.showToast('Foto de perfil actualizada', 'success');
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('avatarModal'));
            modal.hide();
            
            fileInput.value = '';
            document.getElementById('avatarPreview').style.display = 'none';
            saveBtn.disabled = true;

        } catch (error) {
            console.error('Avatar upload error:', error);
            UIHelpers.showToast('Error al subir la imagen', 'danger');
        } finally {
            UIHelpers.showButtonSpinner(saveBtn, false);
        }
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

    // ==================== SIMULACIONES (TEMPORAL) ====================
    async simulateGetTrainerProfile() {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        return {
            idEntrenador: this.currentTrainer.idEntrenador,
            nombres: this.currentTrainer.nombres || 'Carlos',
            apellidos: this.currentTrainer.apellidos || 'Martínez',
            correo: this.currentTrainer.correo || 'carlos@example.com',
            contrasenia: this.currentTrainer.contrasenia,
            especialidad: this.currentTrainer.especialidad || ['Fútbol', 'Entrenamiento funcional'],
            certificaciones: this.currentTrainer.certificaciones || [],
            fotoPerfil: this.currentTrainer.fotoPerfil || null,
            telefono: '3001234567',
            biografia: 'Entrenador profesional con más de 10 años de experiencia en formación deportiva. Especializado en desarrollo de habilidades técnicas y tácticas.',
            fechaRegistro: '2023-03-15',
            resenias: this.currentTrainer.resenias || [],
            sesiones: this.currentTrainer.sesiones || [],
            servicios: this.currentTrainer.servicios || []
        };
    }

    async simulateGetEstadisticas() {
        await new Promise(resolve => setTimeout(resolve, 600));
        
        return {
            serviciosActivos: 3,
            sesionesTotales: 47,
            calificacionPromedio: 4.8,
            totalResenias: 15
        };
    }

    async simulateGetCertificaciones() {
        await new Promise(resolve => setTimeout(resolve, 700));
        
        return [
            {
                id: 'cert1',
                nombre: 'Certificación UEFA Pro',
                institucion: 'UEFA',
                fecha: '2022-06-15',
                url: '#'
            },
            {
                id: 'cert2',
                nombre: 'Entrenador Personal Certificado',
                institucion: 'NSCA',
                fecha: '2021-03-20',
                url: '#'
            }
        ];
    }

    async simulateGetResenias() {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        return [
            {
                id: 'res1',
                clienteNombre: 'Juan Pérez',
                calificacion: 5,
                comentario: 'Excelente entrenador, muy profesional y dedicado. He mejorado muchísimo gracias a sus entrenamientos.',
                fecha: '2025-01-10',
                respuesta: 'Muchas gracias Juan, es un placer trabajar contigo. ¡Sigamos mejorando!'
            },
            {
                id: 'res2',
                clienteNombre: 'María García',
                calificacion: 5,
                comentario: 'Las clases son muy dinámicas y motivadoras. Recomendado 100%.',
                fecha: '2025-01-05',
                respuesta: null
            },
            {
                id: 'res3',
                clienteNombre: 'Pedro Rodríguez',
                calificacion: 4,
                comentario: 'Muy buen entrenador, las sesiones son exigentes pero efectivas.',
                fecha: '2024-12-20',
                respuesta: 'Gracias Pedro por tu comentario. Me alegra que estés viendo resultados.'
            }
        ];
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    window.perfilEntrenadorManager = new PerfilEntrenadorManager();
});