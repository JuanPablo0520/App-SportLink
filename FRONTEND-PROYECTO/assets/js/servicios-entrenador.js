/* assets/js/servicios-entrenador.js - Lógica para gestión de servicios */

class ServiciosEntrenadorManager {
    constructor() {
        this.currentTrainer = null;
        this.servicios = [];
        this.serviciosFiltrados = [];
        this.servicioModal = null;
        this.editandoServicio = null;
        
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
        this.loadServicios();
        
        // Verificar si debe abrir modal de creación
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('action') === 'create') {
            setTimeout(() => this.abrirModalCrear(), 500);
        }
    }

    // ==================== EVENT LISTENERS ====================
    initializeEventListeners() {
        // Botón crear servicio
        const btnCrear = document.getElementById('btnCrearServicio');
        if (btnCrear) {
            btnCrear.addEventListener('click', () => this.abrirModalCrear());
        }

        // Formulario de servicio
        const servicioForm = document.getElementById('servicioForm');
        if (servicioForm) {
            servicioForm.addEventListener('submit', (e) => this.handleSubmitServicio(e));
        }

        // Filtros
        document.getElementById('searchServicio')?.addEventListener('input', () => this.aplicarFiltros());
        document.getElementById('filterDeporte')?.addEventListener('change', () => this.aplicarFiltros());
        document.getElementById('filterEstado')?.addEventListener('change', () => this.aplicarFiltros());
        
        // Limpiar filtros
        document.getElementById('btnLimpiarFiltros')?.addEventListener('click', () => this.limpiarFiltros());

        // Logout
        document.getElementById('logout-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            AuthManager.logout();
        });

        // Inicializar modal
        const modalElement = document.getElementById('servicioModal');
        if (modalElement) {
            this.servicioModal = new bootstrap.Modal(modalElement);
            
            // Limpiar formulario al cerrar
            modalElement.addEventListener('hidden.bs.modal', () => {
                this.limpiarFormulario();
            });
        }
    }

    // ==================== CARGA DE DATOS ====================
    async loadServicios() {
        const container = document.getElementById('serviciosContainer');
        
        try {
            // TODO: Reemplazar con llamada real al API
            // const servicios = await ApiClient.get(`/Servicio/entrenador/${this.currentTrainer.idEntrenador}`);

            const servicios = await ApiClient.get(`/Servicio/obtener/idEntrenador/${this.currentTrainer.idEntrenador}`);
            
            // Simulación temporal
            //const servicios = await this.simulateGetServicios();
            
            this.servicios = servicios;
            this.serviciosFiltrados = servicios;
            this.renderServicios(servicios);

        } catch (error) {
            console.error('Error loading servicios:', error);
            container.innerHTML = this.getErrorState('Error al cargar los servicios');
        }
    }

    // ==================== FILTROS ====================
    aplicarFiltros() {
        const searchText = document.getElementById('searchServicio')?.value.toLowerCase() || '';
        const deporteFilter = document.getElementById('filterDeporte')?.value || '';
        const estadoFilter = document.getElementById('filterEstado')?.value || '';

        this.serviciosFiltrados = this.servicios.filter(servicio => {
            const matchSearch = servicio.nombre.toLowerCase().includes(searchText) ||
                              servicio.descripcion.toLowerCase().includes(searchText);
            const matchDeporte = !deporteFilter || servicio.deporte === deporteFilter;
            const matchEstado = !estadoFilter || 
                              (estadoFilter === 'activo' && servicio.activo) ||
                              (estadoFilter === 'inactivo' && !servicio.activo);

            return matchSearch && matchDeporte && matchEstado;
        });

        this.renderServicios(this.serviciosFiltrados);
    }

    limpiarFiltros() {
        document.getElementById('searchServicio').value = '';
        document.getElementById('filterDeporte').value = '';
        document.getElementById('filterEstado').value = '';
        this.aplicarFiltros();
    }

    // ==================== RENDERIZADO ====================
    renderServicios(servicios) {
        const container = document.getElementById('serviciosContainer');
        
        if (!servicios || servicios.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="empty-state-servicios">
                        <i class="bi bi-briefcase"></i>
                        <h3>No tienes servicios ${this.servicios.length === 0 ? 'creados' : 'que coincidan con los filtros'}</h3>
                        <p>${this.servicios.length === 0 ? 'Crea tu primer servicio para empezar a recibir clientes' : 'Intenta ajustar los filtros de búsqueda'}</p>
                        ${this.servicios.length === 0 ? '<button class="btn btn-primary btn-lg" onclick="serviciosEntrenadorManager.abrirModalCrear()"><i class="bi bi-plus-circle"></i> Crear Mi Primer Servicio</button>' : ''}
                    </div>
                </div>
            `;
            return;
        }

        let html = '';
        
        servicios.forEach(servicio => {
            html += `
                <div class="col-lg-4 col-md-6">
                    <div class="servicio-card">
                        <div class="servicio-card-header">
                            <span class="servicio-status-badge ${servicio.estado === 'Activo' ? 'Activo' : 'Inactivo'}">
                                ${servicio.estado === 'Activo' ? 'Activo' : 'Inactivo'}
                            </span>
                            <h3 class="servicio-nombre">${servicio.nombre}</h3>
                            <span class="servicio-deporte-tag">${servicio.deporte}</span>
                        </div>
                        
                        <div class="servicio-card-body">
                            <p class="servicio-descripcion">${servicio.descripcion}</p>
                            
                            <div class="servicio-info-grid">
                                <div class="servicio-info-item">
                                    <i class="bi bi-award"></i>
                                    <span><span class="servicio-info-label">Nivel:</span> ${servicio.nivel}</span>
                                </div>
                                <div class="servicio-info-item">
                                    <i class="bi bi-people"></i>
                                    <span><span class="servicio-info-label">Cupos Disponibles:</span> ${servicio.cuposDisponibles}</span>
                                </div>
                                <div class="servicio-info-item">
                                    <i class="bi bi-clock"></i>
                                    <span><span class="servicio-info-label">Duración:</span> ${servicio.duracion} min</span>
                                </div>
                                <div class="servicio-info-item">
                                    <i class="bi bi-geo-alt"></i>
                                    <span><span class="servicio-info-label">Ubicación:</span> ${servicio.ubicacion}</span>
                                </div>
                            </div>
                            
                            <div class="servicio-precio-destacado">
                                ${UIHelpers.formatPrice(servicio.precio)}
                                <small style="font-size: 0.5em; display: block; color: #6c757d;">por sesión</small>
                            </div>
                        </div>
                        
                        <div class="servicio-card-footer">
                            <button class="btn btn-editar" onclick="serviciosEntrenadorManager.editarServicio(${servicio.idServicio})">
                                <i class="bi bi-pencil"></i> Editar
                            </button>
                            <button class="btn btn-toggle-estado" onclick="serviciosEntrenadorManager.toggleEstado(${servicio.idServicio})">
                                <i class="bi bi-${servicio.estado === 'Activo' ? 'eye-slash' : 'eye'}"></i> 
                                ${servicio.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                            </button>
                            <button class="btn btn-eliminar" onclick="serviciosEntrenadorManager.eliminarServicio(${servicio.idServicio})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    // ==================== MODAL SERVICIO ====================
    abrirModalCrear() {
        this.editandoServicio = null;
        this.limpiarFormulario();
        
        document.getElementById('servicioModalTitle').textContent = 'Crear Nuevo Servicio';
        document.getElementById('servicioSubmitText').textContent = 'Crear Servicio';
        
        this.servicioModal.show();
    }

    editarServicio(idServicio) {
        console.log('ID recibido:', idServicio);
        console.log('Servicios disponibles:', this.servicios);
        const servicio = this.servicios.find(s => s.idServicio === idServicio);
        
        if (!servicio) {
            UIHelpers.showToast('Servicio no encontrado', 'danger');
            return;
        }

        this.editandoServicio = servicio;
        
        // Llenar formulario
        document.getElementById('servicioId').value = servicio.idServicio;
        document.getElementById('servicioNombre').value = servicio.nombre;
        document.getElementById('servicioPrecio').value = servicio.precio;
        document.getElementById('servicioDeporte').value = servicio.deporte;
        document.getElementById('servicioNivel').value = servicio.nivel;
        document.getElementById('servicioCupos').value = servicio.cuposDisponibles;
        document.getElementById('servicioDuracion').value = servicio.duracion;
        document.getElementById('servicioUbicacion').value = servicio.ubicacion;
        document.getElementById('servicioDescripcion').value = servicio.descripcion;
        document.getElementById('servicioIncluye').value = servicio.incluye || '';
        document.getElementById('servicioActivo').checked = servicio.estado === "Activo";

        document.getElementById('servicioModalTitle').textContent = 'Editar Servicio';
        document.getElementById('servicioSubmitText').textContent = 'Guardar Cambios';
        
        this.servicioModal.show();
    }

    async handleSubmitServicio(e) {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const spinner = document.getElementById('servicioSpinner');
        
        try {
            // Validar formulario
            if (!Validator.validateForm(e.target)) {
                UIHelpers.showToast('Por favor completa todos los campos requeridos', 'warning');
                return;
            }

            UIHelpers.showButtonSpinner(submitBtn, true);

            const formData = {
                idServicio: document.getElementById('servicioId').value || null,
                nombre: document.getElementById('servicioNombre').value.trim(),
                precio: parseFloat(document.getElementById('servicioPrecio').value),
                deporte: document.getElementById('servicioDeporte').value,
                nivel: document.getElementById('servicioNivel').value,
                cuposDisponibles: document.getElementById('servicioCupos').value,
                duracion: parseInt(document.getElementById('servicioDuracion').value),
                ubicacion: document.getElementById('servicioUbicacion').value.trim(),
                descripcion: document.getElementById('servicioDescripcion').value.trim(),
                incluye: document.getElementById('servicioIncluye').value.trim(),
                estado: document.getElementById('servicioActivo').checked ? "Activo" : "Inactivo",
                entrenador: {
                    idEntrenador: this.currentTrainer.idEntrenador
                }
            };

            // Validaciones adicionales
            if (formData.descripcion.length < 20) {
                UIHelpers.showToast('La descripción debe tener al menos 20 caracteres', 'warning');
                return;
            }

            let response;
            
            if (this.editandoServicio) {
                // TODO: Actualizar servicio existente
                response = await ApiClient.put('/Servicio/actualizar', formData);
                // response = await this.simulateUpdateServicio(formData);
                UIHelpers.showToast('Servicio actualizado exitosamente', 'success');
            } else {
                // TODO: Crear nuevo servicio
                response = await ApiClient.post('/Servicio/crear', formData);
                // response = await this.simulateCreateServicio(formData);
                UIHelpers.showToast('Servicio creado exitosamente', 'success');
            }

            if (response) {
                this.servicioModal.hide();
                await this.loadServicios();
            }

        } catch (error) {
            console.error('Error submitting servicio:', error);
            UIHelpers.showToast(error.message || 'Error al guardar el servicio', 'danger');
        } finally {
            UIHelpers.showButtonSpinner(submitBtn, false);
        }
    }

    //async toggleEstado(idServicio) {
    //    const servicio = this.servicios.find(s => s.idServicio === idServicio);
    //    
    //    if (!servicio) return;
//
    //    const nuevoEstado = !servicio.estado;
    //    const accion = nuevoEstado ? 'activar' : 'desactivar';
//
    //    UIHelpers.showConfirmModal(
    //        `${accion.charAt(0).toUpperCase() + accion.slice(1)} servicio`,
    //        `¿Estás seguro que deseas ${accion} el servicio "${servicio.nombre}"?`,
    //        async () => {
    //            try {
    //                // TODO: Actualizar estado en API
    //                // await ApiClient.put(`/Servicio/${idServicio}/estado`, { activo: nuevoEstado });
    //                
    //                // Simulación
    //                await new Promise(resolve => setTimeout(resolve, 500));
//
    //                UIHelpers.showToast(`Servicio ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`, 'success');
    //                await this.loadServicios();
//
    //            } catch (error) {
    //                console.error('Error toggling estado:', error);
    //                UIHelpers.showToast('Error al cambiar el estado del servicio', 'danger');
    //            }
    //        }
    //    );
    //}

    async toggleEstado(idServicio) {
        const servicio = this.servicios.find(s => s.idServicio === idServicio);

        if (!servicio) return;

        //const nuevoEstado = !servicio.estado;
        const nuevoEstado = servicio.estado === 'Activo' ? 'Inactivo' : 'Activo';
        const accion = nuevoEstado ? 'activar' : 'desactivar';

        UIHelpers.showConfirmModal(
            `${accion.charAt(0).toUpperCase() + accion.slice(1)} servicio`,
            `¿Estás seguro que deseas ${accion} el servicio "${servicio.nombre}"?`,
            async () => {
                try {
                    // Clonamos el servicio y actualizamos solo el campo estado
                    const servicioActualizado = { ...servicio, estado: nuevoEstado };

                    // Usamos el endpoint general de actualización
                    console.log("Servicio", servicio);
                    console.log("Servicioactualizado", servicioActualizado);
                    await ApiClient.put(`/Servicio/actualizar`, servicioActualizado);

                    UIHelpers.showToast(`Servicio ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`, 'success');
                    await this.loadServicios();

                } catch (error) {
                    console.error('Error toggling estado:', error);
                    UIHelpers.showToast('Error al cambiar el estado del servicio', 'danger');
                }
            }
        );
    }




    eliminarServicio(idServicio) {
        const servicio = this.servicios.find(s => s.idServicio === idServicio);
        
        if (!servicio) return;

        UIHelpers.showConfirmModal(
            'Eliminar servicio',
            `¿Estás seguro que deseas eliminar el servicio "${servicio.nombre}"? Esta acción no se puede deshacer.`,
            async () => {
                try {
                    // TODO: Eliminar servicio en API
                    await ApiClient.delete(`/Servicio/eliminar/${idServicio}`);
                    
                    // Simulación
                    //await new Promise(resolve => setTimeout(resolve, 500));

                    UIHelpers.showToast('Servicio eliminado exitosamente', 'success');
                    await this.loadServicios();

                } catch (error) {
                    console.error('Error eliminando servicio:', error);
                    UIHelpers.showToast('Error al eliminar el servicio', 'danger');
                }
            },
            'danger'
        );
    }

    limpiarFormulario() {
        const form = document.getElementById('servicioForm');
        if (form) {
            form.reset();
            form.querySelectorAll('.is-valid, .is-invalid').forEach(el => {
                el.classList.remove('is-valid', 'is-invalid');
            });
        }
        document.getElementById('servicioId').value = '';
        document.getElementById('servicioActivo').checked = true;
        this.editandoServicio = null;
    }

    // ==================== UTILIDADES ====================
    getErrorState(message) {
        return `
            <div class="col-12">
                <div class="empty-state-servicios">
                    <i class="bi bi-exclamation-triangle text-danger"></i>
                    <h3>Error</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="bi bi-arrow-clockwise"></i> Reintentar
                    </button>
                </div>
            </div>
        `;
    }

    // ==================== SIMULACIONES DE API (TEMPORAL) ====================
    async simulateGetServicios() {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return [
            {
                idServicio: 'serv1',
                nombre: 'Entrenamiento Personalizado de Fútbol',
                precio: 80000,
                deporte: 'Fútbol',
                nivel: 'Todos los niveles',
                modalidad: 'Individual',
                duracion: 60,
                ubicacion: 'Parque El Virrey, Chapinero',
                descripcion: 'Mejora tu técnica individual, control de balón, regate y finalización. Entrenamiento adaptado a tu nivel con ejercicios progresivos y seguimiento personalizado de tu evolución.',
                incluye: 'Balones profesionales, conos, material de entrenamiento, plan personalizado',
                activo: true
            },
            {
                idServicio: 'serv2',
                nombre: 'Clases de Natación para Adultos',
                precio: 70000,
                deporte: 'Natación',
                nivel: 'Principiante',
                modalidad: 'Individual o Grupal',
                duracion: 45,
                ubicacion: 'Piscina Compensar Suba',
                descripcion: 'Aprende a nadar desde cero o perfecciona tu técnica. Clases enfocadas en superar el miedo al agua, técnicas de respiración y estilos de natación (crol, espalda, pecho).',
                incluye: 'Entrada a piscina, material flotante, seguimiento individual',
                activo: true
            },
            {
                idServicio: 'serv3',
                nombre: 'CrossFit & Entrenamiento Funcional',
                precio: 60000,
                deporte: 'CrossFit',
                nivel: 'Intermedio',
                modalidad: 'Grupal',
                duracion: 60,
                ubicacion: 'Box CrossFit Norte, Usaquén',
                descripcion: 'Entrenamiento de alta intensidad combinando ejercicios cardiovasculares, levantamiento de pesas y gimnasia. Desarrolla fuerza, resistencia y agilidad en un ambiente motivador.',
                incluye: 'Equipamiento completo del box, programación WOD, seguimiento de marcas',
                activo: true
            },
            {
                idServicio: 'serv4',
                nombre: 'Tenis para Principiantes',
                precio: 90000,
                deporte: 'Tenis',
                nivel: 'Principiante',
                modalidad: 'Individual',
                duracion: 60,
                ubicacion: 'Club Los Lagartos, Teusaquillo',
                descripcion: 'Introducción al tenis con enfoque en técnica de golpes básicos (derecha, revés, servicio), desplazamiento en cancha y táctica de juego. Clases dinámicas y divertidas.',
                incluye: 'Cancha, raquetas de préstamo, pelotas, acceso a instalaciones',
                activo: false
            }
        ];
    }

    async simulateCreateServicio(data) {
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        return {
            success: true,
            idServicio: 'serv' + Date.now(),
            ...data
        };
    }

    async simulateUpdateServicio(data) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
            success: true,
            ...data
        };
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.serviciosEntrenadorManager = new ServiciosEntrenadorManager();
});