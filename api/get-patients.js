import jwt from 'jsonwebtoken';
import { db } from '../lib/firebaseAdmin.js';

export default async function handler(req, res) {
    // Solo permitimos peticiones GET (solicitar información)
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        // 1. Verificación de Seguridad (Token)
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

        // 2. Consultar Base de Datos
        // Traemos todos los documentos de la colección
        const snapshot = await db.collection('evaluaciones_ceper').get();
        
        let todasLasEvaluaciones = [];
        snapshot.forEach(doc => {
            todasLasEvaluaciones.push({ id: doc.id, ...doc.data() });
        });

        // 3. Filtrar según los permisos del usuario
        let pacientesPermitidos = [];
        if (requestUser === 'admin') {
            // El Super Admin ve toda la base de datos
            pacientesPermitidos = todasLasEvaluaciones;
        } else {
            // Los psicólogos solo ven los pacientes que los eligieron a ellos
            pacientesPermitidos = todasLasEvaluaciones.filter(p => 
                p.demographics && p.demographics.psicologo === requestUser
            );
        }

        // 4. Limpiar y estructurar los datos antes de enviarlos al portal.html
        // (No enviamos las 170 respuestas aquí para no saturar la tabla, solo los datos de resumen)
        const datosParaTabla = pacientesPermitidos.map(p => {
            // Formatear la fecha de ISO a algo legible (DD/MM/YYYY)
            const fechaFormateada = p.createdAt 
                ? new Date(p.createdAt).toLocaleDateString('es-CO') 
                : 'Sin fecha';

            return {
                id: p.id,
                nombre: p.demographics.nombres,
                apellidos: `${p.demographics.primer_apellido} ${p.demographics.segundo_apellido}`,
                edad: p.demographics.edad,
                genero: p.demographics.genero,
                fecha: fechaFormateada,
                psicologo: p.demographics.psicologo,
                createdAt_raw: p.createdAt || "" // Lo usamos para ordenar a continuación
            };
        });

        // 5. Ordenar la tabla: los más recientes arriba
        datosParaTabla.sort((a, b) => new Date(b.createdAt_raw) - new Date(a.createdAt_raw));

        // 6. Enviar la información al portal
        return res.status(200).json({ 
            success: true, 
            data: datosParaTabla 
        });

    } catch (error) {
        console.error('Error al obtener pacientes desde Firebase:', error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
}
