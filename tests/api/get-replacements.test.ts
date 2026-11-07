import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockReq, mockRes, fakeFetchResponse, stubFetch } from '../helpers/http';

type Handler = (req: unknown, res: unknown) => Promise<unknown>;

// Este endpoint lee la clave al cargarse, así que hay que fijar el entorno antes de importarlo.
async function loadHandler(key: string | null = 'clave-falsa-de-prueba'): Promise<Handler> {
  vi.resetModules();
  if (key === null) vi.stubEnv('OPENAI_API_KEY', '');
  else vi.stubEnv('OPENAI_API_KEY', key);
  return (await import('../../api/get-replacements')).default as unknown as Handler;
}

let fetchMock: ReturnType<typeof stubFetch>;

beforeEach(() => {
  fetchMock = stubFetch();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const openaiReply = (content: string) =>
  fakeFetchResponse({ choices: [{ message: { content } }] });

describe('POST /api/get-replacements', () => {
  it('rechaza métodos distintos de POST con 405', async () => {
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({ method: 'GET' }), res);
    expect(res.statusCode).toBe(405);
  });

  it('devuelve 500 si no hay clave de OpenAI configurada', async () => {
    const handler = await loadHandler(null);
    const res = mockRes();
    await handler(mockReq({ body: { prompt: 'x' } }), res);
    expect(res.statusCode).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('devuelve 400 si falta el prompt o no es texto', async () => {
    const handler = await loadHandler();
    for (const body of [{}, { prompt: '' }, { prompt: 42 }, { prompt: null }]) {
      const res = mockRes();
      await handler(mockReq({ body }), res);
      expect(res.statusCode).toBe(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('devuelve las recomendaciones cuando OpenAI responde bien', async () => {
    const recs = [{ title: 'Nightcall', artist: 'Kavinsky', reason: 'Clásico' }];
    fetchMock.mockResolvedValue(openaiReply(JSON.stringify({ recommendations: recs })));
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({ body: { prompt: 'Necesito 1 canción' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ recommendations: recs });
  });

  it('llama a la API de OpenAI con la clave del servidor y el prompt del usuario', async () => {
    fetchMock.mockResolvedValue(openaiReply(JSON.stringify({ recommendations: [] })));
    const handler = await loadHandler();
    await handler(mockReq({ body: { prompt: 'Mi prompt' } }), mockRes());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect(init.headers.Authorization).toBe('Bearer clave-falsa-de-prueba');
    expect(JSON.parse(init.body).messages.at(-1)).toEqual({ role: 'user', content: 'Mi prompt' });
  });

  it('devuelve 500 si OpenAI responde con error HTTP', async () => {
    fetchMock.mockResolvedValue(fakeFetchResponse('fallo', false, 429));
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({ body: { prompt: 'x' } }), res);
    expect(res.statusCode).toBe(500);
    expect(JSON.stringify(res.body)).toContain('429');
  });

  it('devuelve 500 si OpenAI no devuelve contenido', async () => {
    fetchMock.mockResolvedValue(fakeFetchResponse({ choices: [] }));
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({ body: { prompt: 'x' } }), res);
    expect(res.statusCode).toBe(500);
  });

  it('devuelve 500 si el contenido no es JSON', async () => {
    fetchMock.mockResolvedValue(openaiReply('Claro, aquí tienes: Nightcall'));
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({ body: { prompt: 'x' } }), res);
    expect(res.statusCode).toBe(500);
  });

  it('devuelve 500 si el JSON no trae la lista "recommendations"', async () => {
    fetchMock.mockResolvedValue(openaiReply(JSON.stringify({ songs: [] })));
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({ body: { prompt: 'x' } }), res);
    expect(res.statusCode).toBe(500);
    expect(JSON.stringify(res.body)).toMatch(/Invalid response format/);
  });

  it('nunca incluye la clave de OpenAI en la respuesta', async () => {
    fetchMock.mockRejectedValue(new Error('sin red'));
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({ body: { prompt: 'x' } }), res);
    expect(JSON.stringify(res.body)).not.toContain('clave-falsa-de-prueba');
  });
});
