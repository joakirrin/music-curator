import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockReq, mockRes, fakeFetchResponse, stubFetch } from '../helpers/http';

type Handler = (req: unknown, res: unknown) => Promise<unknown>;

// Este endpoint lee las claves al cargarse, así que hay que fijar el entorno antes de importarlo.
async function loadHandler(opts: { telegram?: boolean; resend?: boolean } = {}): Promise<Handler> {
  vi.resetModules();
  vi.stubEnv('TELEGRAM_BOT_TOKEN', opts.telegram ? 'token-falso' : '');
  vi.stubEnv('TELEGRAM_CHAT_ID', opts.telegram ? '123' : '');
  vi.stubEnv('RESEND_API_KEY', opts.resend ? 'resend-falso' : '');
  return (await import('../../api/beta-request')).default as unknown as Handler;
}

let fetchMock: ReturnType<typeof stubFetch>;

beforeEach(() => {
  fetchMock = stubFetch();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const body = { email: 'amigo@ejemplo.test', name: 'Amigo', timestamp: '2025-01-01T10:00:00.000Z' };

describe('POST /api/beta-request', () => {
  it('rechaza métodos distintos de POST con 405', async () => {
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({ method: 'GET' }), res);
    expect(res.statusCode).toBe(405);
  });

  it('devuelve 400 si falta el correo o el nombre', async () => {
    const handler = await loadHandler({ telegram: true, resend: true });
    for (const incomplete of [{ name: 'Amigo' }, { email: 'a@b.test' }, {}]) {
      const res = mockRes();
      await handler(mockReq({ body: incomplete }), res);
      expect(res.statusCode).toBe(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('avisa por Telegram y por correo cuando ambos están configurados', async () => {
    fetchMock.mockResolvedValue(fakeFetchResponse({}));
    const handler = await loadHandler({ telegram: true, resend: true });
    const res = mockRes();
    await handler(mockReq({ body }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true, notifications: { telegram: true, email: true } });
    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => u.startsWith('https://api.telegram.org/bot'))).toBe(true);
    expect(urls).toContain('https://api.resend.com/emails');
  });

  it('acepta la solicitud aunque no haya ningún canal configurado, con aviso', async () => {
    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({ body }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      notifications: { telegram: false, email: false },
      warning: expect.any(String),
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('si Telegram falla pero el correo funciona, no muestra aviso de retraso', async () => {
    fetchMock.mockImplementation(async (url: string) =>
      String(url).includes('telegram') ? fakeFetchResponse({}, false, 500) : fakeFetchResponse({})
    );
    const handler = await loadHandler({ telegram: true, resend: true });
    const res = mockRes();
    await handler(mockReq({ body }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ notifications: { telegram: false, email: true } });
    expect((res.body as Record<string, unknown>).warning).toBeUndefined();
  });

  it('si fallan las dos vías, aun así acepta la solicitud y avisa del posible retraso', async () => {
    fetchMock.mockRejectedValue(new Error('sin red'));
    const handler = await loadHandler({ telegram: true, resend: true });
    const res = mockRes();
    await handler(mockReq({ body }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ notifications: { telegram: false, email: false } });
    expect((res.body as Record<string, unknown>).warning).toBeDefined();
  });
});
