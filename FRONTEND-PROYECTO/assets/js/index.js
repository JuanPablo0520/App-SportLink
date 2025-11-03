/* assets/js/index.js - Lógica específica para la página de inicio */

class IndexPageManager {
    constructor() {
        this.currentResults = [];
        this.currentPage = 1;
        this.resultsPerPage = 6;
        this.mapInstance = null;
        this.searchFilters = {};
        
        this.init();
    }

    init() {
        this.initializeEventListeners();
        this.initializePriceRange();
        this.initializeAdvancedFilters();
    }

    // ==================== EVENT LISTENERS ====================
    initializeEventListeners() {
        // Formulario de búsqueda
        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => this.handleSearch(e));
        }

        // Botones de vista
        const mapViewBtn = document.getElementById('mapViewBtn');
        if (mapViewBtn) {
            mapViewBtn.addEventListener('click', () => this.toggleMapView());
        }

        // Botón cargar más
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMoreResults());
        }

        // Formularios de autenticación
        this.initializeAuthForms();
    }

    // ==================== FORMULARIOS DE AUTENTICACIÓN ====================
    initializeAuthForms() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register client form
        const registerClientForm = document.getElementById('registerClientForm');
        if (registerClientForm) {
            registerClientForm.addEventListener('submit', (e) => this.handleClientRegister(e));
        }

        // Register trainer form
        const registerTrainerForm = document.getElementById('registerTrainerForm');
        if (registerTrainerForm) {
            registerTrainerForm.addEventListener('submit', (e) => this.handleTrainerRegister(e));
        }
    }

    async handleLogin(e) {
        e.preventDefault();

        const loginBtn = e.target.querySelector('button[type="submit"]');

        try {
            UIHelpers.showButtonSpinner(loginBtn, true);

            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;

            // Validar formulario
            if (!Validator.validateForm(e.target)) {
                return;
            }

            // 1. Intentar login como Cliente
            let user = null;
            let tipoUsuario = null;

            try {
                const idCliente = await ApiClient.get(`/Cliente/login/${email}/${password}`);
                if (idCliente) {
                    const cliente = await ApiClient.get(`/Cliente/obtener/${idCliente}`);
                    if (!cliente) throw new Error("No se encontraron los datos del cliente");
                    user = cliente;
                    tipoUsuario = "cliente";
                }
            } catch (err) {
                console.warn("No se encontró cliente, intentando como entrenador...");
            }

            // 2. Si no es Cliente, intentar login como Entrenador
            if (!user) {
                try {
                    const idEntrenador = await ApiClient.get(`/Entrenador/login/${email}/${password}`);
                    if (idEntrenador) {
                        const entrenador = await ApiClient.get(`/Entrenador/obtener/${idEntrenador}`);
                        if (!entrenador) throw new Error("No se encontraron los datos del entrenador");
                        user = entrenador;
                        tipoUsuario = "entrenador";
                    }
                } catch (err) {
                    console.warn("No se encontró entrenador");
                }
            }

            // 3. Si no encontró nada
            if (!user) {
                throw new Error("Correo o contraseña incorrectos");
            }

            // 4. Guardar sesión con tipo de usuario
            AuthManager.login("fakeToken", { ...user, tipoUsuario });

            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            modal.hide();

            // Mostrar mensaje de éxito
            const nombreMostrar = user.nombres || user.nombre || 'Usuario';
            UIHelpers.showToast(`¡Bienvenido ${nombreMostrar}!`, 'success');

            // Redirigir según tipo de usuario
            setTimeout(() => {
                if (tipoUsuario === 'entrenador') {
                    window.location.href = 'dashboard-entrenador.html';
                } else {
                    // Los clientes se quedan en index.html
                    AuthManager.updateUIAuthentication();
                }
            }, 1000);

        } catch (error) {
            console.error("Login error:", error);
            UIHelpers.showToast(error.message || "Error al iniciar sesión", "danger");
        } finally {
            UIHelpers.showButtonSpinner(loginBtn, false);
        }
    }   

    /////////////////////////////////////////////////////////////////////////////

    async handleClientRegister(e) {
        e.preventDefault();
        
        const registerBtn = e.target.querySelector('button[type="submit"]');
        
        try {
            UIHelpers.showButtonSpinner(registerBtn, true);

            const formData = {
                idCliente: null,
                nombres: document.getElementById('clientFirstName').value.trim() || "", 
                apellidos: document.getElementById('clientLastName').value.trim() || "",
                correo: document.getElementById('clientEmail').value.trim(),
                contrasenia: document.getElementById('clientPassword').value,
                fotoPerfil: null,
                fechaNacimiento: null,
                estatura: null,
                peso: null,
                telefono: document.getElementById('clientPhone').value.trim(),
                ubicacion: document.getElementById('clientLocation').value.trim(),
                fechaRegistro: null,
                sesiones: [],
                resenias: []
                
                
            };
            
            //console.log("formData que se envía: ", formData)
            const contrasenia = document.getElementById('clientPassword').value;
            const confirmPassword = document.getElementById('clientConfirmPassword').value;
            
            // Validar formulario
            if (!Validator.validateForm(e.target)) {
                return;
            }
            
            // Validación adicional de contraseñas
            if (!Validator.passwordsMatch(contrasenia, confirmPassword)) {
                UIHelpers.showToast('Las contraseñas no coinciden', 'danger');
                return;
            }
            
            const response = await ApiClient.post('/Cliente/crear', formData);
            
            if (response) {
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('registerClientModal'));
                modal.hide();

                // Mostrar mensaje de éxito
                UIHelpers.showToast('¡Registro exitoso! Por favor inicia sesión.', 'success');

                // Abrir modal de login
                setTimeout(() => {
                    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                    loginModal.show();
                }, 500);
            } else {
                throw new Error('Error en el registro');
            }

        } catch (error) {
            console.error('Register error:', error);
            UIHelpers.showToast(error.message || 'Error al registrarse', 'danger');
        } finally {
            UIHelpers.showButtonSpinner(registerBtn, false);
        }
    }

    //async handleTrainerRegister(e) {
    //    e.preventDefault();
    //    
    //    const registerBtn = e.target.querySelector('button[type="submit"]');
    //    
    //    try {
    //        UIHelpers.showButtonSpinner(registerBtn, true);
