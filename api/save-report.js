import { db } from './lib/firebaseAdmin.js';

export default async function handler(req, res) {
    // Solo permitimos peticiones POST (enviar información)
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        const patientData = req.body;

        // Validación básica de seguridad para evitar datos corruptos
        if (!patientData || !patientData.demographics || !patientData.answers) {
            return res.status(400).json({ message: 'Datos incompletos.' });
        }

        // Agregamos una marca de tiempo del servidor para saber exactamente cuándo se completó la prueba
        patientData.createdAt = new Date().toISOString();

        // GUARDAR EN FIREBASE FIRESTORE
        // 'add()' crea un documento nuevo automáticamente con un ID único alfanumérico
        const docRef = await db.collection('evaluaciones_ceper').add(patientData);

        console.log(`Reporte guardado con éxito. ID del documento: ${docRef.id}`);

        // Retornamos éxito al frontend (index.html)
        return res.status(200).json({ 
            success: true, 
            message: 'Evaluación CEPER-III guardada correctamente.',
            id_referencia: docRef.id
        });

    } catch (error) {
        console.error('Error al guardar en Firebase:', error);
        return res.status(500).json({ message: 'Error interno al procesar la evaluación.' });
    }
}
