// test-auth.js - Script para probar la autenticación
const http = require('http');
const fs = require('fs');

// Función para hacer peticiones HTTP
function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const jsonBody = JSON.parse(body);
                    resolve({ status: res.statusCode, data: jsonBody });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// Función principal de prueba
async function testAuth() {
    const logFile = './test-results.txt';
    let output = '';
    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    log('🧪 Iniciando pruebas de autenticación...\n');

    try {
        // 1. Probar registro
        log('📝 Prueba 1: Registrar usuario');
        const registerData = {
            name: 'Usuario Prueba',
            email: 'prueba@test.com',
            password: 'Prueba123',
            cardId: 'CARD001',
            vehiclePlate: 'ABC123'
        };

        const registerResult = await makeRequest('POST', '/api/auth/register', registerData);
        log(`Status: ${registerResult.status}`);
        log('Respuesta: ' + JSON.stringify(registerResult.data, null, 2));
        log('');

        // 2. Probar login
        log('🔐 Prueba 2: Iniciar sesión');
        const loginData = {
            email: 'prueba@test.com',
            password: 'Prueba123'
        };

        const loginResult = await makeRequest('POST', '/api/auth/login', loginData);
        log(`Status: ${loginResult.status}`);
        log('Respuesta: ' + JSON.stringify(loginResult.data, null, 2));

        if (loginResult.data.token) {
            log('\n✅ Token obtenido exitosamente!');
            log(`Token completo: ${loginResult.data.token}`);
        }

    } catch (error) {
        log('❌ Error durante las pruebas: ' + error.message);
        if (error.code === 'ECONNREFUSED') {
            log('\n⚠️ El servidor no está corriendo en el puerto 3000.');
            log('Por favor, asegúrate de que el servidor esté iniciado con: npm run dev');
        }
    } finally {
        fs.writeFileSync(logFile, output);
        log(`\n📄 Resultados guardados en: ${logFile}`);
    }
}

// Ejecutar las pruebas
testAuth();

