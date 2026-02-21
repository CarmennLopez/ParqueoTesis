// src/services/mqttService.js
const mqtt = require('mqtt');
const logger = require('../config/logger');

class MqttService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.simulationMode = process.env.IOT_SIMULATION_MODE === 'true' || true; // Default to true for safety

        if (this.simulationMode) {
            logger.info('🔧 MQTT Service iniciado en MODO SIMULACIÓN');
        } else {
            this.connect();
        }
    }

    connect() {
        const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://test.mosquitto.org';

        logger.info(`Intentando conectar a broker MQTT: ${brokerUrl}`);

        this.client = mqtt.connect(brokerUrl, {
            clientId: `parking_backend_${Math.random().toString(16).slice(2, 8)}`,
            reconnectPeriod: 5000 // Reintentar cada 5s
        });

        this.client.on('connect', () => {
            this.isConnected = true;
            logger.info('✅ Conectado al broker MQTT');
            this.subscribeToTopics();
        });

        this.client.on('error', (err) => {
            logger.error('❌ Error de conexión MQTT:', err.message);
            this.isConnected = false;
        });

        this.client.on('offline', () => {
            logger.warn('⚠️ Cliente MQTT desconectado');
            this.isConnected = false;
        });
    }

    subscribeToTopics() {
        const topics = ['parking/sensors/+', 'parking/gates/+/status'];
        this.client.subscribe(topics, (err) => {
            if (err) logger.error('Error suscribiendo a tópicos:', err);
            else logger.info(`Suscrito a: ${topics.join(', ')}`);
        });

        this.client.on('message', (topic, message) => {
            logger.info(`📨 Mensaje recibido en [${topic}]: ${message.toString()}`);
        });
    }

    /**
     * Publica un comando para abrir una barrera.
     * @param {string} gateId - ID de la barrera (ej. 'GATE_01')
     * @param {string} userId - ID del usuario que solicita (para auditoría)
     */
    async openGate(gateId, userId) {
        const topic = `parking/gates/${gateId}/command`;
        const payload = JSON.stringify({
            command: 'OPEN',
            timestamp: new Date().toISOString(),
            requestedBy: userId,
            requestId: Math.random().toString(36).substring(7)
        });

        if (this.simulationMode) {
            logger.info(`[SIMULACIÓN MQTT] Publicando en ${topic}: ${payload}`);
            // Simular delay de red y respuesta de hardware
            return new Promise((resolve) => {
                setTimeout(() => {
                    logger.info(`[SIMULACIÓN MQTT] Barrera ${gateId} ABIERTA exitosamente.`);
                    resolve({ success: true, simulated: true });
                }, 500);
            });
        }

        if (!this.isConnected) {
            logger.warn('MQTT no conectado. No se puede enviar comando real.');
            throw new Error('Servicio MQTT no disponible');
        }

        return new Promise((resolve, reject) => {
            this.client.publish(topic, payload, { qos: 1 }, (err) => {
                if (err) {
                    logger.error(`Error publicando en ${topic}:`, err);
                    reject(err);
                } else {
                    logger.info(`Comando enviado a ${topic}`);
                    resolve({ success: true, simulated: false });
                }
            });
        });
    }
}

// Singleton
module.exports = new MqttService();
