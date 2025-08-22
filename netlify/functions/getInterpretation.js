// Este código se ejecuta en los servidores de Netlify, no en el navegador del usuario.

// Importar una librería para hacer llamadas a la API (Netlify la instala automáticamente)
const fetch = require('node-fetch');

// La función principal que Netlify ejecutará
exports.handler = async function(event, context) {
    // 1. Obtener los datos enviados desde la página HTML
    const { question, mostFrequent, leastFrequent } = JSON.parse(event.body);

    // 2. Obtener tu clave de API de Gemini desde las variables de entorno seguras de Netlify
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "La clave de API no está configurada en el servidor." })
        };
    }

    // 3. Construir el prompt para Gemini
    const prompt = `Actúa como un guía espiritual sabio y cálido, experto en simbolismo cabalístico (Gematría). Un usuario ha realizado una consulta a un oráculo numérico y necesita tu interpretación.

La intención del usuario es: "${question}"

El oráculo ha revelado los siguientes números clave:
- El Mensaje (3 más frecuentes): ${mostFrequent.join(', ')}
- El Recordatorio (3 menos frecuentes): ${leastFrequent.join(', ')}

Ahora, por favor, genera la interpretación completa usando ESTRICTAMENTE los siguientes marcadores para separar las secciones:

### SÍNTESIS ###
(Aquí escribe un párrafo resumen que condense la idea principal del mensaje, el recordatorio y la reflexión final.)

### DESGLOSE ###
(Aquí escribe el desglose completo de "El Mensaje" y "El Recordatorio" con los 3 números de cada uno, sus roles de Alma/Cuerpo/Fuerza Creadora, y ejemplos del día a día.)

### CONCLUSIÓN ###
(Aquí escribe un párrafo final de conclusión, cálido, denso y empoderador.)

Formatea toda tu respuesta con el markdown de WhatsApp (*negritas* y _cursivas_).`;

    // 4. Hacer la llamada segura a la API de Gemini
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
    
    try {
        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text();
            console.error("Error de la API de Gemini:", errorBody);
            throw new Error(`La API de Gemini respondió con un error: ${geminiResponse.statusText}`);
        }

        const geminiData = await geminiResponse.json();
        const interpretation = geminiData.candidates[0].content.parts[0].text;

        // 5. Devolver la interpretación a la página HTML
        return {
            statusCode: 200,
            body: JSON.stringify({ interpretation: interpretation })
        };

    } catch (error) {
        console.error("Error en la función serverless:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Hubo un problema al procesar la solicitud: ${error.message}` })
        };
    }
};
