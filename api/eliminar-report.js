import jwt from 'jsonwebtoken';
import { db } from './lib/firebaseAdmin.js';

export default async function handler(req, res) {
    // Solo permitimos el método DELETE para borrar datos
    if (req.method !== 'DELETE') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        // 1. Verificación de Seguridad (Token de sesión)
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No autorizado. Token faltante.' });
        }

        const token = authHeader.split(' ')[1];
        let decodedToken;

        try {
            decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_temporal_solo_desarrollo');
        } catch (err) {
            return res.status(401).json({ message: 'Sesión expirada o token inválido.' });
        }

        const requestUser = decodedToken.user; // ej: "jorge", "martha" o "admin"
        
        // El ID del documento vendrá en la URL (ej: /api/eliminar-report?id=XJ9s8d9sa...)
        const { id } = req.query; 

        if (!id) {
            return res.status(400).json({ message: 'El ID del reporte a eliminar es requerido.' });
        }

        // 2. Verificar que el documento exista y comprobar los permisos
        const docRef = db.collection('evaluaciones_ceper').doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ message: 'El reporte no existe o ya fue eliminado.' });
        }

        const docData = docSnap.data();

        // 3. Regla de negocio de seguridad: 
        // Si no eres el 'admin', verificamos si eres el psicólogo dueño del reporte
        if (requestUser !== 'admin') {
            if (!docData.demographics || docData.demographics.psicologo !== requestUser) {
                return res.status(403).json({ message: 'Acceso denegado. Solo puedes eliminar los reportes de tus propios pacientes.' });
            }
        }

        // 4. Ejecutar la eliminación en Firebase
        await docRef.delete();

        return res.status(200).json({ 
            success: true, 
            message: 'Reporte eliminado exitosamente de la base de datos.' 
        });

    } catch (error) {
        console.error('Error al intentar eliminar reporte en Firebase:', error);
        return res.status(500).json({ message: 'Error interno del servidor al procesar la eliminación.' });
    }
}
