/**
 * Extrai mensagem legivel de qualquer valor lancado.
 * Usar em catch (e: unknown) em vez de catch (e: any).
 */
export function getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object' && 'message' in err) {
        const m = (err as { message?: unknown }).message;
        if (typeof m === 'string') return m;
    }
    return 'Erro desconhecido';
}

/** Retorna o digest do error (Next.js usa pra DYNAMIC_SERVER_USAGE etc). */
export function getErrorDigest(err: unknown): string | undefined {
    if (err && typeof err === 'object' && 'digest' in err) {
        const d = (err as { digest?: unknown }).digest;
        if (typeof d === 'string') return d;
    }
    return undefined;
}
