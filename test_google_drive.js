const { google } = require('googleapis');
const fs = require('fs');

function loadEnv() {
    const content = fs.readFileSync('.env.local', 'utf-8');
    content.split(/\r?\n/).forEach(line => {
        if (!line || line.startsWith('#')) return;
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            process.env[match[1]] = match[2].replace(/^"|"$/g, '');
        }
    });
}

async function testDriveAuth() {
    loadEnv();
    console.log('Testing Google Drive Auth...');

    console.log('Client ID length:', process.env.GOOGLE_CLIENT_ID?.length || 0);
    console.log('Refresh Token length:', process.env.GOOGLE_REFRESH_TOKEN?.length || 0);

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground'
    );

    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!refreshToken) {
        console.error('No refresh token found!');
        return;
    }

    try {
        oauth2Client.setCredentials({ refresh_token: refreshToken });

        console.log('Attempting to refresh access token...');
        const result = await oauth2Client.getAccessToken();
        console.log('Successfully acquired access token!');

        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        const res = await drive.files.list({
            pageSize: 1,
            fields: 'files(id, name)',
        });
        console.log('Successfully called Drive API. Files listed:', res.data.files?.length);
    } catch (error) {
        console.error('\n!!! AUTHENTICATION FAILED !!!\n');
        console.error('Error message:', error.message);
        if (error.response?.data) {
            console.error('Google API Error Response:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testDriveAuth();
