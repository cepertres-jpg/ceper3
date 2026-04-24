import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    // Solo permitimos peticiones POST (enviar datos)
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'El usuario y la contraseña son requeridos.' });
        }

        const cleanUsername = username.trim().toLowerCase();

        // Construir el nombre de la variable de entorno esperada. 
        // Ej: si escribe "jorge", buscará "PASS_JORGE"
        const envVarName = `PASS_${cleanUsername.toUpperCase()}`;
        const correctPassword = process.env[envVarName];

        // Validar si el usuario existe (tiene variable en Vercel) y si la clave coincide
        if (correctPassword && correctPassword === password) {
            
            // La clave es correcta. Creamos el Token de seguridad (Llave Maestra)
            // Usamos la variable JWT_SECRET de Vercel para firmarlo
            const token = jwt.sign(
                { user: cleanUsername },
                process.env.JWT_SECRET || 'clave_secreta_temporal_solo_desarrollo',
                { expiresIn: '8h' } // La sesión del psicólogo durará 8 horas
            );

            // Respondemos con éxito entregando el token
            return res.status(200).json({ 
                success: true, 
                token: token, 
                user: cleanUsername 
            });
            
        } else {
            // Usuario o clave incorrecta
            return res.status(401).json({ message: 'Usuario o contraseña incorrectos. Acceso denegado.' });
        }

    } catch (error) {
        console.error('Error en autenticación:', error);
        return res.status(500).json({ message: 'Error interno del servidor.' });
    }
}
