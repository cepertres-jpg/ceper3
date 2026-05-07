import { db } from './lib/firebaseAdmin.js';

export default async function handler(req, res) {
    // Solo permitimos peticiones GET para esta comprobación
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        // Intentamos hacer una lectura mínima y rápida a Firestore.
        // Si la cuenta de Google fue suspendida, las credenciales expiraron o hay 
        // cualquier problema, esta línea fallará y lanzará un error al "catch".
        await db.collection('evaluaciones_ceper_INVENTADA').limit(1).get();
        
        // Si logró pasar, la conexión está perfecta.
        return res.status(200).json({ 
            success: true, 
            message: 'Conexión a Base de Datos estable y operativa.' 
        });

    } catch (error) {
        console.error('Error Crítico - Fallo de conexión a Firebase:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'No hay conexión con la Base de Datos.' 
        });
    }
}
