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

    //async handleLogin(e) {
    //    e.preventDefault();
    //    
    //    const loginBtn = e.target.querySelector('button[type="submit"]');
    //    
    //    try {
    //        UIHelpers.showButtonSpinner(loginBtn, true);
//
    //        const email = document.getElementById('loginEmail').value.trim();
    //        const password = document.getElementById('loginPassword').value;
//
    //        // Validar formulario
    //        if (!Validator.validateForm(e.target)) {
    //            return;
    //        }
//
    //        // Obtener todos los clientes
    //        const clientes = await ApiClient.get('/Cliente/obtenerTodos');
//
    //        // Buscar coincidencia de email + contraseña
    //        const cliente = clientes.find(c => c.correo === email && c.contrasenia === password);
//
    //        if (cliente) {
    //            // Guardar sesión
    //            AuthManager.login("fakeToken", cliente);
//
    //            // Cerrar modal
    //            const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
    //            modal.hide();
//
    //            // Mostrar mensaje de éxito
    //            UIHelpers.showToast(`¡Bienvenido ${cliente.nombre}!`, 'success');
//
    //            // Actualizar UI
    //            AuthManager.updateUIAuthentication();
    //        } else {
    //            throw new Error('Correo o contraseña incorrectos');
    //        }
//
    //    } catch (error) {
    //        console.error('Login error:', error);
    //        UIHelpers.showToast(error.message || 'Error al iniciar sesión', 'danger');
    //    } finally {
    //        UIHelpers.showButtonSpinner(loginBtn, false);
    //    }
    //}

    //async handleLogin(e) {
    //    e.preventDefault();
    //    
    //    const loginBtn = e.target.querySelector('button[type="submit"]');
    //    
    //    try {
    //        UIHelpers.showButtonSpinner(loginBtn, true);
//
    //        const email = document.getElementById('loginEmail').value.trim();
    //        const password = document.getElementById('loginPassword').value;
//
    //        // Validar formulario
    //        if (!Validator.validateForm(e.target)) {
    //            return;
    //        }
//
    //        // Llamar al nuevo endpoint de login
    //        const idCliente = await ApiClient.get(`/Cliente/login/${email}/${password}`);
//
    //        if (idCliente) {
    //            // Traer datos completos del cliente
    //            const cliente = await ApiClient.get(`/Cliente/obtener/${idCliente}`);
//
    //            if (!cliente) {
    //                throw new Error("No se encontraron los datos del cliente");
    //            }
//
    //            // Guardar sesión
    //            AuthManager.login("fakeToken", cliente);
//
    //            // Cerrar modal
    //            const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
    //            modal.hide();
//
    //            // Mostrar mensaje de éxito
    //            UIHelpers.showToast(`¡Bienvenido cliente ${cliente.nombre}!`, 'success');
//
    //            // Actualizar UI
    //            AuthManager.updateUIAuthentication();
//
    //        } else {
    //            const idEntrenador = await ApiClient.get(`/Entrenador/login/${email}/${password}`);
    //            if (idEntrenador){
    //                // Traer datos completos del cliente
    //                const entrenador = await ApiClient.get(`/Entrenador/obtener/${idEntrenador}`);
//
    //                if (!entrenador) {
    //                    throw new Error("No se encontraron los datos del cliente");
    //                }
//
    //                // Guardar sesión
    //                AuthManager.login("fakeToken", entrenador);
//
    //                // Cerrar modal
    //                const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
    //                modal.hide();
//
    //                // Mostrar mensaje de éxito
    //                UIHelpers.showToast(`¡Bienvenido entrenador ${entrenador.nombre}!`, 'success');
//
    //                // Actualizar UI
    //                AuthManager.updateUIAuthentication();
    //            } else{
    //                throw new Error('Correo o contraseña incorrectos, Usuario no encontrado');
    //            }
    //        }
//
    //    } catch (error) {
    //        console.error('Login error:', error);
    //        UIHelpers.showToast(error.message || 'Error al iniciar sesión', 'danger');
    //    } finally {
    //        UIHelpers.showButtonSpinner(loginBtn, false);
    //    }
    //}   


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
            console.log(user)
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
                throw new Error("Correo o contraseña incorrectos, usuario no encontrado");
            }

            // 4. Guardar sesión
            AuthManager.login("fakeToken", { ...user, tipoUsuario });

            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            modal.hide();

            // Mostrar mensaje de éxito
            UIHelpers.showToast(`¡Bienvenido ${tipoUsuario}: ${user.nombres}!`, 'success');

            // Actualizar UI según tipo de usuario
            AuthManager.updateUIAuthentication();

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
            // Recopilar datos de búsqueda
            this.searchFilters = {
                sport: document.getElementById('sport').value,
                location: document.getElementById('location').value,
                date: document.getElementById('date').value,
                maxPrice: parseInt(document.getElementById('priceRange').value),
                includeCenters: document.getElementById('centers').checked,
                includeTrainers: document.getElementById('trainers').checked,
                schedule: document.getElementById('schedule').value,
                experienceLevels: this.getSelectedExperienceLevels()
            };

            // Validar campos requeridos
            if (!this.searchFilters.sport || !this.searchFilters.location) {
                UIHelpers.showToast('Por favor selecciona un deporte y una localidad', 'warning');
                return;
            }

            // Mostrar loading
            this.showSearchLoading(true);

            // TODO: Reemplazar con llamada real al API
            // const results = await ApiClient.post('/search', this.searchFilters);
            
            // Simulación temporal
            const results = await this.simulateSearchAPI(this.searchFilters);
            
            this.currentResults = results;
            this.currentPage = 1;
            
            this.displayResults();
            this.showResultsSection();
            
            // Scroll a resultados
            UIHelpers.scrollToElement('resultsSection', 100);

        } catch (error) {
            console.error('Search error:', error);
            UIHelpers.showToast('Error al realizar la búsqueda', 'danger');
        } finally {
            this.showSearchLoading(false);
        }
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
                    <img src="${item.image}" class="card-img-top" alt="${item.title}" loading="lazy">
                    <span class="availability-badge ${item.available ? 'available' : 'unavailable'}">
                        ${item.available ? 'Disponible' : 'No disponible'}
                    </span>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${item.title}</h5>
                    ${item.type === 'Entrenador' ? `<p class="text-muted mb-2"><i class="bi bi-person"></i> ${item.name}</p>` : ''}
                    <p class="text-muted mb-2"><i class="bi bi-geo-alt"></i> ${item.location}</p>
                    <div class="mb-2">
                        <span class="fw-bold">${UIHelpers.formatPrice(item.price)}</span> / sesión
                    </div>
                    <div class="d-flex justify-content-between mb-3">
                        <span><i class="bi bi-star-fill text-warning"></i> ${item.rating} (${item.reviews})</span>
                        <span class="localidad-badge">${item.sport}</span>
                    </div>
                    <p class="text-muted small">${item.description}</p>
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

    showItemDetails(item) {
        // TODO: Implementar modal de detalles o redirección a página de detalles
        UIHelpers.showToast(`Mostrando detalles de: ${item.title}`, 'info');
        console.log('Item details:', item);
    }

    showResultsSection() {
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'block';
        }
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