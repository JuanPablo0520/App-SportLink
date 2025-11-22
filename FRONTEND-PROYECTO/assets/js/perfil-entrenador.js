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
            const trainer = await ApiClient.get(`/Entrenador/obtener/${this.currentTrainer.idEntrenador}`);
            
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

    //async loadEstadisticas() {
    //    try {
    //        // TODO: Reemplazar con llamada real al API cuando exista
    //        const stats = await this.simulateGetEstadisticas();
    //        
    //        document.getElementById('statServicios').textContent = stats.serviciosActivos || 0;
    //        document.getElementById('statSesiones').textContent = stats.sesionesTotales || 0;
    //        document.getElementById('statCalificacion').textContent = (stats.calificacionPromedio || 0).toFixed(1);
    //        document.getElementById('statResenias').textContent = stats.totalResenias || 0;
//
    //    } catch (error) {
    //        console.error('Error loading estadísticas:', error);
    //    }
    //}

    async loadCertificaciones() {
        const container = document.getElementById('certificacionesContainer');
        
        try {
            // Llamada real al API
            const certs = await ApiClient.get(`/Certificado/obtenerPkEntrenador/${this.currentTrainer.idEntrenador}`);
            
            this.certificaciones = certs;
            this.renderCertificaciones(certs);
            console.log("Certificaciones encontradas: ", certs)

        } catch (error) {
            console.error('Error loading certificaciones:', error);
            container.innerHTML = this.getErrorState('Error al cargar certificaciones');
        }
    }

    async loadResenias() {
        const container = document.getElementById('reseniasContainer');
        
        try {
            // Llamada real al API
            const resenias = await ApiClient.get(`/Resenia/obtener/idEntrenador/${this.currentTrainer.idEntrenador}`);
            
            if (!resenias || resenias.length === 0) {
                this.resenias = [];
                this.renderResenias([]);
                return;
            }

            // Transformar las reseñas al formato esperado
            this.resenias = resenias.map(r => ({
                idResenia: r.idResenia,
                calificacion: r.calificacion,
                comentario: r.comentario,
                clienteNombre: `${r.cliente.nombres} ${r.cliente.apellidos}`,
                clienteFoto: r.cliente.fotoPerfil || null
            }));

            this.renderResenias(this.resenias);

            // Actualizar promedio y total
            const promedio = this.resenias.length > 0 
                ? this.resenias.reduce((sum, r) => sum + r.calificacion, 0) / this.resenias.length 
                : 0;
            document.getElementById('promedioResenias').textContent = promedio.toFixed(1);
            document.getElementById('totalResenias').textContent = this.resenias.length;

        } catch (error) {
            console.error('Error loading reseñas:', error);
            container.innerHTML = this.getErrorState('Error al cargar reseñas');
        }
    }

    // ==================== ESPECIALIDADES ====================
    renderEspecialidades() {
        const container = document.getElementById('especialidadesContainer');
        container.innerHTML = '';
    
        const deportes = [
            "Fútbol",
            "Tenis",
            "Natación",
            "Boxeo",
            "Crossfit",
            "Yoga",
            "Entrenamiento funcional",
            "Baloncesto",
            "Voleibol",
            "Artes marciales"
        ];
    
        this.especialidades.forEach((esp, index) => {
            const div = document.createElement('div');
            div.className = 'input-group mb-2';
        
            let opciones = `<option value="">Seleccionar deporte</option>`;
            deportes.forEach(dep => {
                opciones += `
                    <option value="${dep}" ${esp === dep ? 'selected' : ''}>
                        ${dep}
                    </option>
                `;
            });
        
            div.innerHTML = `
                <select class="form-select especialidad-select" data-index="${index}" required>
                    ${opciones}
                </select>
                <button class="btn btn-outline-danger" type="button" onclick="perfilEntrenadorManager.removeEspecialidad(${index})">
                    <i class="bi bi-trash"></i>
                </button>
            `;
        
            container.appendChild(div);
        });
    
        // Event listener para actualizar array
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
    openCertificacionModal(certToEdit = null) {
        const modalElement = document.getElementById('certificacionModal');
        if (!this.certificacionModal) {
            this.certificacionModal = new bootstrap.Modal(modalElement);
        }
        
        const form = document.getElementById('certificacionForm');
        const modalTitle = document.getElementById('certificacionModalTitle');
        const archivoInput = document.getElementById('certArchivo');
        const archivoLabel = document.getElementById('certArchivoLabel');
        
        form.reset();
        
        if (certToEdit) {
            // Modo edición
            modalTitle.textContent = 'Editar Certificación';
            document.getElementById('certNombre').value = certToEdit.nombre;
            document.getElementById('certInstitucion').value = certToEdit.entidad;
            
            // Formatear fecha para input date (YYYY-MM-DD)
            if (certToEdit.fecha) {
                try {
                    const fecha = new Date(certToEdit.fecha);
                    const fechaStr = fecha.toISOString().split('T')[0];
                    document.getElementById('certFecha').value = fechaStr;
                } catch (e) {
                    console.error('Error parsing date:', e);
                }
            }
            
            // Guardar ID para actualización
            form.dataset.editId = certToEdit.pkCertificado;
            
            // Hacer el archivo opcional en edición
            archivoInput.removeAttribute('required');
            archivoLabel.innerHTML = 'Nuevo documento (PDF) <small class="text-muted">(opcional - dejar vacío para mantener el actual)</small>';
        } else {
            // Modo creación
            modalTitle.textContent = 'Agregar Certificación';
            delete form.dataset.editId;
            archivoInput.setAttribute('required', 'required');
            archivoLabel.innerHTML = 'Documento (PDF) *';
        }
        
        this.certificacionModal.show();
    }

    async handleAddCertificacion(e) {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const form = e.target;
        const isEditing = !!form.dataset.editId;
        
        try {
            const archivoInput = document.getElementById('certArchivo');
            
            // Validar archivo solo si es creación o si se seleccionó uno nuevo
            if (!isEditing && !archivoInput.files[0]) {
                UIHelpers.showToast('Debes seleccionar un archivo PDF', 'warning');
                return;
            }

            // Validar tamaño si hay archivo
            if (archivoInput.files[0] && archivoInput.files[0].size > 5 * 1024 * 1024) {
                UIHelpers.showToast('El archivo no debe superar 5MB', 'warning');
                return;
            }

            UIHelpers.showButtonSpinner(submitBtn, true);

            if (isEditing) {
                // Modo actualización
                await this.actualizarCertificacion(form);
            } else {
                // Modo creación
                await this.crearCertificacion(form);
            }

        } catch (error) {
            console.error('Error processing certificacion:', error);
            UIHelpers.showToast(error.message || 'Error al procesar la certificación', 'danger');
        } finally {
            UIHelpers.showButtonSpinner(submitBtn, false);
        }
    }

    async crearCertificacion(form) {
        const formData = new FormData();
        formData.append('nombre', document.getElementById('certNombre').value.trim());
        formData.append('entidad', document.getElementById('certInstitucion').value.trim());
        
        // Convertir fecha a formato LocalDateTime
        const fechaInput = document.getElementById('certFecha').value;
        const fechaFormatted = fechaInput ? `${fechaInput}T00:00:00` : new Date().toISOString().slice(0, 19);
        formData.append('fecha', fechaFormatted);
        
        formData.append('archivo', document.getElementById('certArchivo').files[0]);
        formData.append('idEntrenador', this.currentTrainer.idEntrenador);

        const response = await fetch(`${CONFIG.API_BASE_URL}/Certificado/enviarCertificacion`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        await response.json();

        UIHelpers.showToast('Certificación agregada exitosamente', 'success');
        this.certificacionModal.hide();
        await this.loadCertificaciones();
    }

    async actualizarCertificacion(form) {
        const pkCertificado = parseInt(form.dataset.editId);
        const archivoInput = document.getElementById('certArchivo');
        const tieneNuevoArchivo = archivoInput.files[0];

        // Si hay nuevo archivo, necesitamos crear una nueva certificación y eliminar la antigua
        // porque el endpoint de actualización solo acepta JSON, no FormData
        if (tieneNuevoArchivo) {
            // Eliminar la antigua
            await ApiClient.delete(`/Certificado/eliminar/${pkCertificado}`);
            
            // Crear la nueva con el archivo
            await this.crearCertificacion(form);
        } else {
            // Actualizar solo los datos sin archivo
            const fechaInput = document.getElementById('certFecha').value;
            const fechaFormatted = fechaInput ? `${fechaInput}T00:00:00` : new Date().toISOString().slice(0, 19);

            const certificadoData = {
                pkCertificado: pkCertificado,
                nombre: document.getElementById('certNombre').value.trim(),
                entidad: document.getElementById('certInstitucion').value.trim(),
                fecha: fechaFormatted,
                rutaArchivo: null, // El backend mantendrá el existente
                fkEntrenador: this.currentTrainer.idEntrenador
            };

            await ApiClient.put('/Certificado/actualizar', certificadoData);

            UIHelpers.showToast('Certificación actualizada exitosamente', 'success');
            this.certificacionModal.hide();
            await this.loadCertificaciones();
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

        container.innerHTML = ''; // Limpiar contenedor
        
        certs.forEach(cert => {
            // Formatear fecha
            let fechaTexto = 'No especificada';
            if (cert.fechaEmision) {
                try {
                    const fecha = new Date(cert.fechaEmision);
                    fechaTexto = UIHelpers.formatDate(fecha);
                } catch (e) {
                    fechaTexto = cert.fechaEmision;
                }
            }

            const certDiv = document.createElement('div');
            certDiv.className = 'certification-item fade-in';
            
            certDiv.innerHTML = `
                <div class="certification-icon">
                    <i class="bi bi-award-fill"></i>
                </div>
                <div class="certification-info flex-grow-1">
                    <h6>${cert.nombre}</h6>
                    <p><strong>Institución:</strong> ${cert.entidad}</p>
                    <p><small class="text-muted">Emitido: ${fechaTexto}</small></p>
                </div>
                <div class="certification-actions d-flex flex-wrap gap-2">
                    ${cert.archivo ? `
                        <a href="${cert.archivo}" target="_blank" class="btn btn-sm btn-outline-primary" title="Ver PDF">
                            <i class="bi bi-file-pdf"></i> Ver
                        </a>
                        <a href="${cert.archivo}" download class="btn btn-sm btn-outline-success" title="Descargar PDF">
                            <i class="bi bi-download"></i>
                        </a>
                    ` : `
                        <button class="btn btn-sm btn-outline-secondary" disabled title="Sin archivo">
                            <i class="bi bi-file-pdf"></i> Sin archivo
                        </button>
                    `}
                    <button class="btn btn-sm btn-outline-warning btn-editar-cert" data-cert-id="${cert.idCertificado}" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-eliminar-cert" data-cert-id="${cert.idCertificado}" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;
            
            container.appendChild(certDiv);
        });
        
        // Agregar event listeners a los botones
        document.querySelectorAll('.btn-editar-cert').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const certId = parseInt(e.currentTarget.dataset.certId);
                this.editarCertificacion(certId);
            });
        });
        
        document.querySelectorAll('.btn-eliminar-cert').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const certId = parseInt(e.currentTarget.dataset.certId);
                this.eliminarCertificacion(certId);
            });
        });
    }

    editarCertificacion(certId) {
        const cert = this.certificaciones.find(c => c.idCertificado === certId);
        if (cert) {
            this.openCertificacionModal(cert);
        } else {
            console.error('Certificación no encontrada:', certId);
            UIHelpers.showToast('Error al cargar la certificación', 'danger');
        }
    }

    async eliminarCertificacion(certId) {
        UIHelpers.showConfirmModal(
            'Eliminar certificación',
            '¿Estás seguro que deseas eliminar esta certificación?',
            async () => {
                try {
                    // Llamada al endpoint de eliminación
                    await ApiClient.delete(`/Certificado/eliminar/${certId}`);
                    
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
            // Avatar del cliente
            const avatarHtml = resena.clienteFoto 
                ? `<img src="${resena.clienteFoto}" alt="${resena.clienteNombre}" class="resena-avatar">`
                : `<div class="resena-avatar-placeholder">
                     <i class="bi bi-person-circle"></i>
                   </div>`;

            html += `
                <div class="resena-item fade-in">
                    <div class="resena-header">
                        <div class="d-flex align-items-center">
                            ${avatarHtml}
                            <div class="ms-3">
                                <div class="resena-cliente">${resena.clienteNombre}</div>
                                <div class="resena-estrellas">
                                    ${this.renderEstrellas(resena.calificacion)}
                                    <span class="ms-2 text-muted">(${resena.calificacion.toFixed(1)})</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p class="resena-texto">"${resena.comentario}"</p>
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

            const response = await ApiClient.put('/Entrenador/actualizar', formData);

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

            // TODO: Implementar cambio de contraseña cuando esté disponible el endpoint
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

            // Llamado REAL al backend
            const response = await fetch(`${CONFIG.API_BASE_URL}/Entrenador/actualizarFotoPerfil`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const updatedTrainer = await response.json();

            // Actualizar UI
            document.getElementById('profileAvatar').src = updatedTrainer.fotoPerfil;

            // Actualizar datos en sesión
            AuthManager.login(AuthManager.getToken(), {
                ...this.currentTrainer,
                fotoPerfil: updatedTrainer.fotoPerfil
            });

            UIHelpers.showToast('Foto de perfil actualizada', 'success');

            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('avatarModal'));
            modal.hide();

            // Limpiar
            fileInput.value = '';
            document.getElementById('avatarPreview').style.display = 'none';
            saveBtn.disabled = true;

            // Sync local variable
            this.currentTrainer.fotoPerfil = updatedTrainer.fotoPerfil;

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
    async simulateGetEstadisticas() {
        await new Promise(resolve => setTimeout(resolve, 600));
        
        return {
            serviciosActivos: 3,
            sesionesTotales: 47,
            calificacionPromedio: 4.8,
            totalResenias: 15
        };
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    window.perfilEntrenadorManager = new PerfilEntrenadorManager();
});