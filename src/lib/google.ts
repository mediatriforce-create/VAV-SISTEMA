import { google } from 'googleapis';

// Verifica se as variáveis de ambiente necessárias existem
const getGoogleAuth = () => {
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    // Algumas chaves privadas vêm com 'escaped newlines', precisamos dar replace nelas
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
        throw new Error('As variáveis GOOGLE_SERVICE_ACCOUNT_EMAIL e GOOGLE_PRIVATE_KEY não foram definidas no .env.local');
    }

    // Escopo necessário para manipular eventos com conferência do Meet
    const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
    ];

    const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes,
    });

    return auth;
};

// Exportamos uma instância do calendar já configurada 
export const getCalendarClient = () => {
    const auth = getGoogleAuth();
    return google.calendar({ version: 'v3', auth });
};
