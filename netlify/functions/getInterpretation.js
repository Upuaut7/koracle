// Este código se ejecuta en los servidores de Netlify, no en el navegador del usuario.

// Importar una librería para hacer llamadas a la API (Netlify la instala automáticamente)
// const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    // Chivato 1: La función ha empezado
    console.log("Function invoked. HTTP Method:", event.httpMethod);

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // Chivato 2: ¿Qué hay en el body?
        console.log("Request body received:", event.body);
        
        if (!event.body) {
            throw new Error("Request body is empty.");
        }

        const { question, mostFrequent, leastFrequent } = JSON.parse(event.body);
        
        // Chivato 3: Datos parseados correctamente
        console.log("Parsed data:", { question, mostFrequent, leastFrequent });
        
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            console.error("CRITICAL: GEMINI_API_KEY is not configured in Netlify.");
            throw new Error("API key not configured.");
        }

        // Chivato 4: La clave de API fue encontrada
        console.log("GEMINI_API_KEY found. Preparing prompt.");

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

       const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
        
        // Chivato 5: Llamando a la API de Gemini
        console.log("Calling Gemini API...");
        
        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        
        // Chivato 6: Respuesta recibida de Gemini
        console.log("Gemini API response status:", geminiResponse.status);

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text();
            console.error("Gemini API Error Body:", errorBody);
            throw new Error(`Gemini API responded with status: ${geminiResponse.status}`);
        }

        const geminiData = await geminiResponse.json();
        
        if (!geminiData.candidates || geminiData.candidates.length === 0) {
             console.error("Gemini response blocked or empty:", geminiData);
             throw new Error("La respuesta de la API de Gemini no contiene candidatos. Puede haber sido bloqueada por seguridad.");
        }
        
        const interpretation = geminiData.candidates[0].content.parts[0].text;

        // Chivato 7: Éxito
        console.log("Successfully returning interpretation to client.");

        return {
            statusCode: 200,
            body: JSON.stringify({ interpretation: interpretation })
        };

    } catch (error) {
        // Chivato 8: Error capturado
        console.error("CRITICAL ERROR in function handler:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const payload = JSON.parse(event.body);
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            return { statusCode: 500, body: JSON.stringify({ error: "API key not configured." }) };
        }

        let requestBody;

        // Decidir qué prompt construir basado en el tipo de oráculo
        if (payload.type === 'numeric') {
            const { question, mostFrequent, leastFrequent } = payload;
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
            
            requestBody = { contents: [{ parts: [{ text: prompt }] }] };

        } else if (payload.type === 'tarot') {
            const { conversation } = payload;
            requestBody = {
                contents: conversation,
                generationConfig: {
                    "maxOutputTokens": 2048,
                    "temperature": 0.95,
                    "topP": 0.95,
                    "topK": 40
                }
            };
        } else {
            return { statusCode: 400, body: JSON.stringify({ error: "Tipo de oráculo no especificado o inválido." }) };
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GEMINI_API_KEY}`;
        
        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text();
            throw new Error(`La API de Gemini respondió con un error: ${errorBody}`);
        }

        const geminiData = await geminiResponse.json();
        
        if (!geminiData.candidates || geminiData.candidates.length === 0) {
             throw new Error("La respuesta de la API de Gemini no contiene candidatos.");
        }
        
        const interpretation = geminiData.candidates[0].content.parts[0].text;

        return {
            statusCode: 200,
            body: JSON.stringify({ interpretation: interpretation })
        };

    } catch (error) {
        console.error("Serverless function error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
