async function testRegisterWithCorrectEmail() {
    try {
        console.log('🧪 Probando registro con email @miumg.edu.gt...\n');
        
        const userData = {
            name: 'Carmen Lopez',
            email: 'carmen.lopez@miumg.edu.gt',
            password: 'TestPass123!',
            card_id: '12345678',
            vehicle_plate: 'UMG-001'
        };

        console.log('📤 Enviando:', JSON.stringify(userData, null, 2));

        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        console.log('\n✅ Status:', response.status, response.statusText);
        console.log('📦 Respuesta:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }
}

testRegisterWithCorrectEmail();
