export default async function handler(req, res) {
    // Solo permitimos peticiones POST desde el index.html
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        const patientData = req.body;

        // Validación básica de seguridad
        if (!patientData || !patientData.demographics || !patientData.answers) {
            return res.status(400).json({ message: 'Datos incompletos o corruptos.' });
        }

        /* ========================================================================
        AQUÍ VA LA CONEXIÓN A TU BASE DE DATOS (EJ: MONGODB, SUPABASE, FIREBASE)
        Por ahora, simularemos que se guardó correctamente.
        ========================================================================
        */
       
        console.log("Datos recibidos listos para guardar en DB:", patientData.demographics.nombres);

        // Retornamos éxito al navegador del paciente
        return res.status(200).json({ 
            success: true, 
            message: 'Evaluación CEPER-III guardada correctamente.',
            id_referencia: `CEPER-${Date.now()}` // Un ID temporal de recibo
        });

    } catch (error) {
        console.error('Error al guardar reporte:', error);
        return res.status(500).json({ message: 'Error interno al procesar la evaluación.' });
    }
}
