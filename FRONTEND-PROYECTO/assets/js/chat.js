/* assets/js/chat.js - Versión actualizada con localStorage */

class ChatPageManager {
    constructor() {
        this.sessionId = null;
        this.currentUser = null;
        this.sessionData = null;
        this.messages = [];
        this.isConnected = true;
        this.isTyping = false;
        this.typingTimeout = null;

        this.init();
    }

    init() {
        // Verificar autenticación
        if (!AuthManager.requireAuth()) {
            return;
        }

        this.currentUser = AuthManager.getUser();
        this.getSessionIdFromURL();
        this.initializeEventListeners();
        this.loadSessionData();
        this.loadChatHistory();
    }

    // ==================== INICIALIZACIÓN ====================
    getSessionIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        this.sessionId = urlParams.get('session');

        if (!this.sessionId) {
            UIHelpers.showToast('ID de sesión no válido', 'danger');
            setTimeout(() => {
                window.location.href = 'sesiones.html';
            }, 2000);
        }
    }

    initializeEventListeners() {
        // Input de mensaje
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');

        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            messageInput.addEventListener('input', () => {
                this.updateCharacterCount();
                this.handleTypingIndicator();
            });
        }

        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        // Otros listeners
        document.getElementById('attachmentBtn')?.addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('attachmentModal'));
            modal.show();
        });

        document.getElementById('emojiBtn')?.addEventListener('click', () => {
            this.showEmojiPicker();
        });

        document.getElementById('fileInput')?.addEventListener('change', (e) => {
            this.handleFileSelection(e);
        });

        document.getElementById('sendFileBtn')?.addEventListener('click', () => {
            this.sendFile();
        });

        document.getElementById('viewSessionDetailsBtn')?.addEventListener('click', () => {
            window.location.href = `sesiones.html#session-${this.sessionId}`;
        });
    }

    // ==================== CARGA DE DATOS ====================
    async loadSessionData() {
        try {
            // Obtener datos de la sesión desde la API
            let sessionData = await ApiClient.get(`/Sesion/obtener/${this.sessionId}`);

            // Si no viene de la API, usar simulación
            if (!sessionData) {
                sessionData = await this.simulateGetSessionData();
            }

            this.sessionData = sessionData;

            // Inicializar chat en localStorage
            chatStorage.initializeChat(this.sessionId, sessionData);

            this.updateHeader();
            this.showSessionBanner();

        } catch (error) {
            console.error('Error loading session data:', error);
            UIHelpers.showToast('Error al cargar datos de la sesión', 'danger');
        }
    }

    async loadChatHistory() {
        try {
            // Recuperar mensajes del localStorage
            this.messages = chatStorage.getMessages(this.sessionId);

            // Marcar todos como leídos
            chatStorage.markAllMessagesAsRead(this.sessionId);

            this.renderMessages();

        } catch (error) {
            console.error('Error loading chat history:', error);
            this.showErrorInChat('Error al cargar el historial de conversación');
        }
    }

    updateHeader() {
        if (!this.sessionData) return;

        const entrenador = this.sessionData.entrenador;

        document.getElementById('chatTitle').textContent =
            this.sessionData.servicio?.nombre || 'Sesión de Entrenamiento';

        document.getElementById('chatSubtitle').textContent =
            `${new Date(this.sessionData.fechaHora).toLocaleDateString('es-CO')} - ${new Date(this.sessionData.fechaHora).toLocaleTimeString('es-CO')}`;

        if (entrenador) {
            document.getElementById('trainerAvatar').src = entrenador.fotoPerfil || 'https://randomuser.me/api/portraits/men/32.jpg';
            document.getElementById('trainerName').textContent = `${entrenador.nombres} ${entrenador.apellidos}`;
        }

        this.updateTrainerStatus('online');
    }

    updateTrainerStatus(status) {
        const statusElement = document.getElementById('trainerStatus');
        if (statusElement) {
            if (status === 'online') {
                statusElement.innerHTML = '<i class="bi bi-circle-fill"></i> En línea';
                statusElement.querySelector('i').style.color = '#00ff88';
            } else {
                statusElement.innerHTML = '<i class="bi bi-circle"></i> Desconectado';
                statusElement.querySelector('i').style.color = '#6c757d';
            }
        }
    }

    showSessionBanner() {
        if (!this.sessionData) return;

        const banner = document.createElement('div');
        banner.className = 'session-info-banner';
        banner.onclick = () => this.showSessionInfoModal();

        banner.innerHTML = `
            <div class="session-info-content">
                <div class="session-details">
                    <h6><i class="bi bi-calendar-event me-2"></i>${this.sessionData.servicio?.nombre || 'Sesión'}</h6>
                    <p><i class="bi bi-calendar-event me-2"></i>${new Date(this.sessionData.fechaHora).toLocaleDateString('es-CO')}</p>
                    <p><i class="bi bi-geo-alt me-2"></i>${this.sessionData.servicio?.ubicacion || 'Ubicación no especificada'}</p>
                </div>
                <i class="bi bi-info-circle session-icon-large"></i>
            </div>
        `;

        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer.firstChild) {
            messagesContainer.insertBefore(banner, messagesContainer.firstChild);
        }
    }

    // ==================== MENSAJES ====================
    renderMessages() {
        const container = document.getElementById('chatMessages');
        const existingMessages = container.querySelectorAll('.message:not(.session-info-banner)');

        // Limpiar solo mensajes anteriores
        existingMessages.forEach(msg => msg.remove());

        if (this.messages.length === 0) {
            this.addSystemMessage('¡Hola! Aquí puedes chatear con tu entrenador sobre la sesión.');
        } else {
            this.messages.forEach(message => {
                this.addMessageToDOM(message, false);
            });
        }

        this.scrollToBottom();
    }

    addMessageToDOM(message, animate = true) {
        const container = document.getElementById('chatMessages');
        const messageElement = document.createElement('div');

        const isUser = message.senderId === this.currentUser?.idCliente ||
                      message.senderId === this.currentUser?.idEntrenador;

        messageElement.className = `message ${isUser ? 'user-message' : 'trainer-message'}`;

        if (animate) {
            messageElement.classList.add('message-sent');
        }

        let content = `
            <div class="message-header">
                <span class="message-sender">${message.senderName || (isUser ? 'Tú' : 'Entrenador')}</span>
                <span class="message-time">${this.formatTime(message.timestamp)}</span>
            </div>
        `;

        if (message.type === 'text') {
            content += `<div class="message-text">${this.formatMessageText(message.content)}</div>`;
        } else if (message.type === 'image') {
            content += `
                <div class="message-text">${message.caption || ''}</div>
                <img src="${message.content}" alt="Imagen" class="message-image">
            `;
        } else if (message.type === 'file') {
            content += `
                <div class="message-file">
                    <i class="bi bi-file-earmark"></i>
                    <div class="file-info">
                        <div class="file-name">${message.fileName}</div>
                        <div class="file-size">${message.fileSize}</div>
                    </div>
                </div>
            `;
        }

        messageElement.innerHTML = content;
        container.appendChild(messageElement);

        if (animate) {
            setTimeout(() => {
                messageElement.classList.remove('message-sent');
            }, 300);
        }

        this.scrollToBottom();
    }

    addSystemMessage(text) {
        const container = document.getElementById('chatMessages');
        const messageElement = document.createElement('div');
        messageElement.className = 'message system-message';
        messageElement.innerHTML = `<div class="message-text">${text}</div>`;
        container.appendChild(messageElement);
    }

    formatMessageText(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        text = text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener">$1</a>');
        text = text.replace(/\n/g, '<br>');
        return text;
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const messageText = input.value.trim();

        if (!messageText) return;

        if (messageText.length > 500) {
            UIHelpers.showToast('El mensaje es demasiado largo (máximo 500 caracteres)', 'warning');
            return;
        }

        try {
            const message = {
                id: Date.now().toString(),
                sessionId: this.sessionId,
                senderId: this.currentUser.idCliente || this.currentUser.idEntrenador,
                senderType: this.currentUser.tipoUsuario,
                senderName: `${this.currentUser.nombres} ${this.currentUser.apellidos || ''}`,
                type: 'text',
                content: messageText,
                timestamp: new Date().toISOString()
            };

            // Guardar en localStorage
            chatStorage.addMessage(this.sessionId, message);

            // Agregar a la UI
            this.messages.push(message);
            this.addMessageToDOM(message, true);

            // Limpiar input
            input.value = '';
            this.updateCharacterCount();

            // Simular respuesta del entrenador
            this.simulateTrainerResponse();

        } catch (error) {
            console.error('Error sending message:', error);
            UIHelpers.showToast('Error al enviar el mensaje', 'danger');
        }
    }

    async sendFile() {
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];

        if (!file) return;

        try {
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                UIHelpers.showToast('El archivo es demasiado grande (máximo 10MB)', 'warning');
                return;
            }

            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                UIHelpers.showToast('Tipo de archivo no permitido', 'warning');
                return;
            }

            const sendBtn = document.getElementById('sendFileBtn');
            UIHelpers.showButtonSpinner(sendBtn, true);

            // Leer archivo como Data URL
            const reader = new FileReader();
            reader.onload = (e) => {
                const message = {
                    id: Date.now().toString(),
                    sessionId: this.sessionId,
                    senderId: this.currentUser.idCliente || this.currentUser.idEntrenador,
                    senderType: this.currentUser.tipoUsuario,
                    senderName: `${this.currentUser.nombres} ${this.currentUser.apellidos || ''}`,
                    type: file.type.startsWith('image/') ? 'image' : 'file',
                    content: e.target.result, // Data URL
                    fileName: file.name,
                    fileSize: this.formatFileSize(file.size),
                    timestamp: new Date().toISOString()
                };

                // Guardar en localStorage
                chatStorage.addMessage(this.sessionId, message);

                this.messages.push(message);
                this.addMessageToDOM(message, true);

                const modal = bootstrap.Modal.getInstance(document.getElementById('attachmentModal'));
                if (modal) modal.hide();

                this.clearFilePreview();
                UIHelpers.showButtonSpinner(sendBtn, false);
            };

            reader.readAsDataURL(file);

        } catch (error) {
            console.error('Error sending file:', error);
            UIHelpers.showToast('Error al enviar el archivo', 'danger');
        }
    }

    // ==================== FUNCIONES AUXILIARES ====================
    updateCharacterCount() {
        const input = document.getElementById('messageInput');
        const counter = document.getElementById('charCount');
        const currentLength = input.value.length;

        counter.textContent = currentLength;

        if (currentLength > 450) {
            counter.style.color = '#dc3545';
        } else if (currentLength > 400) {
            counter.style.color = '#ffc107';
        } else {
            counter.style.color = '#6c757d';
        }
    }

    handleTypingIndicator() {
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }

        if (!this.isTyping) {
            this.isTyping = true;
        }

        this.typingTimeout = setTimeout(() => {
            this.isTyping = false;
        }, 3000);
    }

    scrollToBottom() {
        const container = document.getElementById('chatMessages');
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 100);
    }

    handleFileSelection(e) {
        const file = e.target.files[0];
        if (!file) return;

        const preview = document.getElementById('filePreview');
        const imagePreview = document.getElementById('imagePreview');
        const sendBtn = document.getElementById('sendFileBtn');

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                preview.classList.remove('d-none');
                sendBtn.disabled = false;
            };
            reader.readAsDataURL(file);
        } else {
            preview.classList.remove('d-none');
            imagePreview.style.display = 'none';
            sendBtn.disabled = false;
        }
    }

    clearFilePreview() {
        document.getElementById('fileInput').value = '';
        document.getElementById('filePreview').classList.add('d-none');
        document.getElementById('imagePreview').style.display = 'block';
        document.getElementById('sendFileBtn').disabled = true;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showEmojiPicker() {
        const emojis = ['👍', '👎', '❤️', '😊', '😢', '😂', '🔥', '💪', '🏃‍♂️', '⚽'];
        const input = document.getElementById('messageInput');

        const picker = document.createElement('div');
        picker.className = 'emoji-picker';
        picker.style.cssText = `
            position: absolute;
            bottom: 70px;
            right: 20px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 10px;
            padding: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 5px;
        `;

        emojis.forEach(emoji => {
            const btn = document.createElement('button');
            btn.textContent = emoji;
            btn.style.cssText = `border: none; background: none; font-size: 1.5rem; cursor: pointer;`;
            btn.onclick = () => {
                input.value += emoji;
                picker.remove();
                input.focus();
            };
            picker.appendChild(btn);
        });

        document.querySelector('.emoji-picker')?.remove();
        document.body.appendChild(picker);

        setTimeout(() => {
            document.addEventListener('click', function removePicker(e) {
                if (!picker.contains(e.target)) {
                    picker.remove();
                    document.removeEventListener('click', removePicker);
                }
            });
        }, 100);
    }

    showSessionInfoModal() {
        if (!this.sessionData) return;

        const modalBody = document.getElementById('sessionInfoBody');
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Deporte</h6>
                    <p>${this.sessionData.servicio?.deporte || 'N/A'}</p>
                </div>
                <div class="col-md-6">
                    <h6>Fecha y Hora</h6>
                    <p>${new Date(this.sessionData.fechaHora).toLocaleDateString('es-CO')} - ${new Date(this.sessionData.fechaHora).toLocaleTimeString('es-CO')}</p>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <h6>Duración</h6>
                    <p>${this.sessionData.servicio?.duracion || 'N/A'} minutos</p>
                </div>
                <div class="col-md-6">
                    <h6>Precio</h6>
                    <p>${UIHelpers.formatPrice(this.sessionData.servicio?.precio || 0)}</p>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <h6>Ubicación</h6>
                    <p>${this.sessionData.servicio?.ubicacion || 'N/A'}</p>
                </div>
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('sessionInfoModal'));
        modal.show();
    }

    showErrorInChat(message) {
        const container = document.getElementById('chatMessages');
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="bi bi-exclamation-triangle text-danger" style="font-size: 2rem;"></i>
                <h5 class="mt-2">Error</h5>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="bi bi-arrow-clockwise me-2"></i>Reintentar
                </button>
            </div>
        `;
    }

    simulateTrainerResponse() {
        setTimeout(() => {
            const responses = [
                "¡Perfecto! Nos vemos en la sesión.",
                "Gracias por confirmar.",
                "¡Excelente! Estoy preparado.",
                "De acuerdo, nos vemos pronto.",
                "¡Vamos a dar lo mejor!"
            ];

            const randomResponse = responses[Math.floor(Math.random() * responses.length)];

            const message = {
                id: Date.now().toString(),
                sessionId: this.sessionId,
                senderId: this.sessionData.entrenador?.idEntrenador,
                senderType: 'entrenador',
                senderName: `${this.sessionData.entrenador?.nombres} ${this.sessionData.entrenador?.apellidos}`,
                type: 'text',
                content: randomResponse,
                timestamp: new Date().toISOString()
            };

            chatStorage.addMessage(this.sessionId, message);
            this.messages.push(message);
            this.addMessageToDOM(message, true);
        }, 2000);
    }

    async simulateGetSessionData() {
        await new Promise(resolve => setTimeout(resolve, 800));

        return {
            idSesion: this.sessionId,
            servicio: {
                nombre: 'Entrenamiento de Fútbol',
                deporte: 'Fútbol',
                duracion: 90,
                precio: 50000,
                ubicacion: 'Estadio La Campiña - Teusaquillo',
                descripcion: 'Entrenamiento técnico y táctico'
            },
            entrenador: {
                idEntrenador: 'ent123',
                nombres: 'Andrés',
                apellidos: 'Ramírez',
                correo: 'andres@example.com',
                fotoPerfil: 'https://randomuser.me/api/portraits/men/32.jpg'
            },
            cliente: {
                idCliente: this.currentUser.idCliente,
                nombres: this.currentUser.nombres,
                apellidos: this.currentUser.apellidos
            },
            fechaHora: new Date(Date.now() + 86400000).toISOString()
        };
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.chatPageManager = new ChatPageManager();
});

// Limpiar al salir de la página
window.addEventListener('beforeunload', function() {
    if (window.chatPageManager) {
        // Los datos ya están guardados en localStorage
    }
});
