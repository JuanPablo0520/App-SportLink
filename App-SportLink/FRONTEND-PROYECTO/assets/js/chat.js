/* assets/js/chat.js - Lógica específica para la página de chat */

class ChatPageManager {
    constructor() {
        this.sessionId = null;
        this.currentUser = null;
        this.sessionData = null;
        this.messages = [];
        this.isConnected = true;
        this.isTyping = false;
        this.typingTimeout = null;
        this.messagePollingInterval = null;
        
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
        this.startMessagePolling();
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

            messageInput.addEventListener('paste', (e) => {
                setTimeout(() => this.updateCharacterCount(), 100);
            });
        }

        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        // Botones de acción
        document.getElementById('attachmentBtn')?.addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('attachmentModal'));
            modal.show();
        });

        document.getElementById('emojiBtn')?.addEventListener('click', () => {
            this.showEmojiPicker();
        });

        // Archivo adjunto
        document.getElementById('fileInput')?.addEventListener('change', (e) => {
            this.handleFileSelection(e);
        });

        document.getElementById('sendFileBtn')?.addEventListener('click', () => {
            this.sendFile();
        });

        // Modal de información de sesión
        document.getElementById('viewSessionDetailsBtn')?.addEventListener('click', () => {
            window.location.href = `sesiones.html#session-${this.sessionId}`;
        });

        // Eventos de conexión (simulados)
        this.simulateConnectionEvents();
    }

    // ==================== CARGA DE DATOS ====================
    async loadSessionData() {
        try {
            // TODO: Reemplazar con llamada real al API
            // const sessionData = await ApiClient.get(`/sessions/${this.sessionId}`, true);
            
            // Simulación temporal
            const sessionData = await this.simulateGetSessionData();
            
            this.sessionData = sessionData;
            this.updateHeader();
            this.showSessionBanner();

        } catch (error) {
            console.error('Error loading session data:', error);
            UIHelpers.showToast('Error al cargar datos de la sesión', 'danger');
        }
    }

    async loadChatHistory() {
        try {
            // TODO: Reemplazar con llamada real al API
            // const messages = await ApiClient.get(`/sessions/${this.sessionId}/messages`, true);
            
            // Simulación temporal
            const messages = await this.simulateGetChatHistory();
            
            this.messages = messages;
            this.renderMessages();

        } catch (error) {
            console.error('Error loading chat history:', error);
            this.showErrorInChat('Error al cargar el historial de conversación');
        }
    }

    updateHeader() {
        if (!this.sessionData) return;

        document.getElementById('chatTitle').textContent = this.sessionData.title;
        document.getElementById('chatSubtitle').textContent = `${UIHelpers.formatDate(this.sessionData.date)} - ${this.sessionData.time}`;
        document.getElementById('trainerAvatar').src = this.sessionData.trainerAvatar;
        document.getElementById('trainerName').textContent = this.sessionData.trainerName;
        
        // Simular estado en línea
        const status = Math.random() > 0.3 ? 'online' : 'offline';
        this.updateTrainerStatus(status);
    }

    updateTrainerStatus(status) {
        const statusElement = document.getElementById('trainerStatus');
        const statusIcon = statusElement.querySelector('i');
        
        if (status === 'online') {
            statusElement.innerHTML = '<i class="bi bi-circle-fill"></i> En línea';
            statusIcon.style.color = '#00ff88';
        } else {
            statusElement.innerHTML = '<i class="bi bi-circle"></i> Desconectado';
            statusIcon.style.color = '#6c757d';
        }
    }

    showSessionBanner() {
        if (!this.sessionData) return;

        const banner = document.createElement('div');
        banner.className = 'session-info-banner';
        banner.onclick = () => {
            this.showSessionInfoModal();
        };

        banner.innerHTML = `
            <div class="session-info-content">
                <div class="session-details">
                    <h6><i class="bi ${this.getSportIcon(this.sessionData.sport)} me-2"></i>${this.sessionData.title}</h6>
                    <p><i class="bi bi-calendar-event me-2"></i>${UIHelpers.formatDate(this.sessionData.date)} a las ${this.sessionData.time}</p>
                    <p><i class="bi bi-geo-alt me-2"></i>${this.sessionData.location}</p>
                </div>
                <i class="bi bi-info-circle session-icon-large"></i>
            </div>
        `;

        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.insertBefore(banner, messagesContainer.firstChild);
    }

    // ==================== MENSAJES ====================
    renderMessages() {
        const container = document.getElementById('chatMessages');
        const existingBanner = container.querySelector('.session-info-banner');
        const existingLoading = container.querySelector('.chat-loading');
        
        // Limpiar solo el loading, mantener el banner
        if (existingLoading) {
            existingLoading.remove();
        }

        // Limpiar mensajes anteriores pero mantener el banner
        const existingMessages = container.querySelectorAll('.message');
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
        
        const isUser = message.senderId === this.currentUser?.id;
        messageElement.className = `message ${isUser ? 'user-message' : 'trainer-message'}`;
        
        if (animate) {
            messageElement.classList.add('message-sent');
        }

        let content = `
            <div class="message-header">
                <span class="message-sender">${isUser ? 'Tú' : this.sessionData?.trainerName || 'Entrenador'}</span>
                <span class="message-time">${this.formatTime(message.timestamp)}</span>
            </div>
        `;

        if (message.type === 'text') {
            content += `<div class="message-text">${this.formatMessageText(message.content)}</div>`;
        } else if (message.type === 'image') {
            content += `
                <div class="message-text">${message.caption || ''}</div>
                <img src="${message.content}" alt="Imagen" class="message-image" onclick="chatPageManager.showImageModal('${message.content}')">
            `;
        } else if (message.type === 'file') {
            content += `
                <div class="message-file" onclick="chatPageManager.downloadFile('${message.content}', '${message.fileName}')">
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
        // Convertir URLs en enlaces
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        text = text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener">$1</a>');
        
        // Convertir saltos de línea
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
                senderId: this.currentUser.id,
                type: 'text',
                content: messageText,
                timestamp: new Date().toISOString()
            };

            // Agregar mensaje a la UI inmediatamente
            this.messages.push(message);
            this.addMessageToDOM(message, true);
            
            // Limpiar input
            input.value = '';
            this.updateCharacterCount();

            // TODO: Reemplazar con llamada real al API
            // await ApiClient.post(`/sessions/${this.sessionId}/messages`, message, true);
            
            // Simulación temporal
            await this.simulateSendMessage(message);
            
            // Simular respuesta del entrenador después de un tiempo
            this.simulateTrainerResponse();

        } catch (error) {
            console.error('Error sending message:', error);
            UIHelpers.showToast('Error al enviar el mensaje', 'danger');
            
            // Remover mensaje fallido de la UI
            this.messages.pop();
            const lastMessage = document.querySelector('#chatMessages .message:last-child');
            if (lastMessage) lastMessage.remove();
        }
    }

    async sendFile() {
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];
        
        if (!file) return;

        try {
            // Validar archivo
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                UIHelpers.showToast('El archivo es demasiado grande (máximo 10MB)', 'warning');
                return;
            }

            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword'];
            if (!allowedTypes.includes(file.type)) {
                UIHelpers.showToast('Tipo de archivo no permitido', 'warning');
                return;
            }

            // Mostrar spinner
            const sendBtn = document.getElementById('sendFileBtn');
            UIHelpers.showButtonSpinner(sendBtn, true);

            // TODO: Subir archivo al servidor y obtener URL
            // const uploadResponse = await ApiClient.post('/upload', formData, true);
            
            // Simulación temporal
            const fileUrl = await this.simulateFileUpload(file);

            const message = {
                id: Date.now().toString(),
                sessionId: this.sessionId,
                senderId: this.currentUser.id,
                type: file.type.startsWith('image/') ? 'image' : 'file',
                content: fileUrl,
                fileName: file.name,
                fileSize: this.formatFileSize(file.size),
                timestamp: new Date().toISOString()
            };

            this.messages.push(message);
            this.addMessageToDOM(message, true);

            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('attachmentModal'));
            modal.hide();

            // Limpiar formulario
            this.clearFilePreview();

        } catch (error) {
            console.error('Error sending file:', error);
            UIHelpers.showToast('Error al enviar el archivo', 'danger');
        } finally {
            const sendBtn = document.getElementById('sendFileBtn');
            UIHelpers.showButtonSpinner(sendBtn, false);
        }
    }

    sendQuickMessage(message) {
        const input = document.getElementById('messageInput');
        input.value = message;
        this.sendMessage();
        
        // Cerrar modal de adjuntos si está abierto
        const modal = bootstrap.Modal.getInstance(document.getElementById('attachmentModal'));
        if (modal) modal.hide();
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
            // TODO: Enviar indicador de "escribiendo" al servidor
        }

        this.typingTimeout = setTimeout(() => {
            this.isTyping = false;
            // TODO: Enviar indicador de "dejó de escribir" al servidor
        }, 3000);
    }

    showTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        indicator.classList.remove('d-none');
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        indicator.classList.add('d-none');
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

    getSportIcon(sport) {
        const icons = {
            'Fútbol': 'bi-dribbble',
            'Tenis': 'bi-circle',
            'Natación': 'bi-water',
            'Yoga': 'bi-heart',
            'CrossFit': 'bi-lightning',
            'Boxeo': 'bi-shield'
        };
        return icons[sport] || 'bi-trophy';
    }

    showEmojiPicker() {
        const emojis = ['👍', '👎', '❤️', '😊', '😢', '😂', '🔥', '💪', '🏃‍♂️', '⚽', '🎾', '🏊‍♂️'];
        const input = document.getElementById('messageInput');
        
        // Crear picker simple
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
            grid-template-columns: repeat(6, 1fr);
            gap: 5px;
        `;

        emojis.forEach(emoji => {
            const btn = document.createElement('button');
            btn.textContent = emoji;
            btn.style.cssText = `
                border: none;
                background: none;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 5px;
                border-radius: 5px;
                transition: background 0.2s;
            `;
            btn.onclick = () => {
                input.value += emoji;
                picker.remove();
                input.focus();
            };
            btn.onmouseover = () => btn.style.background = '#f0f0f0';
            btn.onmouseout = () => btn.style.background = 'none';
            picker.appendChild(btn);
        });

        // Remover picker existente
        document.querySelector('.emoji-picker')?.remove();
        
        // Agregar nuevo picker
        document.body.appendChild(picker);

        // Remover al hacer click fuera
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
                    <p><i class="bi ${this.getSportIcon(this.sessionData.sport)} me-2"></i>${this.sessionData.sport}</p>
                </div>
                <div class="col-md-6">
                    <h6>Fecha y Hora</h6>
                    <p><i class="bi bi-calendar-event me-2"></i>${UIHelpers.formatDate(this.sessionData.date)} - ${this.sessionData.time}</p>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <h6>Duración</h6>
                    <p><i class="bi bi-clock me-2"></i>${this.sessionData.duration} minutos</p>
                </div>
                <div class="col-md-6">
                    <h6>Precio</h6>
                    <p><i class="bi bi-cash-coin me-2"></i>${UIHelpers.formatPrice(this.sessionData.price)}</p>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <h6>Ubicación</h6>
                    <p><i class="bi bi-geo-alt me-2"></i>${this.sessionData.location}</p>
                </div>
            </div>
            ${this.sessionData.description ? `
                <div class="alert alert-info">
                    <h6>Descripción</h6>
                    <p class="mb-0">${this.sessionData.description}</p>
                </div>
            ` : ''}
        `;

        const modal = new bootstrap.Modal(document.getElementById('sessionInfoModal'));
        modal.show();
    }

    showImageModal(imageUrl) {
        // TODO: Implementar modal para ver imagen en grande
        window.open(imageUrl, '_blank');
    }

    downloadFile(fileUrl, fileName) {
        // TODO: Implementar descarga de archivo
        window.open(fileUrl, '_blank');
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

    // ==================== SIMULACIONES Y POLLING ====================
    startMessagePolling() {
        // Simular recepción de mensajes cada 5 segundos
        this.messagePollingInterval = setInterval(() => {
            if (Math.random() > 0.7) {
                this.simulateIncomingMessage();
            }
        }, 10000);
    }

    simulateConnectionEvents() {
        // Simular eventos de conexión/desconexión
        setInterval(() => {
            const isConnected = Math.random() > 0.1;
            if (isConnected !== this.isConnected) {
                this.isConnected = isConnected;
                this.showConnectionStatus(isConnected);
            }
        }, 30000);
    }

    showConnectionStatus(isConnected) {
        let statusBar = document.querySelector('.connection-status');
        
        if (!statusBar) {
            statusBar = document.createElement('div');
            statusBar.className = 'connection-status';
            document.body.appendChild(statusBar);
        }

        if (isConnected) {
            statusBar.textContent = '✓ Conectado';
            statusBar.className = 'connection-status connected show';
            setTimeout(() => statusBar.classList.remove('show'), 3000);
        } else {
            statusBar.textContent = '⚠ Conexión perdida - Reintentando...';
            statusBar.className = 'connection-status show';
        }
    }

    simulateTrainerResponse() {
        setTimeout(() => {
            this.showTypingIndicator();
            
            setTimeout(() => {
                this.hideTypingIndicator();
                
                const responses = [
                    "¡Perfecto! Nos vemos en la sesión.",
                    "Gracias por confirmar. ¿Tienes alguna pregunta sobre el entrenamiento?",
                    "Excelente. Recuerda traer ropa cómoda y una botella de agua.",
                    "De acuerdo. Si tienes alguna duda, no dudes en escribirme.",
                    "¡Genial! Estoy seguro de que será una gran sesión."
                ];
                
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                
                const message = {
                    id: Date.now().toString(),
                    sessionId: this.sessionId,
                    senderId: 'trainer',
                    type: 'text',
                    content: randomResponse,
                    timestamp: new Date().toISOString()
                };
                
                this.messages.push(message);
                this.addMessageToDOM(message, true);
            }, 2000);
        }, 1000 + Math.random() * 2000);
    }

    simulateIncomingMessage() {
        const messages = [
            "¿Cómo vas con la preparación para la sesión?",
            "Recuerda hidratarte bien antes del entrenamiento.",
            "¿Tienes alguna lesión o molestia que deba saber?",
            "Nos vemos pronto. ¡Vamos a dar lo mejor!"
        ];
        
        if (Math.random() > 0.8) {
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            
            const message = {
                id: Date.now().toString(),
                sessionId: this.sessionId,
                senderId: 'trainer',
                type: 'text',
                content: randomMessage,
                timestamp: new Date().toISOString()
            };
            
            this.messages.push(message);
            this.addMessageToDOM(message, true);
        }
    }

    // ==================== SIMULACIONES DE API ====================
    async simulateGetSessionData() {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        return {
            id: this.sessionId,
            title: 'Entrenamiento de Fútbol',
            sport: 'Fútbol',
            trainerName: 'Andrés Ramírez',
            trainerAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            time: '2:00 PM',
            duration: 90,
            location: 'Estadio La Campiña - Teusaquillo',
            price: 50000,
            description: 'Entrenamiento técnico y táctico de fútbol. Trabajo individual y en equipo.'
        };
    }

    async simulateGetChatHistory() {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return [
            {
                id: '1',
                sessionId: this.sessionId,
                senderId: this.currentUser?.id,
                type: 'text',
                content: '¡Hola Andrés! ¿Nos vemos mañana para la sesión de fútbol?',
                timestamp: new Date(Date.now() - 3600000).toISOString()
            },
            {
                id: '2',
                sessionId: this.sessionId,
                senderId: 'trainer',
                type: 'text',
                content: '¡Hola! Sí, a las 2:00 PM en el estadio La Campiña como acordamos.',
                timestamp: new Date(Date.now() - 3540000).toISOString()
            },
            {
                id: '3',
                sessionId: this.sessionId,
                senderId: this.currentUser?.id,
                type: 'text',
                content: 'Perfecto. ¿Necesito traer algo especial para el entrenamiento?',
                timestamp: new Date(Date.now() - 3480000).toISOString()
            },
            {
                id: '4',
                sessionId: this.sessionId,
                senderId: 'trainer',
                type: 'text',
                content: 'Solo tus botines de fútbol y una botella de agua. Yo llevaré los conos y balones.',
                timestamp: new Date(Date.now() - 3420000).toISOString()
            }
        ];
    }

    async simulateSendMessage(message) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true };
    }

    async simulateFileUpload(file) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simular URL del archivo subido
        if (file.type.startsWith('image/')) {
            return URL.createObjectURL(file);
        } else {
            return `https://example.com/files/${file.name}`;
        }
    }

    // ==================== LIMPIEZA ====================
    destroy() {
        if (this.messagePollingInterval) {
            clearInterval(this.messagePollingInterval);
        }
        
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }

        // Limpiar event listeners
        document.removeEventListener('beforeunload', this.handleBeforeUnload);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.chatPageManager = new ChatPageManager();
});

// Limpiar al salir de la página
window.addEventListener('beforeunload', function() {
    if (window.chatPageManager) {
        window.chatPageManager.destroy();
    }
});