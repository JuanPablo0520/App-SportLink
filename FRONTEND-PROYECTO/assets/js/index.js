/* assets/js/index.js - Lógica específica para la página de inicio */

class IndexPageManager {
    constructor() {
        this.currentResults = [];
        this.currentPage = 1;
        this.resultsPerPage = 6;
        this.mapInstance = null;
        this.searchFilters = {};
        this.emailCheckTimeout = null;
        this.emailAvailable = { client: false, trainer: false };
        
        // Variables para el modal de verificación
        this.resendTimeout = null;
        this.resendCountdownInterval = null;

        this.init();
    }

    init() {
        this.initializeEventListeners();
        this.initializePriceRange();
        this.initializeAdvancedFilters();
        this.initializeEmailValidation();
        this.initializeVerificationModal(); // NUEVO
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

    // ==================== INICIALIZAR MODAL DE VERIFICACIÓN ====================
    initializeVerificationModal() {
        // Botón de cerrar (X)
        const closeBtn = document.getElementById("closeVerifyModal");
        if (closeBtn) {
            closeBtn.addEventListener("click", () => this.cerrarModalVerificacion());
        }
        
        // Botón de reenviar código
        const resendBtn = document.getElementById("resendCodeBtn");
        if (resendBtn) {
            resendBtn.addEventListener("click", async () => {
                const correo = document.getElementById("verifyEmailDisplay").textContent;
                
                if (correo && correo !== "correo@ejemplo.com") {
                    resendBtn.disabled = true;
                    
                    try {
                        let result = null;
                        try {
                            result = await ApiClient.get(`/CodigoVerificacion/crear/${correo}`);
                        } catch (err) {
                            console.warn("Respuesta vacía del servidor:", err);
                        }
                        
                        UIHelpers.showToast("Código reenviado exitosamente", "success");
                        this.iniciarCountdownReenvio();
                        
                    } catch (error) {
                        console.error("Error reenviando código:", error);
                        UIHelpers.showToast("Error al reenviar el código", "danger");
                        resendBtn.disabled = false;
                    }
                }
            });
        }
        
        // Validación en tiempo real del input
        const codeInput = document.getElementById("verificationCodeInput");
        if (codeInput) {
            codeInput.addEventListener("input", function(e) {
                // Solo permitir números
                this.value = this.value.replace(/[^0-9]/g, "");
                
                // Validar longitud
                if (this.value.length === 6) {
                    this.classList.remove("is-invalid");
                    this.classList.add("is-valid");
                } else {
                    this.classList.remove("is-valid");
                }
            });
            
            // Permitir verificar con Enter
            codeInput.addEventListener("keypress", function(e) {
                if (e.key === "Enter" && this.value.length === 6) {
                    document.getElementById("verifyCodeBtn").click();
                }
            });
        }
        
        // Limpiar estado cuando se cierra el modal
        const verifyModal = document.getElementById("verifyCodeModal");
        if (verifyModal) {
            verifyModal.addEventListener("hidden.bs.modal", () => {
                if (this.resendCountdownInterval) {
                    clearInterval(this.resendCountdownInterval);
                }
                if (codeInput) {
                    codeInput.value = "";
                    codeInput.classList.remove("is-invalid", "is-valid");
                }
                const countdownDisplay = document.getElementById("resendCountdown");
                if (countdownDisplay) {
                    countdownDisplay.textContent = "";
                }
            });
        }
    }

    // ==================== FUNCIONES DEL MODAL DE VERIFICACIÓN ====================
    
    // Función para iniciar countdown de reenvío (60 segundos)
    iniciarCountdownReenvio() {
        const resendBtn = document.getElementById("resendCodeBtn");
        const countdownDisplay = document.getElementById("resendCountdown");
        
        if (!resendBtn || !countdownDisplay) return;
        
        let segundosRestantes = 60;
        resendBtn.disabled = true;
        
        // Limpiar cualquier intervalo previo
        if (this.resendCountdownInterval) {
            clearInterval(this.resendCountdownInterval);
        }
        
        this.resendCountdownInterval = setInterval(() => {
            segundosRestantes--;
            
            if (segundosRestantes > 0) {
                countdownDisplay.textContent = `Podrás reenviar en ${segundosRestantes} segundos`;
            } else {
                clearInterval(this.resendCountdownInterval);
                resendBtn.disabled = false;
                countdownDisplay.textContent = "";
            }
        }, 1000);
    }

    // Cerrar modal y limpiar todo
    cerrarModalVerificacion() {
        const modal = bootstrap.Modal.getInstance(document.getElementById("verifyCodeModal"));
        if (modal) {
            modal.hide();
        }
        
        // Limpiar intervalos
        if (this.resendCountdownInterval) {
            clearInterval(this.resendCountdownInterval);
        }
        
        // Limpiar campos
        const codeInput = document.getElementById("verificationCodeInput");
        if (codeInput) {
            codeInput.value = "";
            codeInput.classList.remove("is-invalid", "is-valid");
        }
        
        const countdownDisplay = document.getElementById("resendCountdown");
        if (countdownDisplay) {
            countdownDisplay.textContent = "";
        }
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

    initializeEmailValidation() {
        // Validación para email de cliente
        const clientEmail = document.getElementById('clientEmail');
        if (clientEmail) {
            clientEmail.addEventListener('input', UIHelpers.debounce((e) => {
                this.verificarCorreoCliente(e.target.value);
            }, 500));

            // Limpiar al enfocar
            clientEmail.addEventListener('focus', () => {
                this.limpiarEstadoEmail('client');
            });
        }

        // Validación para email de entrenador
        const trainerEmail = document.getElementById('trainerEmail');
        if (trainerEmail) {
            trainerEmail.addEventListener('input', UIHelpers.debounce((e) => {
                this.verificarCorreoEntrenador(e.target.value);
            }, 500));

            // Limpiar al enfocar
            trainerEmail.addEventListener('focus', () => {
                this.limpiarEstadoEmail('trainer');
            });
        }
    }

    async verificarCorreoCliente(correo) {
        const emailInput = document.getElementById('clientEmail');
        const feedbackDiv = emailInput.parentNode.querySelector('.invalid-feedback');

        // Validar formato básico primero
        if (!correo || !Validator.isValidEmail(correo)) {
            if (correo) {
                emailInput.classList.remove('is-valid');
                emailInput.classList.add('is-invalid');
                feedbackDiv.textContent = 'Por favor ingresa un email válido.';
            }
            this.emailAvailable.client = false;
            return;
        }

        try {
            // Mostrar indicador de carga
            this.mostrarCargandoEmail(emailInput, true);

            // Verificar en cliente
            const existeCliente = await ApiClient.get(`/Cliente/verificarCorreo/${correo}`);

            // Verificar en entrenador también
            const existeEntrenador = await ApiClient.get(`/Entrenador/verificarCorreo/${correo}`);

            const existe = existeCliente || existeEntrenador;

            if (existe) {
                // Email ya existe
                emailInput.classList.remove('is-valid');
                emailInput.classList.add('is-invalid');
                feedbackDiv.textContent = '❌ No es posible registrar un cliente con este correo.';
                this.emailAvailable.client = false;

                // Opcionalmente, ofrecer ir al login
                const loginLink = feedbackDiv.parentNode.querySelector('.email-login-link');
                if (!loginLink) {
                    const link = document.createElement('small');
                    link.className = 'email-login-link d-block mt-1';
                    link.innerHTML = '<a href="#" onclick="indexPageManager.abrirLogin(); return false;">¿Ya tienes cuenta? Inicia sesión aquí</a>';
                    feedbackDiv.parentNode.appendChild(link);
                }
            } else {
                // Email disponible
                emailInput.classList.remove('is-invalid');
                emailInput.classList.add('is-valid');
                feedbackDiv.textContent = '';
                this.emailAvailable.client = true;

                // Mostrar mensaje de éxito
                const successMsg = emailInput.parentNode.querySelector('.email-success-msg');
                if (!successMsg) {
                    const msg = document.createElement('small');
                    msg.className = 'email-success-msg text-success d-block mt-1';
                    msg.innerHTML = '✓ Correo disponible';
                    emailInput.parentNode.appendChild(msg);
                }
            }

        } catch (error) {
            console.error('Error verificando correo cliente:', error);
            emailInput.classList.remove('is-valid', 'is-invalid');
            this.emailAvailable.client = false;
        } finally {
            this.mostrarCargandoEmail(emailInput, false);
        }
    }

    async verificarCorreoEntrenador(correo) {
        const emailInput = document.getElementById('trainerEmail');
        const feedbackDiv = emailInput.parentNode.querySelector('.invalid-feedback');

        // Validar formato básico primero
        if (!correo || !Validator.isValidEmail(correo)) {
            if (correo) {
                emailInput.classList.remove('is-valid');
                emailInput.classList.add('is-invalid');
                feedbackDiv.textContent = 'Por favor ingresa un email válido.';
            }
            this.emailAvailable.trainer = false;
            return;
        }

        try {
            // Mostrar indicador de carga
            this.mostrarCargandoEmail(emailInput, true);

            // Verificar en entrenador
            const existeEntrenador = await ApiClient.get(`/Entrenador/verificarCorreo/${correo}`);

            // Verificar en cliente también
            const existeCliente = await ApiClient.get(`/Cliente/verificarCorreo/${correo}`);

            const existe = existeEntrenador || existeCliente;

            if (existe) {
                // Email ya existe
                emailInput.classList.remove('is-valid');
                emailInput.classList.add('is-invalid');
                feedbackDiv.textContent = '❌ No es posible registrar un entrenador con este correo.';
                this.emailAvailable.trainer = false;

                // Opcionalmente, ofrecer ir al login
                const loginLink = feedbackDiv.parentNode.querySelector('.email-login-link');
                if (!loginLink) {
                    const link = document.createElement('small');
                    link.className = 'email-login-link d-block mt-1';
                    link.innerHTML = '<a href="#" onclick="indexPageManager.abrirLogin(); return false;">¿Ya tienes cuenta? Inicia sesión aquí</a>';
                    feedbackDiv.parentNode.appendChild(link);
                }
            } else {
                // Email disponible
                emailInput.classList.remove('is-invalid');
                emailInput.classList.add('is-valid');
                feedbackDiv.textContent = '';
                this.emailAvailable.trainer = true;

                // Mostrar mensaje de éxito
                const successMsg = emailInput.parentNode.querySelector('.email-success-msg');
                if (!successMsg) {
                    const msg = document.createElement('small');
                    msg.className = 'email-success-msg text-success d-block mt-1';
                    msg.innerHTML = '✓ Correo disponible';
                    emailInput.parentNode.appendChild(msg);
                }
            }

        } catch (error) {
            console.error('Error verificando correo entrenador:', error);
            emailInput.classList.remove('is-valid', 'is-invalid');
            this.emailAvailable.trainer = false;
        } finally {
            this.mostrarCargandoEmail(emailInput, false);
        }
    }

    // Mostrar/ocultar indicador de carga en email
    mostrarCargandoEmail(inputElement, mostrar) {
        let spinner = inputElement.parentNode.querySelector('.email-spinner');

        if (mostrar) {
            if (!spinner) {
                spinner = document.createElement('span');
                spinner.className = 'email-spinner position-absolute';
                spinner.style.right = '10px';
                spinner.style.top = '38px';
                spinner.innerHTML = '<div class="spinner-border spinner-border-sm text-primary" role="status"><span class="visually-hidden">Verificando...</span></div>';
                inputElement.parentNode.style.position = 'relative';
                inputElement.parentNode.appendChild(spinner);
            }
        } else {
            if (spinner) {
                spinner.remove();
            }
        }
    }

    // Limpiar estado de validación de email
    limpiarEstadoEmail(tipo) {
        const inputId = tipo === 'client' ? 'clientEmail' : 'trainerEmail';
        const emailInput = document.getElementById(inputId);

        if (emailInput) {
            emailInput.classList.remove('is-valid', 'is-invalid');

            // Limpiar mensajes adicionales
            const successMsg = emailInput.parentNode.querySelector('.email-success-msg');
            const loginLink = emailInput.parentNode.querySelector('.email-login-link');

            if (successMsg) successMsg.remove();
            if (loginLink) loginLink.remove();
        }
    }

    // Abrir modal de login
    abrirLogin() {
        // Cerrar modales de registro
        const registerClientModal = bootstrap.Modal.getInstance(document.getElementById('registerClientModal'));
        const registerTrainerModal = bootstrap.Modal.getInstance(document.getElementById('registerTrainerModal'));

        if (registerClientModal) registerClientModal.hide();
        if (registerTrainerModal) registerTrainerModal.hide();

        // Abrir modal de login
        setTimeout(() => {
            const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
            loginModal.show();
        }, 300);
    }

    // ==================== VERIFICACIÓN DE CÓDIGO ====================
    
    // Enviar código al correo
    async enviarCodigoVerificacion(correo) {
        try {
            let result = null;
            try {
                result = await ApiClient.get(`/CodigoVerificacion/crear/${correo}`);
            } catch (err) {
                console.warn("Respuesta vacía del servidor (esto es normal para /crear):", err);
            }
        
            console.log("Respuesta de verificación:", result);
        
            // Mostrar modal
            document.getElementById("verifyEmailDisplay").textContent = correo;
            
            // Limpiar el input antes de mostrar
            const codeInput = document.getElementById("verificationCodeInput");
            if (codeInput) {
                codeInput.value = "";
                codeInput.classList.remove("is-invalid", "is-valid");
            }
            
            const modal = new bootstrap.Modal(document.getElementById("verifyCodeModal"));
            modal.show();
            
            // Iniciar countdown para reenvío
            this.iniciarCountdownReenvio();
        
            UIHelpers.showToast("Se ha enviado un código de verificación a tu correo.", "info");
            return true;
        
        } catch (error) {
            console.error("Error enviando código:", error);
            UIHelpers.showToast("No se pudo enviar el código de verificación.", "danger");
            return false;
        }
    }

    // Verificar código ingresado
    async verificarCodigoCorreo(correo, codigo) {
        try {
            // Mostrar spinner de verificación
            const spinner = document.getElementById("verifySpinner");
            const btn = document.getElementById("verifyCodeBtn");
            
            if (spinner) spinner.classList.remove("d-none");
            if (btn) btn.disabled = true;

            // Llamada al endpoint de verificación
            const result = await ApiClient.get(`/CodigoVerificacion/verificar/${correo}/${codigo}`);

            const esValido = result === true || result === "true";
            
            // Ocultar spinner
            if (spinner) spinner.classList.add("d-none");
            if (btn) btn.disabled = false;

            return esValido;
        } catch (error) {
            console.error("Error verificando código:", error);
            
            // Ocultar spinner
            const spinner = document.getElementById("verifySpinner");
            const btn = document.getElementById("verifyCodeBtn");
            if (spinner) spinner.classList.add("d-none");
            if (btn) btn.disabled = false;
            
            return false;
        }
    }

    // ==================== MANEJO DE LOGIN ====================
    
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

    // ==================== REGISTRO DE CLIENTE ====================
    
    async handleClientRegister(e) {
        e.preventDefault();

        const registerBtn = e.target.querySelector('button[type="submit"]');

        try {
            UIHelpers.showButtonSpinner(registerBtn, true);

            // Validar formulario
            if (!Validator.validateForm(e.target)) {
                return;
            }

            // Validar disponibilidad del correo
            if (!this.emailAvailable.client) {
                UIHelpers.showToast('Por favor usa un correo electrónico diferente', 'warning');
                return;
            }

            const contrasenia = document.getElementById('clientPassword').value;
            const confirmPassword = document.getElementById('clientConfirmPassword').value;

            if (!Validator.passwordsMatch(contrasenia, confirmPassword)) {
                UIHelpers.showToast('Las contraseñas no coinciden', 'danger');
                return;
            }

            const formData = {
                idCliente: null,
                nombres: document.getElementById('clientFirstName').value.trim(),
                apellidos: document.getElementById('clientLastName').value.trim(),
                correo: document.getElementById('clientEmail').value.trim(),
                contrasenia: contrasenia,
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

            // Paso 1: Enviar código de verificación
            const enviado = await this.enviarCodigoVerificacion(formData.correo);
            if (!enviado) return;

            // Paso 2: Configurar el evento del botón de verificar
            // Remover eventos anteriores para evitar duplicados
            const verifyBtn = document.getElementById("verifyCodeBtn");
            const newVerifyBtn = verifyBtn.cloneNode(true);
            verifyBtn.parentNode.replaceChild(newVerifyBtn, verifyBtn);
            
            newVerifyBtn.onclick = async () => {
                const codigo = document.getElementById("verificationCodeInput").value.trim();
                const codeInput = document.getElementById("verificationCodeInput");
                
                if (!codigo || codigo.length !== 6) {
                    codeInput.classList.add("is-invalid");
                    UIHelpers.showToast("Por favor ingresa un código válido de 6 dígitos.", "warning");
                    return;
                }

                // Paso 3: Verificar código con backend
                const verificado = await this.verificarCodigoCorreo(formData.correo, codigo);
                
                if (!verificado) {
                    codeInput.classList.add("is-invalid");
                    UIHelpers.showToast("Código incorrecto. Intenta nuevamente.", "danger");
                    return;
                }

                // Paso 4: Crear cliente si el código es correcto
                try {
                    const response = await ApiClient.post('/Cliente/crear', formData);
                    
                    if (response) {
                        // Cerrar modal de verificación
                        this.cerrarModalVerificacion();

                        // Cerrar modal de registro
                        const modal = bootstrap.Modal.getInstance(document.getElementById('registerClientModal'));
                        if (modal) modal.hide();

                        document.getElementById('registerClientForm').reset();
                        this.limpiarEstadoEmail('client');

                        UIHelpers.showToast('¡Correo verificado y registro exitoso!', 'success');

                        // Abrir login después del registro
                        setTimeout(() => {
                            const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                            loginModal.show();
                        }, 600);
                    } else {
                        UIHelpers.showToast('Error al crear el usuario.', 'danger');
                    }
                } catch (error) {
                    console.error("Error creando cliente:", error);
                    UIHelpers.showToast('Error al crear el usuario.', 'danger');
                }
            };

        } catch (error) {
            console.error('Register error:', error);
            UIHelpers.showToast(error.message || 'Error al registrarse', 'danger');
        } finally {
            UIHelpers.showButtonSpinner(registerBtn, false);
        }
    }

    // ==================== REGISTRO DE ENTRENADOR ====================
    
    async handleTrainerRegister(e) {
        e.preventDefault();

        const registerBtn = e.target.querySelector('button[type="submit"]');

        try {
            UIHelpers.showButtonSpinner(registerBtn, true);

            // Validar formulario
            if (!Validator.validateForm(e.target)) {
                return;
            }

            // Validar disponibilidad del correo
            if (!this.emailAvailable.trainer) {
                UIHelpers.showToast('Por favor usa un correo electrónico diferente', 'warning');
                return;
            }

            const password = document.getElementById('trainerPassword').value;
            const confirmPassword = document.getElementById('trainerConfirmPassword').value;

            if (password !== confirmPassword) {
                UIHelpers.showToast('Las contraseñas no coinciden', 'danger');
                return;
            }

            const formData = {
                idEntrenador: null,
                nombres: document.getElementById('trainerFirstName').value.trim(),
                apellidos: document.getElementById('trainerLastName').value.trim(),
                correo: document.getElementById('trainerEmail').value.trim(),
                contrasenia: password,
                especialidad: [document.getElementById('trainerSpecialty').value.trim()],
                certificaciones: [],
                fotoPerfil: null,
                fechaRegistro: null,
                resenias: [],
                sesiones: [],
                servicios: []
            };

            // Paso 1: Enviar código de verificación
            const enviado = await this.enviarCodigoVerificacion(formData.correo);
            if (!enviado) return;

            // Paso 2: Configurar el evento del botón de verificar
            // Remover eventos anteriores para evitar duplicados
            const verifyBtn = document.getElementById("verifyCodeBtn");
            const newVerifyBtn = verifyBtn.cloneNode(true);
            verifyBtn.parentNode.replaceChild(newVerifyBtn, verifyBtn);
            
            newVerifyBtn.onclick = async () => {
                const codigo = document.getElementById("verificationCodeInput").value.trim();
                const codeInput = document.getElementById("verificationCodeInput");
                
                if (!codigo || codigo.length !== 6) {
                    codeInput.classList.add("is-invalid");
                    UIHelpers.showToast("Por favor ingresa un código válido de 6 dígitos.", "warning");
                    return;
                }

                // Paso 3: Verificar código
                const verificado = await this.verificarCodigoCorreo(formData.correo, codigo);
                
                if (!verificado) {
                    codeInput.classList.add("is-invalid");
                    UIHelpers.showToast("Código incorrecto. Intenta nuevamente.", "danger");
                    return;
                }

                // Paso 4: Crear entrenador si el código es correcto
                try {
                    const response = await ApiClient.post('/Entrenador/crear', formData);
                    
                    if (response) {
                        // Cerrar modal de verificación
                        this.cerrarModalVerificacion();

                        // Cerrar modal de registro
                        const modal = bootstrap.Modal.getInstance(document.getElementById('registerTrainerModal'));
                        if (modal) modal.hide();

                        document.getElementById('registerTrainerForm').reset();
                        this.limpiarEstadoEmail('trainer');

                        UIHelpers.showToast('¡Correo verificado y registro exitoso!', 'success');
                    } else {
                        UIHelpers.showToast('Error al crear el entrenador.', 'danger');
                    }
                } catch (error) {
                    console.error("Error creando entrenador:", error);
                    UIHelpers.showToast('Error al crear el entrenador.', 'danger');
                }
            };

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

    // Mapear resultados del API al formato de visualización
    mapApiResultsToDisplayFormat(apiResults) {
        if (!Array.isArray(apiResults)) {
            console.error('Los resultados no son un array:', apiResults);
            return [];
        }

        return apiResults.map(servicio => ({
            id: servicio.idServicio,
            title: servicio.nombre,
            type: 'Entrenador',
            name: servicio.entrenador ? `${servicio.entrenador.nombres} ${servicio.entrenador.apellidos}` : 'Entrenador',
            location: servicio.ubicacion,
            price: servicio.precio,
            rating: 4.5,
            reviews: 0,
            image: this.getDefaultImageByDeporte(servicio.deporte),
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

    // Obtener imagen por defecto según el deporte
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

    // Truncar texto
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
                fechaHora: null,
                estado: "Pendiente",
                cliente: {
                    idCliente: user.idCliente
                },
                entrenador: {
                    idEntrenador: servicio.entrenadorId
                },
                servicio: {
                    idServicio: servicioId,
                    cuposDisponibles: servicio.cuposDisponibles - 1
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

    // Obtener próxima fecha disponible (formato LocalDateTime para Java)
    obtenerProximaFechaDisponible() {
        const ahora = new Date();
        const proximaFecha = new Date(ahora.getTime() + (24 * 60 * 60 * 1000));

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
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.indexPageManager = new IndexPageManager();
});