//
    //        const formData = new FormData();
    //        formData.append('firstName', document.getElementById('trainerFirstName').value.trim());
    //        formData.append('lastName', document.getElementById('trainerLastName').value.trim());
    //        formData.append('email', document.getElementById('trainerEmail').value.trim());
    //        formData.append('phone', document.getElementById('trainerPhone').value.trim());
    //        formData.append('password', document.getElementById('trainerPassword').value);
    //        formData.append('confirmPassword', document.getElementById('trainerConfirmPassword').value);
    //        formData.append('specialty', document.getElementById('trainerSpecialty').value.trim());
    //        formData.append('location', document.getElementById('trainerLocation').value.trim());
    //        formData.append('userType', 'trainer');
//
    //        // Archivos
    //        const certifications = document.getElementById('trainerCertifications').files[0];
    //        const background = document.getElementById('trainerBackground').files[0];
    //        
    //        if (certifications) formData.append('certifications', certifications);
    //        if (background) formData.append('background', background);
//
    //        // Validar formulario
    //        if (!Validator.validateForm(e.target)) {
    //            return;
    //        }
//
    //        // TODO: Reemplazar con llamada real al API
    //        // const response = await ApiClient.post('/auth/register-trainer', formData);
    //        
    //        // Simulación temporal
    //        const mockResponse = await this.simulateTrainerRegisterAPI(formData);
    //        
    //        if (mockResponse.success) {
    //            // Cerrar modal
    //            const modal = bootstrap.Modal.getInstance(document.getElementById('registerTrainerModal'));
    //            modal.hide();
    //            
    //            // Mostrar mensaje de éxito
    //            UIHelpers.showToast('¡Registro exitoso! Tu cuenta será revisada en 24-48 horas.', 'success');
    //            
    //        } else {
    //            throw new Error(mockResponse.message || 'Error en el registro');
    //        }
