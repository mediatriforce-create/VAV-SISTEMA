import { NextRequest, NextResponse } from 'next/server';
import { getGoogleDriveClient } from '@/lib/google/drive';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: 'Missing file ID' }, { status: 400 });
        }

        const drive = await getGoogleDriveClient();

        // Busca os metadados para saber o mime type
        const meta = await drive.files.get({
            fileId: id,
            fields: 'mimeType, name',
        });

        const mimeType = meta.data.mimeType || 'application/octet-stream';

        // Baixa o conteúdo do arquivo
        const response = await drive.files.get(
            { fileId: id, alt: 'media' },
            { responseType: 'arraybuffer' }
        );

        const buffer = Buffer.from(response.data as ArrayBuffer);

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=86400, immutable',
                'Content-Disposition': `inline; filename="${meta.data.name}"`,
            },
        });
    } catch (error: any) {
        console.error('[Drive Image Proxy Error]', error?.message);
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
}
