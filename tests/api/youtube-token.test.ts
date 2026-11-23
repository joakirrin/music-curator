import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockReq, mockRes, fakeFetchResponse, stubFetch } from '../helpers/http';

type Handler = (req: unknown, res: unknown) => Promise<unknown>;

// Este endpoint lee las claves al cargarse, así que hay que fijar el entorno antes de importarlo.
async function loadHandler(env: { id?: string; secret?: string } = {}): Promise<Handler> {
  vi.resetModules();
  vi.stubEnv('YOUTUBE_CLIENT_ID', env.id ?? 'id-falso');
  vi.stubEnv('YOUTUBE_CLIENT_SECRET', env.secret ?? 'secreto-falso-de-prueba');
  return (await import('../../api/youtube-token')).default as unknown as Handler;
}

let fetchMock: ReturnType<typeof stubFetch>;

beforeEach(() => {
  fetchMock = stubFetch();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const exchangeBody = {
  grant_type: 'authorization_code',
  code: 'codigo',
  redirect_uri: 'https://ejemplo.test/callback/youtube',
  code_verifier: 'verificador',
};

describe('/api/youtube-token — protocolo básico', () => {
  it('responde a la petición previa (OPTIONS) con 200 y cabeceras CORS', async () => {
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({ method: 'OPTIONS', headers: { origin: 'https://foneamusic.com' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.ended).toBe(true);
    expect(res.headers['Access-Control-Allow-Origin']).toBe('https://foneamusic.com');
    expect(res.headers['Access-Control-Allow-Methods']).toContain('POST');
  });

  it('rechaza GET con 405', async () => {
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({ method: 'GET' }), res);
    expect(res.statusCode).toBe(405);
  });

  it('devuelve 500 si faltan las credenciales de Google en el servidor', async () => {
    const handler = await loadHandler({ id: '', secret: '' });
    const res = mockRes();
    await handler(mockReq({ body: exchangeBody }), res);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Server configuration error' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('devuelve 400 con un grant_type desconocido o ausente', async () => {
    const handler = await loadHandler();
    for (const body of [{}, { grant_type: 'password' }]) {
      const res = mockRes();
      await handler(mockReq({ body }), res);
      expect(res.statusCode).toBe(400);
      expect(res.body).toMatchObject({ error: 'invalid_request' });
    }
  });
});

describe('/api/youtube-token — intercambio de código', () => {
  it('devuelve 400 si falta code, redirect_uri o code_verifier', async () => {
    const handler = await loadHandler();
    for (const missing of ['code', 'redirect_uri', 'code_verifier']) {
      const body: Record<string, string> = { ...exchangeBody };
      delete body[missing];
      const res = mockRes();
      await handler(mockReq({ body }), res);
      expect(res.statusCode).toBe(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('pide los tokens a Google con las credenciales del servidor y devuelve la respuesta', async () => {
    const tokens = { access_token: 'acceso', refresh_token: 'refresco', expires_in: 3600 };
    fetchMock.mockResolvedValue(fakeFetchResponse(tokens));
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({ body: exchangeBody }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(tokens);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://oauth2.googleapis.com/token');
    const sent = init.body as URLSearchParams;
    expect(sent.get('grant_type')).toBe('authorization_code');
    expect(sent.get('client_id')).toBe('id-falso');
    expect(sent.get('client_secret')).toBe('secreto-falso-de-prueba');
    expect(sent.get('code')).toBe('codigo');
    expect(sent.get('code_verifier')).toBe('verificador');
  });

  it('reenvía el error de Google con su mismo código HTTP', async () => {
    fetchMock.mockResolvedValue(fakeFetchResponse({ error: 'invalid_grant' }, false, 400));
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({ body: exchangeBody }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'invalid_grant' });
  });

  it('devuelve 500 si la llamada a Google falla, sin filtrar el secreto', async () => {
    fetchMock.mockRejectedValue(new Error('sin red'));
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({ body: exchangeBody }), res);
    expect(res.statusCode).toBe(500);
    expect(res.body).toMatchObject({ error: 'server_error' });
    expect(JSON.stringify(res.body)).not.toContain('secreto-falso-de-prueba');
  });
});

describe('/api/youtube-token — renovación de token', () => {
  it('devuelve 400 si falta refresh_token', async () => {
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({ body: { grant_type: 'refresh_token' } }), res);
    expect(res.statusCode).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('renueva el token con Google y devuelve la respuesta', async () => {
    const tokens = { access_token: 'nuevo', expires_in: 3600 };
    fetchMock.mockResolvedValue(fakeFetchResponse(tokens));
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({ body: { grant_type: 'refresh_token', refresh_token: 'refresco' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(tokens);
    const sent = fetchMock.mock.calls[0][1].body as URLSearchParams;
    expect(sent.get('grant_type')).toBe('refresh_token');
    expect(sent.get('refresh_token')).toBe('refresco');
  });

  it('reenvía el error cuando el token de renovación ya no vale', async () => {
    fetchMock.mockResolvedValue(fakeFetchResponse({ error: 'invalid_grant' }, false, 400));
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({ body: { grant_type: 'refresh_token', refresh_token: 'caducado' } }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'invalid_grant' });
  });
});
