/* assets/js/utils.js - Funciones comunes para toda la aplicación */

// Configuración general
const CONFIG = {
    API_BASE_URL: 'http://localhost:8862/sportLink', // URL del backend en producción
    TOKEN_KEY: 'sportlink_token',
    USER_KEY: 'sportlink_user',
    DEBOUNCE_DELAY: 300
};

// ==================== MANEJO DE SESIÓN ====================
const AuthManager = {
    // Guardar token y datos de usuario
    login(token, userData) {
        try {
            localStorage.setItem(CONFIG.TOKEN_KEY, token);
            localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(userData));
            return true;
        } catch (error) {
            console.error('Error guardando datos de sesión:', error);
            return false;
        }
    },

    // Obtener token
    getToken() {
        return localStorage.getItem(CONFIG.TOKEN_KEY);
    },

    // Obtener datos de usuario
    getUser() {
        try {
            const userData = localStorage.getItem(CONFIG.USER_KEY);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error obteniendo datos de usuario:', error);
            return null;
        }
    },

    // Verificar si el usuario está autenticado
    isAuthenticated() {
        return !!this.getToken();
    },

    // Cerrar sesión
    logout() {
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        localStorage.removeItem(CONFIG.USER_KEY);
        this.updateUIAuthentication();
    },

    // Actualizar UI según estado de autenticación
    updateUIAuthentication() {
        const authButtons = document.getElementById('auth-buttons');
        const userMenu = document.getElementById('user-menu');
        
        if (this.isAuthenticated()) {
            authButtons?.classList.add('d-none');
            userMenu?.classList.remove('d-none');
            userMenu?.classList.add('d-flex');
            
            // Actualizar nombre de usuario si está disponible
            const user = this.getUser();
            if (user && user.name) {
                const userNameElement = document.querySelector('#userDropdown');
                if (userNameElement) {
                    userNameElement.innerHTML = `<i class="bi bi-person-circle me-1"></i> ${user.name}`;
                }
            }
        } else {
            authButtons?.classList.remove('d-none');
            userMenu?.classList.remove('d-flex');
            userMenu?.classList.add('d-none');
        }
    },

    // Verificar si se debe redirigir al login
    requireAuth(redirectToLogin = true) {
        if (!this.isAuthenticated()) {
            if (redirectToLogin) {
                window.location.href = 'index.html';
            }
            return false;
        }
        return true;
    }
};

// ==================== PETICIONES HTTP ====================
const ApiClient = {
    // Configurar headers comunes
    getHeaders(includeAuth = false) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (includeAuth) {
            const token = AuthManager.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    },

    // GET request
    async get(endpoint, includeAuth = false) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
                method: 'GET',
                headers: this.getHeaders(includeAuth)
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`GET ${endpoint} error:`, error);
            throw error;
        }
    },

    // POST request
    async post(endpoint, data = {}, includeAuth = false) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(includeAuth),
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.log(`POST ${endpoint} error:`, error);
            throw error;
        }
    },

    // PUT request
    async put(endpoint, data = {}, includeAuth = false) {
        dataToSend = JSON.stringify(data)
        console.log("data enviada", dataToSend)
        
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
                method: 'PUT',
                headers: this.getHeaders(includeAuth),
                body: dataToSend
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`PUT ${endpoint} error:`, error);
            throw error;
        }
    },

    // DELETE request
    async delete(endpoint, includeAuth = false) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
                method: 'DELETE',
                headers: this.getHeaders(includeAuth)
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`DELETE ${endpoint} error:`, error);
            throw error;
        }
    }
};

