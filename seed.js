// seed.js: Script para inicializar el lote de parqueo en la base de datos

const { connect } = require('mongoose');
const dotenv = require('dotenv');
// Importa el modelo ParkingLot desde la carpeta de modelos
const ParkingLot = require('./src/models/ParkingLot'); 

// Cargar variables de entorno
dotenv.config();

const mongoURI = process.env.MONGODB_URI;

// --- CONFIGURACIÓN DEL PARQUEO ---
const PARKING_LOT_NAME = 'Parqueo TesisProyect';
const NUM_SPACES = 10;
// Las filas del parqueo (para generar nombres como A1, A2, B1, B2...)
const ROWS = ['A', 'B']; 
// ----------------------------------

// Función principal para generar los datos y guardarlos
const seedDB = async () => {
    try {
        await connect(mongoURI);
        console.log('✅ Conectado a la base de datos de MongoDB para la inicialización.');

        // 1. Verificar si ya existe un lote de parqueo
        const existingLot = await ParkingLot.findOne({ name: PARKING_LOT_NAME });

        if (existingLot) {
            console.log(`⚠️ El parqueo '${PARKING_LOT_NAME}' ya existe. Eliminando y recreando para asegurar limpieza.`);
            await ParkingLot.deleteMany({ name: PARKING_LOT_NAME });
        }

        // 2. Generar la lista de espacios
        const spaces = [];
        let count = 0;
        
        // Genera 10 espacios con nombres como A1, A2, A3, A4, A5, B1, B2...
        for (let i = 0; i < ROWS.length && count < NUM_SPACES; i++) {
            const row = ROWS[i];
            // Distribuye los espacios entre las filas (ej: 5 en A y 5 en B)
            const spacesInRow = Math.min(NUM_SPACES - count, Math.ceil(NUM_SPACES / ROWS.length)); 
            
            for (let j = 1; j <= spacesInRow && count < NUM_SPACES; j++) {
                spaces.push({
                    spaceNumber: `${row}${j}`,
                    isOccupied: false,
                    occupiedBy: null,
                    entryTime: null,
                });
                count++;
            }
        }

        // 3. Crear el nuevo documento ParkingLot
        const newLot = new ParkingLot({
            name: PARKING_LOT_NAME,
            location: 'Cercano al campus central',
            totalSpaces: spaces.length,
            availableSpaces: spaces.length,
            spaces: spaces,
        });

        await newLot.save();

        console.log(`\n🎉 Inicialización Exitosa.`);
        console.log(`✅ Parqueo '${PARKING_LOT_NAME}' creado con ${newLot.totalSpaces} espacios.`);

    } catch (error) {
        console.error('❌ Error durante la inicialización de la base de datos:', error.message);
    } finally {
        // Desconectar al terminar, independientemente del éxito o fracaso
        if (require('mongoose').connection.readyState === 1) {
            await require('mongoose').disconnect();
            console.log('🔌 Desconectado de MongoDB.');
        }
        // Asegúrate de que el proceso termine después de la desconexión
        process.exit(); 
    }
};

seedDB();
