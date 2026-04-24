import jwt from 'jsonwebtoken';
import { db } from './lib/firebaseAdmin.js';

export default async function handler(req, res) {
    // Solo permitimos peticiones GET para obtener datos
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        // 1. Verificación de Seguridad: Validar el Token del psicólogo
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No autorizado. Por favor inicia sesión.' });
        }

        const token = authHeader.split(' ')[1];
        let decodedToken;

        try {
            // Verificamos que el token sea auténtico
            decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_temporal_solo_desarrollo');
        } catch (err) {
            return res.status(401).json({ message: 'Sesión expirada. Vuelve a ingresar.' });
        }

        const requestUser = decodedToken.user; // Ej: "claudia" o "admin"

        // 2. Consulta a Firebase Firestore
        const snapshot = await db.collection('evaluaciones_ceper').get();
        let patients = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            const demo = data.demographics || {};
            
            // Formateamos la fecha para que el portal la muestre bien
            const fechaDoc = data.createdAt ? new Date(data.createdAt) : new Date();
            const fechaString = fechaDoc.toLocaleDateString('es-CO');
            const timestamp = fechaDoc.getTime();
            
            const patientSummary = {
                id: doc.id,
                nombre: demo.nombres || '',
                apellidos: `${demo.primer_apellido || ''} ${demo.segundo_apellido || ''}`.trim(),
                edad: demo.edad || '--',
                genero: demo.genero || '--',
                fecha: fechaString,
                psicologo: demo.psicologo || '',
                timestamp: timestamp
            };

            // 3. LÓGICA DE FILTRADO (El corazón del problema)
            if (requestUser === 'admin') {
                // El Super Admin siempre ve todo
                patients.push(patientSummary);
            } else {
                // Para los psicólogos, comparamos ignorando mayúsculas/minúsculas y espacios
                const psiDB = (demo.psicologo || '').trim().toLowerCase();
                const userSession = requestUser.trim().toLowerCase();

                if (psiDB === userSession) {
                    patients.push(patientSummary);
                }
            }
        });

        // 4. Ordenar: El último paciente evaluado aparece de primero en la lista
        patients.sort((a, b) => b.timestamp - a.timestamp);

        // 5. Respuesta exitosa
        return res.status(200).json({ 
            success: true, 
            data: patients 
        });

    } catch (error) {
        console.error('Error crítico en get-patients:', error);
        return res.status(500).json({ message: 'Error interno al consultar la base de datos.' });
    }
}
