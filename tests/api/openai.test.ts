import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockReq, mockRes } from '../helpers/http';

// Sustituye el SDK de OpenAI para no hacer llamadas reales ni gastar saldo.
const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));
vi.mock('openai', () => ({
  default: class {
    chat = { completions: { create: createMock } };
  },
}));

import handler from '../../api/openai';

beforeEach(() => {
  createMock.mockReset();
  vi.stubEnv('OPENAI_API_KEY', 'clave-falsa-de-prueba');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const messages = [{ role: 'user', content: 'Dame 5 canciones synthwave' }];

describe('POST /api/openai', () => {
  it('rechaza métodos distintos de POST con 405 e indica cuál se permite', async () => {
    for (const method of ['GET', 'PUT', 'DELETE']) {
      const res = mockRes();
      await handler(mockReq({ method }), res);
      expect(res.statusCode).toBe(405);
      expect(res.headers['Allow']).toBe('POST');
    }
  });

  it('devuelve 500 si el servidor no tiene la clave de OpenAI', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    const res = mockRes();
    await handler(mockReq({ body: { messages } }), res);
    expect(res.statusCode).toBe(500);
    expect(String(res.body)).toMatch(/OPENAI_API_KEY/);
    expect(createMock).not.toHaveBeenCalled();
  });

  it('devuelve 400 si falta la lista de mensajes', async () => {
    const res = mockRes();
    await handler(mockReq({ body: {} }), res);
    expect(res.statusCode).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it('devuelve 400 si "messages" no es una lista', async () => {
    const res = mockRes();
    await handler(mockReq({ body: { messages: 'hola' } }), res);
    expect(res.statusCode).toBe(400);
  });

  it('devuelve 400 si no llega ningún cuerpo', async () => {
    const res = mockRes();
    await handler(mockReq({ body: undefined }), res);
    expect(res.statusCode).toBe(400);
  });

  it('envía los mensajes a OpenAI y devuelve el contenido con 200', async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: 'Hola, aquí tienes' } }] });
    const res = mockRes();
    await handler(mockReq({ body: { messages } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ content: 'Hola, aquí tienes' });
    expect(createMock).toHaveBeenCalledOnce();
    expect(createMock.mock.calls[0][0]).toMatchObject({ messages });
  });

  it('devuelve 502 si OpenAI responde sin contenido', async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: '' } }] });
    const res = mockRes();
    await handler(mockReq({ body: { messages } }), res);
    expect(res.statusCode).toBe(502);
  });

  it('devuelve 502 si OpenAI responde sin opciones', async () => {
    createMock.mockResolvedValue({ choices: [] });
    const res = mockRes();
    await handler(mockReq({ body: { messages } }), res);
    expect(res.statusCode).toBe(502);
  });

  it('devuelve 500 con el motivo si falla la llamada a OpenAI', async () => {
    createMock.mockRejectedValue(new Error('Rate limit alcanzado'));
    const res = mockRes();
    await handler(mockReq({ body: { messages } }), res);
    expect(res.statusCode).toBe(500);
    expect(String(res.body)).toContain('Rate limit alcanzado');
  });

  it('nunca incluye la clave de OpenAI en la respuesta', async () => {
    createMock.mockRejectedValue(new Error('fallo'));
    const res = mockRes();
    await handler(mockReq({ body: { messages } }), res);
    expect(JSON.stringify(res.body)).not.toContain('clave-falsa-de-prueba');
  });

  // PENDIENTE DE DECIDIR: hoy cualquiera que conozca la URL puede usar el saldo de OpenAI.
  it.todo('exige algún tipo de autenticación o límite de uso por visitante');

  describe('filtro de origen', () => {
    it('rechaza con 403 una llamada sin Origin ni Referer, sin llamar a OpenAI', async () => {
      const res = mockRes();
      await handler(mockReq({ body: { messages }, headers: {} }), res);
      expect(res.statusCode).toBe(403);
      expect(createMock).not.toHaveBeenCalled();
    });

    it('rechaza con 403 una llamada desde otra web', async () => {
      const res = mockRes();
      await handler(mockReq({ body: { messages }, headers: { origin: 'https://evil.example.com' } }), res);
      expect(res.statusCode).toBe(403);
      expect(createMock).not.toHaveBeenCalled();
    });

    it('rechaza dominios que solo se parecen (foneamusic.com.evil.com)', async () => {
      const res = mockRes();
      await handler(mockReq({ body: { messages }, headers: { origin: 'https://foneamusic.com.evil.com' } }), res);
      expect(res.statusCode).toBe(403);
    });

    it('acepta la dirección de Vercel y el Referer como alternativa', async () => {
      createMock.mockResolvedValue({ choices: [{ message: { content: 'ok' } }] });
      const res = mockRes();
      await handler(mockReq({ body: { messages }, headers: { referer: 'https://music-curator-self.vercel.app/' } }), res);
      expect(res.statusCode).not.toBe(403);
      expect(createMock).toHaveBeenCalled();
    });
  });
});
