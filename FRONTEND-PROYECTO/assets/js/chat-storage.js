/* 
 * assets/js/chat-storage.js
 * Gestión completa de chats con localStorage
 * Autor: SportLink
 * Descripción: Clase para manejar persistencia de mensajes por sesión
 */

class ChatStorageManager {
    constructor() {
        this.STORAGE_KEY = 'sportlink_chats';
        this.SESSIONS_KEY = 'sportlink_chat_sessions';
    }

    /**
     * Inicializar o recuperar un chat para una sesión
     * @param {string} sessionId - ID de la sesión
     * @param {Object} sessionData - Datos de la sesión {cliente, entrenador, servicio, etc}
     * @returns {Object} Datos del chat
     */
    initializeChat(sessionId, sessionData) {
        let chats = this.getAllChats();
        
        if (!chats[sessionId]) {
            chats[sessionId] = {
                sessionId: sessionId,
                messages: [],
                participants: {
                    cliente: sessionData.cliente || {},
                    entrenador: sessionData.entrenador || {}
                },
                servicio: sessionData.servicio || {},
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isActive: true
            };
            
            this.saveAllChats(chats);
            console.log(`✅ Chat inicializado para sesión: ${sessionId}`);
        } else {
            console.log(`✅ Chat existente recuperado para sesión: ${sessionId}`);
        }
        
        return chats[sessionId];
    }

    /**
     * Agregar un mensaje al chat
     * @param {string} sessionId - ID de la sesión
     * @param {Object} message - Objeto mensaje
     * @returns {boolean} true si se guardó correctamente
     */
    addMessage(sessionId, message) {
        let chats = this.getAllChats();
        
        if (!chats[sessionId]) {
            console.error(`❌ Chat no encontrado para la sesión: ${sessionId}`);
            return false;
        }

        const newMessage = {
            id: message.id || Date.now().toString(),
            senderId: message.senderId,
            senderType: message.senderType || 'cliente', // 'cliente' o 'entrenador'
            senderName: message.senderName || 'Usuario',
            content: message.content,
            timestamp: message.timestamp || new Date().toISOString(),
            type: message.type || 'text', // 'text', 'image', 'file'
            fileName: message.fileName || null,
            fileSize: message.fileSize || null,
            read: message.read || false
        };

        chats[sessionId].messages.push(newMessage);
        chats[sessionId].updatedAt = new Date().toISOString();
        
        this.saveAllChats(chats);
        console.log(`✅ Mensaje agregado a sesión: ${sessionId}`);
        
        return true;
    }

    /**
     * Obtener todos los mensajes de un chat
     * @param {string} sessionId - ID de la sesión
     * @returns {Array} Array de mensajes
     */
    getMessages(sessionId) {
        let chats = this.getAllChats();
        
        if (!chats[sessionId]) {
            console.warn(`⚠️ No hay chat para la sesión: ${sessionId}`);
            return [];
        }

        return chats[sessionId].messages || [];
    }

    /**
     * Obtener un chat específico
     * @param {string} sessionId - ID de la sesión
     * @returns {Object} Datos del chat
     */
    getChat(sessionId) {
        let chats = this.getAllChats();
        return chats[sessionId] || null;
    }

    /**
     * Obtener todos los chats
     * @returns {Object} Objeto con todos los chats organizados por sessionId
     */
    getAllChats() {
        try {
            const chats = localStorage.getItem(this.STORAGE_KEY);
            return chats ? JSON.parse(chats) : {};
        } catch (error) {
            console.error('❌ Error recuperando chats del localStorage:', error);
            return {};
        }
    }