// ==================== VALIDACIONES ====================
const Validator = {
    // Validar email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Validar teléfono colombiano
    isValidPhone(phone) {
        const phoneRegex = /^[3][0-9]{9}$/;
        return phoneRegex.test(phone.replace(/\s+/g, ''));
    },

    // Validar contraseña (mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número)
    isValidPassword(password) {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    },

    // Validar que las contraseñas coincidan
    passwordsMatch(password, confirmPassword) {
        return password === confirmPassword;
    },

    // Validar formulario completo
    validateForm(formElement) {
        let isValid = true;
        const inputs = formElement.querySelectorAll('input[required], select[required]');

        inputs.forEach(input => {
            if (!this.validateInput(input)) {
                isValid = false;
            }
        });

        return isValid;
    },

    // Validar input individual
    validateInput(input) {
        const value = input.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Validar campo requerido
        if (input.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'Este campo es requerido.';
        }
        // Validar email
        else if (input.type === 'email' && value && !this.isValidEmail(value)) {
            isValid = false;
            errorMessage = 'Por favor ingresa un email válido.';
        }
        // Validar teléfono
        else if (input.type === 'tel' && value && !this.isValidPhone(value)) {
            isValid = false;
            errorMessage = 'Por favor ingresa un teléfono válido (10 dígitos).';
        }
        // Validar contraseña
        else if (input.type === 'password' && input.id.includes('Password') && value && !this.isValidPassword(value)) {
            isValid = false;
            errorMessage = 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.';
        }
        // Validar confirmación de contraseña
        else if (input.id.includes('ConfirmPassword') && value) {
            const passwordInput = input.form.querySelector('input[type="password"]:not([id*="Confirm"])');
            if (passwordInput && !this.passwordsMatch(passwordInput.value, value)) {
                isValid = false;
                errorMessage = 'Las contraseñas no coinciden.';
            }
        }

        this.showValidationState(input, isValid, errorMessage);
        return isValid;
    },

    // Mostrar estado de validación en el input
    showValidationState(input, isValid, errorMessage = '') {
        input.classList.remove('is-valid', 'is-invalid');
        
        const feedbackElement = input.parentNode.querySelector('.invalid-feedback');
        
        if (isValid) {
            input.classList.add('is-valid');
            if (feedbackElement) {
                feedbackElement.textContent = '';
            }
        } else {
            input.classList.add('is-invalid');
            if (feedbackElement) {
                feedbackElement.textContent = errorMessage;
            }
        }
    }
};

// ==================== UI HELPERS ====================
const UIHelpers = {
    // Mostrar spinner en botón
    showButtonSpinner(buttonElement, show = true) {
        const spinner = buttonElement.querySelector('.spinner-border');
        if (spinner) {
            if (show) {
                spinner.classList.remove('d-none');
                buttonElement.disabled = true;
            } else {
                spinner.classList.add('d-none');
                buttonElement.disabled = false;
            }
        }
    },

    // Mostrar notificación toast
    showToast(message, type = 'info', duration = 3000) {
        // Crear elemento toast si no existe
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '1055';
            document.body.appendChild(toastContainer);
        }

        const toastId = 'toast-' + Date.now();
        const toastHTML = `
            <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: duration });
        toast.show();

        // Remover el toast después de que se oculte
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    },

    // Mostrar modal de confirmación
    showConfirmModal(title, message, onConfirm) {
        const modalId = 'confirm-modal-' + Date.now();
        const modalHTML = `
            <div class="modal fade" id="${modalId}" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${message}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="${modalId}-confirm">Confirmar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modalElement = document.getElementById(modalId);
        const modal = new bootstrap.Modal(modalElement);
        
        // Event listener para confirmar
        document.getElementById(`${modalId}-confirm`).addEventListener('click', () => {
            modal.hide();
            if (typeof onConfirm === 'function') {
                onConfirm();
            }
        });

        // Remover modal del DOM cuando se oculte
        modalElement.addEventListener('hidden.bs.modal', () => {
            modalElement.remove();
        });

        modal.show();
    },

    // Debounce function para optimizar búsquedas
    debounce(func, wait = CONFIG.DEBOUNCE_DELAY) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Formatear precio colombiano
    formatPrice(price) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(price);
    },

    // Formatear fecha
    formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return new Intl.DateTimeFormat('es-CO', { ...defaultOptions, ...options }).format(new Date(date));
    },

    // Scroll suave a elemento
    scrollToElement(elementId, offset = 0) {
        const element = document.getElementById(elementId);
        if (element) {
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }
};

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', function() {
    // Actualizar UI de autenticación
    AuthManager.updateUIAuthentication();

    // Configurar event listener para logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            UIHelpers.showConfirmModal(
                'Cerrar sesión',
                '¿Estás seguro que deseas cerrar sesión?',
                function() {
                    AuthManager.logout();
                    window.location.href = 'index.html';
                }
            );
        });
    }

    // Validación en tiempo real para todos los formularios
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => {
            // Validar en blur (cuando pierde el foco)
            input.addEventListener('blur', () => {
                if (input.value.trim()) {
                    Validator.validateInput(input);
                }
            });

            // Limpiar validación en focus
            input.addEventListener('focus', () => {
                input.classList.remove('is-valid', 'is-invalid');
                const feedbackElement = input.parentNode.querySelector('.invalid-feedback');
                if (feedbackElement) {
                    feedbackElement.textContent = '';
                }
            });
        });
    });

    // Configurar fecha mínima para inputs de tipo date
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const today = new Date().toISOString().split('T')[0];
    dateInputs.forEach(input => {
        input.min = today;
    });
});

// ==================== EXPORTAR FUNCIONES GLOBALES ====================
// Para compatibilidad con scripts que esperen funciones globales
window.AuthManager = AuthManager;
window.ApiClient = ApiClient;
window.Validator = Validator;
window.UIHelpers = UIHelpers;
window.CONFIG = CONFIG;