//
    //    } catch (error) {
    //        console.error('Trainer register error:', error);
    //        UIHelpers.showToast(error.message || 'Error al registrarse como entrenador', 'danger');
    //    } finally {
    //        UIHelpers.showButtonSpinner(registerBtn, false);
    //    }
    //}


//------------------------------------------------------------------------------------------------------------------------------------------
    async handleTrainerRegister(e) {
        e.preventDefault();
        
        const registerBtn = e.target.querySelector('button[type="submit"]');
        
        try {
            UIHelpers.showButtonSpinner(registerBtn, true);

            const formData = {
                idEntrenador: null,
                nombres: document.getElementById('trainerFirstName').value.trim(),
                apellidos: document.getElementById('trainerLastName').value.trim(),
                correo: document.getElementById('trainerEmail').value.trim(),
                contrasenia: document.getElementById('trainerPassword').value,
                especialidad: [document.getElementById('trainerSpecialty').value.trim()],
                certificaciones: [], // Se manejarían por separado los archivos
                fotoPerfil: null,
                fechaRegistro: null,
                resenias: [],
                sesiones: [],
                servicios: []
            };
            
            console.log("formData que se envía:", formData);
            // Validar formulario
            if (!Validator.validateForm(e.target)) {
                return;
            }

            // Validación adicional de contraseñas
            const confirmPassword = document.getElementById('trainerConfirmPassword').value;
            if (formData.contrasenia !== confirmPassword) {
                UIHelpers.showToast('Las contraseñas no coinciden', 'danger');
                return;
            }

            const response = await ApiClient.post('/Entrenador/crear', formData);

            if (response) {
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('registerTrainerModal'));
                modal.hide();

                // Mostrar mensaje de éxito
                UIHelpers.showToast('¡Registro exitoso! Tu cuenta será revisada en 24-48 horas.', 'success');

            } else {
                throw new Error('Error en el registro');
            }

        } catch (error) {
            console.error('Trainer register error:', error);
            UIHelpers.showToast(error.message || 'Error al registrarse como entrenador', 'danger');
        } finally {
            UIHelpers.showButtonSpinner(registerBtn, false);
        }
    }   


    // ==================== BÚSQUEDA ====================
    initializePriceRange() {
        const priceRange = document.getElementById('priceRange');
        const priceValue = document.getElementById('priceValue');
        
        if (priceRange && priceValue) {
            priceRange.addEventListener('input', function() {
                const value = UIHelpers.formatPrice(parseInt(this.value));
                priceValue.textContent = value;
            });
        }
    }

    initializeAdvancedFilters() {
        const advancedFilters = document.getElementById('advancedFilters');
        if (advancedFilters) {
            advancedFilters.addEventListener('show.bs.collapse', function() {
                const icon = document.querySelector('.more-filters-btn .bi-chevron-down');
                if (icon) {
                    icon.classList.remove('bi-chevron-down');
                    icon.classList.add('bi-chevron-up');
                }
                document.querySelector('.filter-text').textContent = 'Menos filtros';
            });

            advancedFilters.addEventListener('hide.bs.collapse', function() {
                const icon = document.querySelector('.more-filters-btn .bi-chevron-up');
                if (icon) {
                    icon.classList.remove('bi-chevron-up');
                    icon.classList.add('bi-chevron-down');
                }
                document.querySelector('.filter-text').textContent = 'Más filtros';
            });
        }
    }

    async handleSearch(e) {
        e.preventDefault();

        try {
            const sport = document.getElementById('sport').value || '';
            const location = document.getElementById('location').value || '';

            // Verificar si filtros avanzados están colapsados
            const advancedFiltersVisible = document.getElementById('advancedFilters').classList.contains('show');

            const maxPrice = advancedFiltersVisible
                ? parseInt(document.getElementById('priceRange').value)
                : 0;

            const experienceLevel = advancedFiltersVisible
                ? document.querySelector('input[name="experienceLevel"]:checked')?.value || ''
                : null;

            // Validar campos requeridos
            if (!sport || !location) {
                UIHelpers.showToast('Por favor selecciona un deporte y una localidad', 'warning');
                return;
            }

            this.showSearchLoading(true);

            // Construir endpoint
            const endpoint = `/Servicio/filtros/${sport}/${location}/${maxPrice ?? '0'}/${experienceLevel ?? 'null'}`;
            console.log("Endpoint generado:", endpoint);

            const results = await ApiClient.get(endpoint);
            console.log("Resultados recibidos:", results);

            // Mapear resultados del API al formato esperado
            this.currentResults = this.mapApiResultsToDisplayFormat(results);
            this.currentPage = 1;

            this.displayResults();
            this.showResultsSection();
            UIHelpers.scrollToElement('resultsSection', 100);

        } catch (error) {
            console.error('Search error:', error);
            UIHelpers.showToast('Error al realizar la búsqueda', 'danger');
        } finally {
            this.showSearchLoading(false);
        }
    }

    // NUEVA FUNCIÓN: Mapear resultados del API al formato de visualización
    mapApiResultsToDisplayFormat(apiResults) {
        if (!Array.isArray(apiResults)) {
            console.error('Los resultados no son un array:', apiResults);
            return [];
        }

        return apiResults.map(servicio => ({
            id: servicio.idServicio,
            title: servicio.nombre,
            type: 'Entrenador', // Siempre es entrenador según tu estructura
            name: servicio.entrenador ? `${servicio.entrenador.nombres} ${servicio.entrenador.apellidos}` : 'Entrenador',
            location: servicio.ubicacion,
            price: servicio.precio,
            rating: 4.5, // Por defecto, puedes calcular esto si tienes reseñas
            reviews: 0, // Por defecto, actualizar si tienes el dato
            image: this.getDefaultImageByDeporte(servicio.deporte), // Imagen por deporte
            available: servicio.estado === 'Activo',
            sport: servicio.deporte,
            experience: servicio.nivel,
            description: servicio.descripcion,
            duracion: servicio.duracion,
            cuposDisponibles: servicio.cuposDisponibles,
            entrenadorId: servicio.entrenador?.idEntrenador,
            entrenadorEmail: servicio.entrenador?.correo
        }));
    }

    // NUEVA FUNCIÓN: Obtener imagen por defecto según el deporte
    getDefaultImageByDeporte(deporte) {
        const imageMap = {
            'Fútbol': 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'Tenis': 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'Natación': 'https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'Boxeo': 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'Crossfit': 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'CrossFit': 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'Entrenamiento funcional': 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'Baloncesto': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'Voleibol': 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'Artes marciales': 'https://images.unsplash.com/photo-1555597673-b21d5c935865?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'Yoga': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            'Pilates': 'https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        };

        return imageMap[deporte] || 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    }

    getSelectedExperienceLevels() {
        const levels = [];
        if (document.getElementById('beginner').checked) levels.push('principiante');
        if (document.getElementById('intermediate').checked) levels.push('intermedio');
        if (document.getElementById('advanced').checked) levels.push('avanzado');
        return levels;
    }

    showSearchLoading(show) {
        const submitBtn = document.querySelector('#searchForm button[type="submit"]');
        if (submitBtn) {
            if (show) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Buscando...';
            } else {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-search"></i> Buscar';
            }
        }
    }

    // ==================== RESULTADOS ====================
    displayResults() {
        const listResults = document.getElementById('listResults');
        if (!listResults) return;

        listResults.innerHTML = '';
        
        const startIndex = (this.currentPage - 1) * this.resultsPerPage;
        const endIndex = startIndex + this.resultsPerPage;
        const resultsToShow = this.currentResults.slice(0, endIndex);

        if (resultsToShow.length === 0) {
            listResults.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-search display-1 text-muted mb-3"></i>
                    <h3>No se encontraron resultados</h3>
                    <p class="text-muted">Intenta ajustar tus filtros de búsqueda</p>
                </div>
            `;
            return;
        }

        resultsToShow.forEach(item => {
            const card = this.createResultCard(item);
            listResults.appendChild(card);
        });

        // Actualizar botón "Cargar más"
        this.updateLoadMoreButton();
    }

    createResultCard(item) {
        const card = document.createElement('div');
        card.className = 'col-md-4 mb-4 fade-in';
        
        card.innerHTML = `
            <div class="card h-100 result-card">
                <div class="position-relative">
                    <img src="${item.image}" class="card-img-top" alt="${item.title}" loading="lazy" 
                        style="height: 200px; object-fit: cover;">
                    <span class="availability-badge ${item.available ? 'available' : 'unavailable'}">
                        ${item.available ? 'Disponible' : 'No disponible'}
                    </span>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${item.title}</h5>
                    <p class="text-muted mb-2">
                        <i class="bi bi-person"></i> ${item.name}
                    </p>
                    <p class="text-muted mb-2">
                        <i class="bi bi-geo-alt"></i> ${item.location}
                    </p>
                    <div class="mb-2">
                        <span class="fw-bold">${UIHelpers.formatPrice(item.price)}</span> / sesión
                    </div>
                    <div class="d-flex justify-content-between mb-3">
                        <span>
                            <i class="bi bi-people-fill text-primary"></i> 
                            ${item.cuposDisponibles} cupos
                        </span>
                        <span class="localidad-badge">${item.sport}</span>
                    </div>
                    <div class="mb-3">
                        <small class="text-muted">
                            <i class="bi bi-clock"></i> ${item.duracion} min | 
                            <i class="bi bi-award"></i> ${item.experience}
                        </small>
                    </div>
                    <p class="text-muted small">${this.truncateText(item.description, 100)}</p>
                    <button class="btn btn-outline-primary w-100 view-details" data-id="${item.id}">
                        <i class="bi bi-eye"></i> Ver detalles
                    </button>
                </div>
            </div>
        `;

        // Event listener para ver detalles
        const detailsBtn = card.querySelector('.view-details');
        detailsBtn.addEventListener('click', () => this.showItemDetails(item));

        return card;
    }

    // NUEVA FUNCIÓN: Truncar texto
    truncateText(text, maxLength) {
        if (!text) return 'Sin descripción disponible';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    showItemDetails(item) {
        const modalHTML = `
            <div class="modal fade" id="servicioDetalleModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title"><i class="bi bi-info-circle"></i> ${item.title}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-4 text-center mb-3">
                                    <img src="${item.image}" class="img-fluid rounded" alt="${item.title}">
                                    <div class="mt-3">
                                        <span class="badge ${item.available ? 'bg-success' : 'bg-danger'} fs-6">
                                            ${item.available ? 'Disponible' : 'No disponible'}
                                        </span>
                                    </div>
                                </div>
                                <div class="col-md-8">
                                    <h6 class="text-primary mb-3">Información del Servicio</h6>
                                    <p><strong>Entrenador:</strong> ${item.name}</p>
                                    <p><strong>Deporte:</strong> ${item.sport}</p>
                                    <p><strong>Nivel:</strong> ${item.experience}</p>
                                    <p><strong>Ubicación:</strong> ${item.location}</p>
                                    <p><strong>Duración:</strong> ${item.duracion} minutos</p>
                                    <p><strong>Cupos disponibles:</strong> ${item.cuposDisponibles} personas</p>
                                    <p><strong>Precio por sesión:</strong> <span class="text-success fw-bold">${UIHelpers.formatPrice(item.price)}</span></p>

                                    <hr>

                                    <h6 class="text-primary mb-2">Descripción</h6>
                                    <p>${item.description}</p>

                                    ${item.entrenadorEmail ? `
                                        <hr>
                                        <p class="mb-0"><i class="bi bi-envelope"></i> Contacto: ${item.entrenadorEmail}</p>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            <button type="button" class="btn btn-primary" onclick="indexPageManager.agendarServicio(${item.id})">
                                <i class="bi bi-calendar-check"></i> Agendar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Eliminar modal existente si hay uno
        const existingModal = document.getElementById('servicioDetalleModal');
        if (existingModal) existingModal.remove();
                                    
        document.body.insertAdjacentHTML('beforeend', modalHTML);
                                    
        const modal = new bootstrap.Modal(document.getElementById('servicioDetalleModal'));
        modal.show();

        // Limpiar modal del DOM al cerrarse
        document.getElementById('servicioDetalleModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    showResultsSection() {
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'block';
        }
    }

    async agendarServicio(servicioId) {
        // Verificar si el usuario está autenticado
        if (!AuthManager.isAuthenticated()) {
            UIHelpers.showToast('Debes iniciar sesión para agendar una sesión', 'warning');

            // Cerrar modal de detalles
            const modal = bootstrap.Modal.getInstance(document.getElementById('servicioDetalleModal'));
            if (modal) modal.hide();

            // Abrir modal de login
            setTimeout(() => {
                const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                loginModal.show();
            }, 500);

            return;
        }

        const user = AuthManager.getUser();

        // Verificar que sea cliente
        if (user.tipoUsuario !== 'cliente') {
            UIHelpers.showToast('Solo los clientes pueden agendar sesiones', 'warning');
            return;
        }

        // Buscar el servicio en los resultados actuales
        const servicio = this.currentResults.find(s => s.id === servicioId);

        if (!servicio) {
            UIHelpers.showToast('Servicio no encontrado', 'danger');
            return;
        }

        // Verificar cupos disponibles
        if (servicio.cuposDisponibles <= 0) {
            UIHelpers.showToast('No hay cupos disponibles para este servicio', 'warning');
            return;
        }

        // Confirmar agendamiento
        UIHelpers.showConfirmModal(
            'Confirmar Agendamiento',
            `¿Deseas agendar una sesión de <strong>${servicio.title}</strong> con ${servicio.name}?<br><br>
            <strong>Precio:</strong> ${UIHelpers.formatPrice(servicio.price)}<br>
            <strong>Duración:</strong> ${servicio.duracion} minutos<br>
            <strong>Ubicación:</strong> ${servicio.location}`,
            async () => {
                await this.procesarAgendamiento(servicioId, servicio, user);
            }
        );
    }

    async procesarAgendamiento(servicioId, servicio, user) {
        try {
            // Mostrar loading en el botón
            const agendarBtn = document.querySelector(`button[onclick="indexPageManager.agendarServicio(${servicioId})"]`);
            if (agendarBtn) {
                agendarBtn.disabled = true;
                agendarBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Agendando...';
            }

            // Preparar datos de la sesión
            const sesionData = {
                idSesion: null,
                fechaHora: this.obtenerProximaFechaDisponible(), // Fecha/hora actual o próxima disponible
                estado: "Pendiente", // O "Confirmada" según tu lógica
                cliente: {
                    idCliente: user.idCliente//,
                    //nombres: user.nombres,
                    //apellidos: user.apellidos,
                    //correo: user.correo,
                    //contrasenia: user.contrasenia,
                    //fotoPerfil: user.fotoPerfil || null,
                    //fechaNacimiento: user.fechaNacimiento || null,
                    //estatura: user.estatura || null,
                    //peso: user.peso || null,
                    //telefono: user.telefono || null,
                    //ubicacion: user.ubicacion || null,
                    //fechaRegistro: user.fechaRegistro || null
                },
                entrenador: {
                    idEntrenador: servicio.entrenadorId//,
                    //nombres: servicio.name.split(' ')[0],
                    //apellidos: servicio.name.split(' ').slice(1).join(' '),
                    //correo: servicio.entrenadorEmail || '',
                    //contrasenia: '', // No es necesario enviarlo
                    //especialidad: [servicio.sport],
                    //certificaciones: [],
                    //fotoPerfil: null,
                    //fechaRegistro: null
                },
                servicio: {
                    idServicio: servicioId,
                    //nombre: servicio.title,
                    //descripcion: servicio.description,
                    //precio: servicio.price,
                    //deporte: servicio.sport,
                    //nivel: servicio.experience,
                    //duracion: servicio.duracion,
                    cuposDisponibles: servicio.cuposDisponibles - 1, // Reducir cupo
                    //estado: servicio.available ? "Activo" : "Inactivo",
                    //ubicacion: servicio.location
                }
            };

            console.log('Datos de sesión a enviar:', sesionData);

            // Crear la sesión
            const response = await ApiClient.post('/Sesion/crear', sesionData);

            if (response) {
                // Cerrar modal de detalles
                const modal = bootstrap.Modal.getInstance(document.getElementById('servicioDetalleModal'));
                if (modal) modal.hide();

                // Mostrar mensaje de éxito
                UIHelpers.showToast('¡Sesión agendada exitosamente!', 'success');

                // Actualizar cupos en el resultado local
                servicio.cuposDisponibles -= 1;

                // Recargar los resultados para mostrar cupos actualizados
                this.displayResults();

                // Opcional: Redirigir a la página de sesiones
                setTimeout(() => {
                    const irASesiones = confirm('¿Deseas ver tus sesiones agendadas?');
                    if (irASesiones) {
                        window.location.href = 'perfil.html?tab=agendadas';
                    }
                }, 1500);

            } else {
                throw new Error('No se pudo crear la sesión');
            }

        } catch (error) {
            console.error('Error al agendar sesión:', error);
            UIHelpers.showToast(error.message || 'Error al agendar la sesión', 'danger');
        } finally {
            // Restaurar botón
            const agendarBtn = document.querySelector(`button[onclick="indexPageManager.agendarServicio(${servicioId})"]`);
            if (agendarBtn) {
                agendarBtn.disabled = false;
                agendarBtn.innerHTML = '<i class="bi bi-calendar-check"></i> Agendar Sesión';
            }
        }
    }

// NUEVA FUNCIÓN: Obtener próxima fecha disponible (formato LocalDateTime para Java)
    obtenerProximaFechaDisponible() {
        // Obtener fecha/hora actual
        const ahora = new Date();

        // Sumar 1 día para la sesión (puedes ajustar esto según tu lógica)
        const proximaFecha = new Date(ahora.getTime() + (24 * 60 * 60 * 1000));

        // Formatear a ISO 8601 compatible con LocalDateTime de Java
        // Formato: "2025-11-03T10:00:00"
        const year = proximaFecha.getFullYear();
        const month = String(proximaFecha.getMonth() + 1).padStart(2, '0');
        const day = String(proximaFecha.getDate()).padStart(2, '0');
        const hours = String(proximaFecha.getHours()).padStart(2, '0');
        const minutes = String(proximaFecha.getMinutes()).padStart(2, '0');
        const seconds = String(proximaFecha.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }

    updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            const totalResults = this.currentResults.length;
            const shownResults = this.currentPage * this.resultsPerPage;
            
            if (shownResults >= totalResults) {
                loadMoreBtn.style.display = 'none';
            } else {
                loadMoreBtn.style.display = 'block';
                const remainingResults = totalResults - shownResults;
                loadMoreBtn.textContent = `Cargar más resultados (${remainingResults} restantes)`;
            }
        }
    }

    loadMoreResults() {
        this.currentPage++;
        this.displayResults();
    }

    // ==================== VISTA DE MAPA ====================
    toggleMapView() {
        const mapViewBtn = document.getElementById('mapViewBtn');
        const listResults = document.getElementById('listResults');
        const mapResults = document.getElementById('mapResults');
        
        if (!mapViewBtn || !listResults || !mapResults) return;

        if (mapResults.style.display === 'none') {
            // Mostrar mapa
            mapResults.style.display = 'block';
            listResults.style.display = 'none';
            mapViewBtn.innerHTML = '<i class="bi bi-list"></i> Vista lista';
            
            this.initializeMap();
        } else {
            // Mostrar lista
            mapResults.style.display = 'none';
            listResults.style.display = 'block';
            mapViewBtn.innerHTML = '<i class="bi bi-map"></i> Vista mapa';
        }
    }

    initializeMap() {
        // TODO: Implementar inicialización del mapa con Google Maps o similar
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div class="d-flex align-items-center justify-content-center h-100">
                    <div class="text-center">
                        <i class="bi bi-map display-1 text-muted mb-3"></i>
                        <h4>Mapa de resultados</h4>
                        <p class="text-muted">Funcionalidad de mapa en desarrollo</p>
                    </div>
                </div>
            `;
        }
        console.log('Mapa inicializado con resultados:', this.currentResults);
    }

    // ==================== SIMULACIONES DE API (TEMPORAL) ====================
    async simulateLoginAPI(credentials) {
        // Simulación de delay de red
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Validación simple para la demo
        if (credentials.email === 'demo@sportlink.com' && credentials.password === 'Jp123456') {
            return {
                success: true,
                token: 'fake-jwt-token-' + Date.now(),
                user: {
                    id: 1,
                    name: 'Usuario Demo',
                    email: credentials.email,
                    type: 'client'
                }
            };
        } else {
            return {
                success: false,
                message: 'Credenciales incorrectas. Usa: demo@sportlink.com / 123456'
            };
        }
    }

    async simulateRegisterAPI(formData) {
        // Simulación de delay de red
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        return {
            success: true,
            message: 'Usuario registrado exitosamente'
        };
    }

    async simulateTrainerRegisterAPI(formData) {
        // Simulación de delay de red
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
            success: true,
            message: 'Entrenador registrado exitosamente'
        };
    }

    async simulateSearchAPI(filters) {
        // Simulación de delay de red
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Datos de ejemplo filtrados según los criterios
        const allResults = [
            {
                id: 1,
                title: "Clases de Fútbol Avanzado",
                type: "Entrenador",
                name: "Prof. Carlos Martínez",
                location: "Chapinero, Bogotá",
                price: 80000,
                rating: 4.8,
                reviews: 45,
                image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                available: true,
                sport: "Fútbol",
                experience: "Avanzado",
                description: "Entrenador profesional con más de 10 años de experiencia formando jugadores. Especializado en técnica individual y táctica de juego."
            },
            {
                id: 2,
                title: "Escuela de Tenis La Sabana",
                type: "Centro deportivo",
                name: "",
                location: "Usaquén, Bogotá",
                price: 120000,
                rating: 4.6,
                reviews: 32,
                image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                available: true,
                sport: "Tenis",
                experience: "Todos los niveles",
                description: "Canchas de tenis profesionales con iluminación LED. Ofrecemos clases para todas las edades y niveles."
            },
            {
                id: 3,
                title: "Natación para adultos",
                type: "Entrenador",
                name: "Prof. Laura Gómez",
                location: "Teusaquillo, Bogotá",
                price: 70000,
                rating: 4.9,
                reviews: 28,
                image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                available: true,
                sport: "Natación",
                experience: "Principiante/Intermedio",
                description: "Clases personalizadas de natación para adultos. Enfoque en técnica y superación del miedo al agua."
            },
            {
                id: 4,
                title: "CrossFit Zona Norte",
                type: "Centro deportivo",
                name: "",
                location: "Suba, Bogotá",
                price: 95000,
                rating: 4.7,
                reviews: 67,
                image: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                available: true,
                sport: "Crossfit",
                experience: "Todos los niveles",
                description: "Gimnasio especializado en CrossFit con equipos de última generación y entrenadores certificados."
            },
            {
                id: 5,
                title: "Boxeo Profesional",
                type: "Entrenador",
                name: "Prof. Miguel Herrera",
                location: "Kennedy, Bogotá",
                price: 60000,
                rating: 4.5,
                reviews: 23,
                image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                available: false,
                sport: "Boxeo",
                experience: "Intermedio/Avanzado",
                description: "Entrenamiento de boxeo profesional. Técnicas de combate, acondicionamiento físico y defensa personal."
            }
        ];
        
        // Filtrar por deporte
        let filteredResults = allResults.filter(item => 
            item.sport.toLowerCase().includes(filters.sport.toLowerCase())
        );
        
        // Filtrar por precio
        filteredResults = filteredResults.filter(item => 
            item.price <= filters.maxPrice
        );
        
        // Filtrar por tipo de servicio
        if (!filters.includeCenters || !filters.includeTrainers) {
            filteredResults = filteredResults.filter(item => {
                if (filters.includeCenters && item.type === "Centro deportivo") return true;
                if (filters.includeTrainers && item.type === "Entrenador") return true;
                return false;
            });
        }
        
        return filteredResults;
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.indexPageManager = new IndexPageManager();
});