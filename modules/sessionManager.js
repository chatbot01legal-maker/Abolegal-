// modules/sessionManager.js - Gestión de sesiones con fallback a memoria
const { MongoClient } = require('mongodb');

class SessionManager {
    constructor() {
        this.uri = process.env.MONGODB_URI;
        this.dbName = 'legal_chatbot';
        this.collectionName = 'sessions';
        this.client = null;
        this.collection = null;
        this.memorySessions = new Map();
        this.dbConnected = false;
        
        console.log('🔧 [SESSION MANAGER] Inicializando...');
        console.log(`   - URI configurada: ${this.uri ? 'SÍ' : 'NO'}`);
        
        if (!this.uri) {
            console.log('⚠️  [SESSION MANAGER] MONGODB_URI no configurada. Operando en modo memoria.');
        }
    }

    async connect() {
        if (!this.uri) {
            console.log('⚠️  [SESSION MANAGER] Sin URI de MongoDB. Modo memoria activado.');
            return false;
        }

        try {
            console.log('🔌 [SESSION MANAGER] Conectando a MongoDB Atlas...');
            this.client = new MongoClient(this.uri, {
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 10000,
                maxPoolSize: 10
            });

            await this.client.connect();
            const db = this.client.db(this.dbName);
            this.collection = db.collection(this.collectionName);
            
            // Crear índices
            await this.collection.createIndex({ sessionId: 1 }, { unique: true });
            await this.collection.createIndex({ updatedAt: 1 }, { expireAfterSeconds: 604800 });
            
            this.dbConnected = true;
            console.log('✅ [SESSION MANAGER] Conectado a MongoDB Atlas');
            return true;
            
        } catch (error) {
            console.error('❌ [SESSION MANAGER] Error conectando a MongoDB:', error.message);
            console.log('⚠️  [SESSION MANAGER] Operando en modo memoria (sin persistencia)');
            this.dbConnected = false;
            return false;
        }
    }

    async getSession(sessionId) {
        // Primero intentar con MongoDB
        if (this.dbConnected && this.collection) {
            try {
                const session = await this.collection.findOne({ sessionId });
                if (session) {
                    console.log(`📖 [SESSION MANAGER] Sesión cargada desde DB: ${sessionId}`);
                    return session;
                }
            } catch (error) {
                console.warn(`⚠️  [SESSION MANAGER] Error leyendo DB, usando memoria: ${error.message}`);
            }
        }

        // Fallback a memoria
        if (this.memorySessions.has(sessionId)) {
            console.log(`📖 [SESSION MANAGER] Sesión cargada desde memoria: ${sessionId}`);
            return this.memorySessions.get(sessionId);
        }

        // Nueva sesión
        const newSession = {
            sessionId,
            createdAt: new Date(),
            updatedAt: new Date(),
            conversationHistory: [],
            area: 'General',
            conversation_phase: 'initial',
            organizerState: 'initial',
            inMemory: true
        };

        this.memorySessions.set(sessionId, newSession);
        console.log(`📝 [SESSION MANAGER] Nueva sesión en memoria: ${sessionId}`);
        return newSession;
    }

    async saveSession(sessionId, updates) {
        const now = new Date();
        const sessionData = {
            sessionId,
            updatedAt: now,
            ...updates,
            inMemory: !this.dbConnected
        };

        // Guardar en memoria siempre
        const existing = this.memorySessions.get(sessionId) || {};
        this.memorySessions.set(sessionId, { ...existing, ...sessionData });

        // Persistir en MongoDB si está conectado
        if (this.dbConnected && this.collection) {
            try {
                await this.collection.updateOne(
                    { sessionId },
                    { 
                        $set: sessionData,
                        $setOnInsert: { createdAt: now }
                    },
                    { upsert: true }
                );
                console.log(`💾 [SESSION MANAGER] Sesión guardada en DB: ${sessionId}`);
            } catch (error) {
                console.warn(`⚠️  [SESSION MANAGER] Error guardando en DB: ${error.message}`);
            }
        } else {
            console.log(`💾 [SESSION MANAGER] Sesión guardada en memoria: ${sessionId}`);
        }

        return true;
    }

    async getHistory(sessionId) {
        const session = await this.getSession(sessionId);
        return session.conversationHistory || [];
    }

    async addToHistory(sessionId, role, content) {
        const session = await this.getSession(sessionId);
        const history = session.conversationHistory || [];
        
        const entry = {
            role,
            content,
            timestamp: new Date()
        };

        history.push(entry);
        
        // Limitar historial
        if (history.length > 50) {
            history.splice(0, history.length - 50);
        }

        await this.saveSession(sessionId, { conversationHistory: history });
        return entry;
    }

    async cleanup() {
        if (this.client) {
            try {
                await this.client.close();
                console.log('🔌 [SESSION MANAGER] Conexión cerrada');
            } catch (error) {
                console.error('❌ [SESSION MANAGER] Error cerrando conexión:', error);
            }
        }
        this.memorySessions.clear();
    }

    getStatus() {
        return {
            connected: this.dbConnected,
            mode: this.dbConnected ? 'database' : 'memory',
            memorySessions: this.memorySessions.size,
            uriConfigured: !!this.uri
        };
    }
}

// Singleton global
const sessionManager = new SessionManager();

// Conectar al inicio (no bloqueante)
setTimeout(() => {
    sessionManager.connect().catch(() => {
        // El error ya fue manejado en connect()
    });
}, 100);

module.exports = sessionManager;
