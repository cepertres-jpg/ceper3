import admin from 'firebase-admin';

// Verificamos si Firebase Admin ya fue inicializado para evitar errores 
// de duplicación en entornos Serverless (Vercel)
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                // Estas variables deben venir de tu archivo JSON de cuenta de servicio de Firebase
                // y deben ser configuradas en las Variables de Entorno de Vercel
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Reemplazamos los saltos de línea literales (\\n) por saltos reales (\n)
                // Esto es crucial porque Vercel a veces escapa los caracteres de la llave privada
                privateKey: process.env.FIREBASE_PRIVATE_KEY 
                    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
                    : undefined,
            }),
        });
        console.log('Firebase Admin inicializado correctamente.');
    } catch (error) {
        console.error('Error inicializando Firebase Admin:', error.stack);
    }
}

// Exportamos la instancia de la base de datos (Firestore) 
// para usarla directamente en save-report.js y get-patients.js
export const db = admin.firestore();
export default admin;
