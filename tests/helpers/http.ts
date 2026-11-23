// Peticiones y respuestas simuladas para probar los endpoints de /api sin red.
import { vi } from 'vitest';

export type MockRes = {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
  ended: boolean;
  setHeader: (k: string, v: string) => MockRes;
  status: (code: number) => MockRes;
  json: (data: unknown) => MockRes;
  send: (data: unknown) => MockRes;
  end: () => MockRes;
};

export function mockRes(): MockRes {
  const res: MockRes = {
    statusCode: 200,
    body: undefined,
    headers: {},
    ended: false,
    setHeader(k, v) {
      res.headers[k] = v;
      return res;
    },
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(data) {
      res.body = data;
      return res;
    },
    send(data) {
      res.body = data;
      return res;
    },
    end() {
      res.ended = true;
      return res;
    },
  };
  return res;
}

export function mockReq(init: {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
} = {}) {
  return {
    method: init.method ?? 'POST',
    body: init.body,
    headers: init.headers ?? {},
  };
}

/** Respuesta falsa de fetch con la forma mínima que usan los endpoints. */
export function fakeFetchResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  };
}

/** Instala un fetch falso y lo devuelve para poder inspeccionar las llamadas. */
export function stubFetch() {
  const fn = vi.fn();
  vi.stubGlobal('fetch', fn);
  return fn;
}
