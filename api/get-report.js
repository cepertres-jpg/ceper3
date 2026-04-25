import jwt from 'jsonwebtoken';
import { db } from './lib/firebaseAdmin.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        // 1. Verificación de Seguridad (Token JWT)
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
        const { id } = req.query;

        if (!id) return res.status(400).json({ message: 'ID de reporte no proporcionado.' });

        // 2. Buscar datos en Firebase
        const docRef = db.collection('evaluaciones_ceper').doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) return res.status(404).json({ message: 'Reporte no encontrado.' });

        const docData = docSnap.data();

        // 3. Seguridad de Acceso: Admin o Psicólogo dueño
        if (requestUser !== 'admin') {
            const psicologoEnDB = (docData.demographics?.psicologo || '').trim().toLowerCase();
            if (psicologoEnDB !== requestUser.trim().toLowerCase()) {
                return res.status(403).json({ message: 'Acceso denegado.' });
            }
        }

        // --- 4. EL CEREBRO: PROCESAMIENTO PSICOMÉTRICO CENTRALIZADO ---
        const demo = docData.demographics || {};
        const answers = docData.answers || {};

        // Mapeo de Ítems por Estilo (Estructura oficial CEPER-III)
        const styleMapping = {
            "Paranoide": [1, 15, 29, 43, 58, 72, 86, 100, 114, 129, 143, 157],
            "Esquizoide": [2, 16, 30, 44, 59, 73, 87, 101, 115, 130, 144, 158],
            "Esquizotípico": [3, 17, 31, 45, 60, 74, 88, 102, 116, 131, 145, 159],
            "Antisocial": [4, 18, 32, 46, 61, 75, 89, 103, 117, 132, 146, 160],
            "Límite": [5, 19, 33, 47, 62, 76, 90, 104, 118, 133, 147, 161],
            "Histriónico": [6, 20, 34, 48, 63, 77, 91, 105, 119, 134, 148, 162],
            "Narcisista": [7, 21, 35, 49, 64, 78, 92, 106, 120, 135, 149, 163],
            "Evitativo": [8, 22, 36, 50, 65, 79, 93, 107, 121, 136, 150, 164],
            "Dependiente": [9, 23, 37, 51, 66, 80, 94, 108, 122, 137, 151, 165],
            "Obsesivo C.": [10, 24, 38, 52, 67, 81, 95, 109, 123, 138, 152, 166],
            "Pasivo A.": [11, 25, 39, 53, 68, 82, 96, 110, 124, 139, 153, 167],
            "Autodestructivo": [12, 26, 40, 54, 69, 83, 97, 111, 125, 140, 154, 168],
            "Depresivo": [13, 27, 41, 55, 70, 84, 98, 112, 126, 141, 155, 169],
            "Sádico": [14, 28, 42, 56, 71, 85, 99, 113, 127, 142, 156, 170]
        };

        // Tablas de Baremos de tus archivos Excel
        const norms = {
            "Colombia": {
                "Hombre": { "Paranoide": [32.6, 10.71], "Esquizoide": [33.04, 10.15], "Esquizotípico": [26.56, 11.23], "Antisocial": [27.02, 10.14], "Límite": [27.81, 11.02], "Histriónico": [34.56, 11.33], "Narcisista": [36.78, 10.56], "Evitativo": [30.12, 10.88], "Dependiente": [32.45, 10.11], "Obsesivo C.": [42.12, 11.23], "Pasivo A.": [28.56, 10.45], "Autodestructivo": [22.34, 9.88], "Depresivo": [29.67, 10.78], "Sádico": [21.56, 9.45] },
                "Mujer": { "Paranoide": [29.43, 10.4], "Esquizoide": [31.37, 10.86], "Esquizotípico": [23.1, 9.34], "Antisocial": [22.45, 9.12], "Límite": [26.12, 10.56], "Histriónico": [37.12, 11.2], "Narcisista": [34.12, 10.2], "Evitativo": [32.12, 10.4], "Dependiente": [35.12, 11.1], "Obsesivo C.": [43.45, 11.5], "Pasivo A.": [26.12, 10.1], "Autodestructivo": [21.12, 8.9], "Depresivo": [31.12, 10.5], "Sádico": [18.12, 8.5] }
            },
            "Internacional": {
                "Hombre": { "Paranoide": [32.73, 10.76], "Esquizoide": [31.16, 9.5], "Esquizotípico": [24.3, 10.23], "Antisocial": [26.12, 9.8], "Límite": [25.12, 10.1], "Histriónico": [33.12, 10.4], "Narcisista": [35.12, 10.1], "Evitativo": [29.12, 9.9], "Dependiente": [31.12, 10.0], "Obsesivo C.": [40.12, 10.8], "Pasivo A.": [27.12, 9.7], "Autodestructivo": [20.12, 8.8], "Depresivo": [28.12, 10.2], "Sádico": [20.12, 9.1] },
                "Mujer": { "Paranoide": [29.83, 9.33], "Esquizoide": [27.5, 9.45], "Esquizotípico": [23.04, 9.92], "Antisocial": [21.12, 8.5], "Límite": [24.12, 9.6], "Histriónico": [36.12, 10.8], "Narcisista": [33.12, 9.9], "Evitativo": [31.12, 10.1], "Dependiente": [34.12, 10.7], "Obsesivo C.": [41.12, 11.1], "Pasivo A.": [25.12, 9.2], "Autodestructivo": [19.12, 8.5], "Depresivo": [30.12, 10.4], "Sádico": [17.12, 8.1] }
            }
        };

        const descriptions = {
            "Paranoide": "Suspicacia y desconfianza generalizada ante las intenciones de los demás.",
            "Esquizoide": "Desapego de las relaciones sociales y restricción de la expresión emocional.",
            "Esquizotípico": "Deficiencias sociales y distorsiones cognitivas o perceptivas agudas.",
            "Antisocial": "Desprecio y violación de los derechos de los demás, impulsividad.",
            "Límite": "Inestabilidad en las relaciones, la autoimagen y los afectos.",
            "Histriónico": "Excesiva emotividad y búsqueda constante de atención.",
            "Narcisista": "Grandiosidad, necesidad de admiración y falta de empatía.",
            "Evitativo": "Inhibición social, sentimientos de inadecuación e hipersensibilidad.",
            "Dependiente": "Necesidad excesiva de que se ocupen de uno, sumisión y temor a la separación.",
            "Obsesivo C.": "Preocupación por el orden, el perfeccionismo y el control.",
            "Pasivo A.": "Resistencia pasiva a las demandas sociales y laborales normales.",
            "Autodestructivo": "Comportamientos que sabotean las propias posibilidades de éxito o bienestar.",
            "Depresivo": "Patrón persistente de pensamientos y comportamientos tristes o melancólicos.",
            "Sádico": "Uso de comportamientos crueles o humillantes para ejercer dominio."
        };

        // Identificar Baremos
        const isCol = demo.pais === 'Colombia';
        const normName = isCol ? "Colombiana" : "Internacional (España)";
        const genderKey = (demo.genero === 'Hombre' || demo.genero === 'Masculino') ? 'Hombre' : 'Mujer';
        const table = norms[isCol ? 'Colombia' : 'Internacional'][genderKey];

        // Procesar Cálculos T
        let scores = [];
        for (const style in styleMapping) {
            const raw = styleMapping[style].reduce((acc, idx) => acc + parseInt(answers[`q${idx}`] || 0), 0);
            const [mean, sd] = table[style] || [30, 10];
            const t = Math.round(50 + 10 * ((raw - mean) / sd));
            scores.push({ style, raw, t, description: descriptions[style] });
        }

        // Obtener Top 4 para el análisis cualitativo
        const top4 = [...scores].sort((a, b) => b.t - a.t).slice(0, 4);

        // Generar Conclusión Técnica
        const picos = top4.filter(s => s.t >= 60);
        const pNombre = (demo.nombres || 'El paciente').split(' ')[0];
        let conclusion = `${pNombre} presenta un perfil con predominancia en los estilos ${top4[0].style} y ${top4[1].style}. `;
        if(picos.length > 0) {
            conclusion += `Existen ${picos.length} rasgos con significancia clínica (T >= 60) que sugieren patrones de comportamiento con impacto en su adaptación diaria.`;
        } else {
            conclusion += "No se observan elevaciones clínicas significativas; el perfil se encuentra dentro de la norma estadística esperada.";
        }

        // Retorno de datos PROCESADOS
        return res.status(200).json({ 
            success: true, 
            data: { 
                id: docSnap.id,
                demographics: demo,
                calculated: {
                    scores,
                    top4,
                    normUsed: normName,
                    conclusion,
                    recommendations: [
                        `Contrastar los rasgos de ${top4[0].style} con el motivo de consulta inicial del paciente.`,
                        `Explorar la flexibilidad de afrontamiento ante situaciones de estrés elevado.`,
                        `Realizar seguimiento clínico para evaluar la estabilidad de los rasgos identificados.`
                    ]
                }
            } 
        });

    } catch (error) {
        console.error('Error en API get-report Cerebro:', error);
        return res.status(500).json({ message: 'Error al procesar el análisis clínico.' });
    }
}
