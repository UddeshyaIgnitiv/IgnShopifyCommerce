import ActivateClient from './ActivateClient';

export default async function ActivatePage({
    params,
}: {
    params: Promise<{ id: string; token: string }>;
}) {
    // Await the params promise to get the values
    const { id, token } = await params;
    return <ActivateClient id={id} token={token} />;
}

