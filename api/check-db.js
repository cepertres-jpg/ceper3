import { db } from './lib/firebaseAdmin.js';

export default async function handler(req, res) {
    // Solo permitimos peticiones GET para esta comprobación
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        // Hacemos la petición a la base de datos limitando a 1 solo documento para que sea súper rápido
        const snapshot = await db.collection('evaluaciones_ceper_inventar').limit(1).get();
        
        // REGLA ESTRICTA: Si la conexión fue exitosa pero la colección NO EXISTE 
        // (por ejemplo, si le cambiamos el nombre por error) o está vacía, forzamos un error.
        if (snapshot.empty) {
            throw new Error('La colección no existe o está completamente vacía.');
        }
        
        // Si logró pasar, la conexión está perfecta y encontró la colección.
        return res.status(200).json({ 
            success: true, 
            message: 'Conexión a Base de Datos estable y operativa.' 
        });

    } catch (error) {
        console.error('Error Crítico - Fallo de conexión a Firebase:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'No hay conexión con la Base de Datos o la colección no existe.' 
        });
    }
}
