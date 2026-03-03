import { google } from 'googleapis';

export async function getGoogleDriveClient() {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        // Redirect URI doesn't matter for offline flow after initial token generation
        'https://developers.google.com/oauthplayground'
    );

    // Hardcode the refresh token we acquired from the environment
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!refreshToken) {
        throw new Error('GOOGLE_REFRESH_TOKEN is not defined in environment variables.');
    }

    // Set the credentials securely
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    // Initialize the Drive API client (v3 is standard)
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    return drive;
}
