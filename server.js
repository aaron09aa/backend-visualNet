// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configurar OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
// Reemplaza la línea de cors:
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// prompt para el chatbot
const SYSTEM_PROMPT = `Eres el asistente virtual de VisualNet Solutions, una empresa especializada en infraestructura de redes y cableado estructurado en Panamá.

INFORMACIÓN DE LA EMPRESA:
- Nombre: VisualNet Solutions S.A.
- Servicios principales:
  * Cableado Estructurado Cat6A (certificado TIA/EIA-568)
  * Infraestructura de Racks (MDF e IDF)
  * Certificación y Pruebas con equipos Fluke
  * Documentación Técnica profesional
  * Redes Wi-Fi Empresariales
  * CCTV IP con NVR y almacenamiento
  * Mantenimiento Preventivo
  * Sistema de Puesta a Tierra (ANSI/TIA-607)

- Especialidades: Edificios residenciales, oficinas corporativas, hoteles, centros educativos
- Certificaciones: TIA/EIA-568, ISO/IEC 11801, TIA/EIA-606
- Proyectos completados: Más de 50 edificios
- Contacto: 
  * Email: info@visualnetsolutions.com
  * Teléfono: +507 6433-0634
  * Ubicación: Ciudad de Panamá, Panamá
  * Horario: Lunes-Viernes 8AM-6PM, Sábados 9AM-1PM

INSTRUCCIONES:
- Sé amigable, profesional y conciso
- Responde en español
- Si preguntan por cotización, invítalos a llenar el formulario de contacto o llamar
- Si preguntan por proyectos, menciona que pueden ver el portafolio
- Menciona que son expertos certificados en cableado estructurado
- Si no sabes algo, sé honesto y ofrece contactarlos directamente
- Mantén respuestas cortas (máximo 3-4 líneas)`;

// Ruta para el chat
app.post('/api/chat', async (req, res) => {
    try {
        const { message, conversationHistory = [] } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                error: 'El mensaje es requerido y debe ser texto'
            });
        }

        // Construir el historial de mensajes para OpenAI
        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...conversationHistory.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            })),
            { role: 'user', content: message }
        ];

        // Llamar a OpenAI
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // o 'gpt-4' si prefieres
            messages: messages,
            max_tokens: 300,
            temperature: 0.7,
        });

        const aiResponse = completion.choices[0]?.message?.content ||
            'Lo siento, no pude procesar tu solicitud.';

        res.json({
            response: aiResponse,
            success: true
        });

    } catch (error) {
        console.error('Error en el chat:', error);
        res.status(500).json({
            error: 'Error al procesar el mensaje',
            message: error.message,
            success: false
        });
    }
});

// Ruta de health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor funcionando' });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});