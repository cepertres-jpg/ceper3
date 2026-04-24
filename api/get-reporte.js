import jwt from 'jsonwebtoken';
import { db } from './lib/firebaseAdmin.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        // 1. Verificación de Seguridad (Token)
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No autorizado.' });
        }

        const token = authHeader.split(' ')[1];
        let decodedToken;

        try {
            decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_temporal_solo_desarrollo');
        } catch (err) {
            return res.status(401).json({ message: 'Sesión expirada.' });
        }

        const requestUser = decodedToken.user;
        
        // 2. Obtener el ID de la URL (ej: /api/get-report?id=12345)
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ message: 'ID de reporte no proporcionado.' });
        }

        // 3. Buscar en Firebase
        const docRef = db.collection('evaluaciones_ceper').doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ message: 'Reporte no encontrado.' });
        }

        const docData = docSnap.data();

        // 4. Regla de Seguridad: ¿Tiene permiso de ver esto?
        if (requestUser !== 'admin') {
            if (!docData.demographics || docData.demographics.psicologo !== requestUser) {
                return res.status(403).json({ message: 'Acceso denegado. Este reporte pertenece a otro psicólogo.' });
            }
        }

        // 5. Retornar los datos completos
        return res.status(200).json({ 
            success: true, 
            data: { id: docSnap.id, ...docData } 
        });

    } catch (error) {
        console.error('Error al obtener reporte específico:', error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
}
