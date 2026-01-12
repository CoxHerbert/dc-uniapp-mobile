import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import http from '../src/utils/http';
import MockAdapter from 'axios-mock-adapter';

let mock;
beforeEach(() => {
  mock = new MockAdapter(http);
});
afterEach(() => mock.restore());

describe('http layer', () => {
  it('should return data when code===0', async () => {
    mock.onGet('/hello').reply(200, { code: 0, data: { msg: 'ok' } });
    const res = await http.get('/hello');
    expect(res.msg).toBe('ok');
  });
});
