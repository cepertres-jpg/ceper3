import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        // 1. Verificar que traiga la "Llave Maestra" en los headers
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No autorizado. Token faltante.' });
        }

        const token = authHeader.split(' ')[1];
        let decodedToken;

        // 2. Validar que la llave sea real y no haya expirado
        try {
            decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_temporal_solo_desarrollo');
        } catch (err) {
            return res.status(401).json({ message: 'Sesión expirada o token inválido.' });
        }

        const requestUser = decodedToken.user; // ej: "jorge" o "admin"

        /* ========================================================================
        AQUÍ VA LA CONSULTA A LA BASE DE DATOS
        Si requestUser === 'admin' -> select * from pacientes
        Si requestUser !== 'admin' -> select * from pacientes where psicologo = requestUser
        ========================================================================
        */

        // Simulador de respuesta de Base de Datos para que el portal funcione temporalmente
        const mockDB = [
            { id: 1, nombre: "María José", apellidos: "Pérez Gómez", edad: 28, genero: "Mujer", fecha: "24/04/2026", psicologo: "jorge" },
            { id: 2, nombre: "Carlos", apellidos: "Ramírez Silva", edad: 35, genero: "Hombre", fecha: "23/04/2026", psicologo: "martha" },
            { id: 3, nombre: "Laura", apellidos: "Martínez", edad: 22, genero: "Mujer", fecha: "22/04/2026", psicologo: "jorge" },
            { id: 4, nombre: "Andrés", apellidos: "Vargas", edad: 41, genero: "Hombre", fecha: "20/04/2026", psicologo: "victor" }
        ];

        let pacientesPermitidos = [];
        if (requestUser === 'admin') {
            pacientesPermitidos = mockDB;
        } else {
            pacientesPermitidos = mockDB.filter(p => p.psicologo === requestUser);
        }

        return res.status(200).json({ 
            success: true, 
            data: pacientesPermitidos 
        });

    } catch (error) {
        console.error('Error al obtener pacientes:', error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
}
