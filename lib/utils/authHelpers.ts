export async function generateState(): Promise<string> {
    const timestamp = Date.now().toString();
    const randomString = Math.random().toString(36).substring(2);
    return timestamp + randomString;
}

export async function generateNonce(length: number): Promise<string> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let nonce = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        nonce += characters.charAt(randomIndex);
    }

    return nonce;
}