    /**
     * Guardar todos los chats en localStorage
     * @param {Object} chats - Objeto con todos los chats
     */
    saveAllChats(chats) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(chats));
        } catch (error) {
            console.error('❌ Error guardando chats en localStorage:', error);
            
            if (error.name === 'QuotaExceededError') {
                console.warn('⚠️ Límite de localStorage excedido, limpiando chats antiguos...');
                this.cleanOldChats();
                try {
                    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(chats));
                    console.log('✅ Chats guardados después de limpieza');
                } catch (retryError) {
                    console.error('❌ Aún hay problema después de limpiar:', retryError);
                }
            }
        }
    }

    /**
     * Marcar un mensaje como leído
     * @param {string} sessionId - ID de la sesión
     * @param {string} messageId - ID del mensaje
     */
    markMessageAsRead(sessionId, messageId) {
        let chats = this.getAllChats();
        
        if (chats[sessionId]) {
            const message = chats[sessionId].messages.find(m => m.id === messageId);
            if (message) {
                message.read = true;
                this.saveAllChats(chats);
            }
        }
    }

    /**
     * Marcar todos los mensajes como leídos
     * @param {string} sessionId - ID de la sesión
     */
    markAllMessagesAsRead(sessionId) {
        let chats = this.getAllChats();
        
        if (chats[sessionId]) {
            chats[sessionId].messages.forEach(msg => {
                msg.read = true;
            });
            this.saveAllChats(chats);
            console.log(`✅ Todos los mensajes marcados como leídos en sesión: ${sessionId}`);
        }
    }

    /**
     * Contar mensajes no leídos en un chat
     * @param {string} sessionId - ID de la sesión
     * @param {string} userId - ID del usuario que lee
     * @returns {number} Cantidad de mensajes no leídos
     */
    getUnreadCount(sessionId, userId) {
        const messages = this.getMessages(sessionId);
        return messages.filter(m => 
            !m.read && m.senderId !== userId
        ).length;
    }

    /**
     * Obtener lista de chats activos del usuario
     * @param {string} userId - ID del usuario
     * @param {string} userType - 'cliente' o 'entrenador'
     * @returns {Array} Array de chats activos
     */
    getUserChats(userId, userType) {
        const chats = this.getAllChats();
        const userChats = [];

        Object.keys(chats).forEach(sessionId => {
            const chat = chats[sessionId];
            
            // Verificar si el usuario es participante
            const isParticipant = 
                (userType === 'cliente' && chat.participants.cliente?.idCliente === userId) ||
                (userType === 'entrenador' && chat.participants.entrenador?.idEntrenador === userId);

            if (isParticipant && chat.isActive) {
                userChats.push({
                    sessionId: sessionId,
                    ...chat,
                    unreadCount: this.getUnreadCount(sessionId, userId),
                    lastMessage: chat.messages.length > 0 
                        ? chat.messages[chat.messages.length - 1] 
                        : null,
                    lastMessageTime: chat.messages.length > 0
                        ? new Date(chat.messages[chat.messages.length - 1].timestamp).toLocaleString('es-CO')
                        : 'Sin mensajes'
                });
            }
        });

        // Ordenar por fecha de actualización más reciente
        return userChats.sort((a, b) => 
            new Date(b.updatedAt) - new Date(a.updatedAt)
        );
    }

    /**
     * Eliminar un chat
     * @param {string} sessionId - ID de la sesión
     * @returns {boolean} true si se eliminó correctamente
     */
    deleteChat(sessionId) {
        let chats = this.getAllChats();
        
        if (chats[sessionId]) {
            delete chats[sessionId];
            this.saveAllChats(chats);
            console.log(`✅ Chat eliminado de sesión: ${sessionId}`);
            return true;
        }
        
        console.warn(`⚠️ No se pudo eliminar, chat no encontrado: ${sessionId}`);
        return false;
    }

    /**
     * Desactivar un chat (sin eliminar datos)
     * @param {string} sessionId - ID de la sesión
     */
    deactivateChat(sessionId) {
        let chats = this.getAllChats();
        
        if (chats[sessionId]) {
            chats[sessionId].isActive = false;
            this.saveAllChats(chats);
            console.log(`✅ Chat desactivado en sesión: ${sessionId}`);
        }
    }

    /**
     * Reactivar un chat desactivado
     * @param {string} sessionId - ID de la sesión
     */
    reactivateChat(sessionId) {
        let chats = this.getAllChats();
        
        if (chats[sessionId]) {
            chats[sessionId].isActive = true;
            this.saveAllChats(chats);
            console.log(`✅ Chat reactivado en sesión: ${sessionId}`);
        }
    }

    /**
     * Limpiar chats antiguos (más de 30 días sin actividad)
     */
    cleanOldChats() {
        const chats = this.getAllChats();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        let deletedCount = 0;

        Object.keys(chats).forEach(sessionId => {
            const updatedAt = new Date(chats[sessionId].updatedAt);
            if (updatedAt < thirtyDaysAgo) {
                delete chats[sessionId];
                deletedCount++;
            }
        });

        this.saveAllChats(chats);
        console.log(`🧹 ${deletedCount} chats antiguos eliminados`);
    }

    /**
     * Obtener estadísticas de uso de almacenamiento
     * @returns {Object} Estadísticas {totalChats, totalMessages, estimatedSize}
     */
    getStorageStats() {
        const chats = this.getAllChats();
        let totalChats = 0;
        let totalMessages = 0;

        Object.keys(chats).forEach(sessionId => {
            totalChats++;
            totalMessages += chats[sessionId].messages.length;
        });

        try {
            const storageUsed = new Blob([localStorage.getItem(this.STORAGE_KEY)]).size;
            const maxStorageKB = 5 * 1024; // 5MB típico

            return {
                totalChats,
                totalMessages,
                estimatedSizeKB: (storageUsed / 1024).toFixed(2),
                maxStorageKB: maxStorageKB.toFixed(2),
                percentageUsed: ((storageUsed / (maxStorageKB * 1024)) * 100).toFixed(2) + '%'
            };
        } catch (error) {
            console.error('❌ Error calculando estadísticas:', error);
            return {
                totalChats,
                totalMessages,
                estimatedSizeKB: '0',
                maxStorageKB: '5120',
                percentageUsed: '0%'
            };
        }
    }

    /**
     * Buscar mensajes en un chat
     * @param {string} sessionId - ID de la sesión
     * @param {string} searchTerm - Término a buscar
     * @returns {Array} Array de mensajes que coinciden
     */
    searchMessages(sessionId, searchTerm) {
        const messages = this.getMessages(sessionId);
        const term = searchTerm.toLowerCase();

        return messages.filter(msg => 
            msg.content.toLowerCase().includes(term) ||
            msg.senderName.toLowerCase().includes(term)
        );
    }

    /**
     * Obtener últimos N mensajes
     * @param {string} sessionId - ID de la sesión
     * @param {number} limit - Cantidad de mensajes a obtener
     * @returns {Array} Array de últimos mensajes
     */
    getLastMessages(sessionId, limit = 50) {
        const messages = this.getMessages(sessionId);
        return messages.slice(-limit);
    }

    /**
     * Exportar historial de chat como JSON
     * @param {string} sessionId - ID de la sesión
     * @returns {string} JSON del chat
     */
    exportChat(sessionId) {
        const chat = this.getChat(sessionId);
        if (!chat) {
            console.warn(`⚠️ Chat no encontrado para exportar: ${sessionId}`);
            return null;
        }
        return JSON.stringify(chat, null, 2);
    }

    /**
     * Contar total de mensajes por usuario en una sesión
     * @param {string} sessionId - ID de la sesión
     * @param {string} userId - ID del usuario
     * @returns {number} Cantidad de mensajes del usuario
     */
    getMessageCountByUser(sessionId, userId) {
        const messages = this.getMessages(sessionId);
        return messages.filter(m => m.senderId === userId).length;
    }

    /**
     * Obtener información del último mensaje
     * @param {string} sessionId - ID de la sesión
     * @returns {Object|null} Último mensaje o null
     */
    getLastMessage(sessionId) {
        const messages = this.getMessages(sessionId);
        return messages.length > 0 ? messages[messages.length - 1] : null;
    }

    /**
     * Verificar si existe un chat
     * @param {string} sessionId - ID de la sesión
     * @returns {boolean} true si existe
     */
    chatExists(sessionId) {
        return this.getChat(sessionId) !== null;
    }

    /**
     * Limpiar TODOS los chats (usar con precaución)
     * @returns {boolean} true si se limpió
     */
    clearAllChats() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            console.log('🗑️ ⚠️ TODOS los chats han sido eliminados');
            return true;
        } catch (error) {
            console.error('❌ Error limpiando todos los chats:', error);
            return false;
        }
    }

    /**
     * Obtener resumen de un chat (para listados)
     * @param {string} sessionId - ID de la sesión
     * @returns {Object} Datos resumidos del chat
     */
    getChatSummary(sessionId) {
        const chat = this.getChat(sessionId);
        if (!chat) return null;

        return {
            sessionId: sessionId,
            lastMessage: this.getLastMessage(sessionId),
            totalMessages: chat.messages.length,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt,
            clienteName: chat.participants.cliente?.nombres || 'Desconocido',
            entrenadorName: chat.participants.entrenador?.nombres || 'Desconocido',
            servicio: chat.servicio?.nombre || 'Sin servicio'
        };
    }

    /**
     * Mostrar información de debug en consola
     * @param {string} sessionId - ID de la sesión (opcional)
     */
    debugInfo(sessionId = null) {
        if (sessionId) {
            const chat = this.getChat(sessionId);
            console.group(`📊 DEBUG - Chat: ${sessionId}`);
            console.table(chat);
            console.groupEnd();
        } else {
            const allChats = this.getAllChats();
            console.group('📊 DEBUG - Todos los Chats');
            console.log('Total de chats:', Object.keys(allChats).length);
            Object.keys(allChats).forEach(id => {
                console.log(`  ${id}:`, allChats[id].messages.length, 'mensajes');
            });
            console.table(this.getStorageStats());
            console.groupEnd();
        }
    }
}

// ==================== INSTANCIA GLOBAL ====================
/**
 * Instancia global de ChatStorageManager
 * Se usa en toda la aplicación como: chatStorage.metodo()
 */
const chatStorage = new ChatStorageManager();

console.log('✅ ChatStorageManager cargado correctamente');
