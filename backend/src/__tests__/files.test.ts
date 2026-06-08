import request from 'supertest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import app from '../index';

describe('POST /api/files/read', () => {
  let tmpFile: string;

  beforeAll(async () => {
    tmpFile = path.join(os.tmpdir(), `jsx-viewer-test-${Date.now()}.jsx`);
    await fs.writeFile(tmpFile, 'export default () => null;', 'utf8');
  });

  afterAll(async () => {
    await fs.unlink(tmpFile).catch(() => {});
  });

  it('returns 400 when path is missing', async () => {
    const res = await request(app).post('/api/files/read').send({});
    expect(res.status).toBe(400);
  });

  it('returns 403 for path with ..', async () => {
    const res = await request(app)
      .post('/api/files/read')
      .send({ path: '/tmp/../etc/passwd' });
    expect(res.status).toBe(403);
  });

  it('returns 403 for relative path', async () => {
    const res = await request(app)
      .post('/api/files/read')
      .send({ path: 'relative/path.jsx' });
    expect(res.status).toBe(403);
  });

  it('returns 404 for non-existent file', async () => {
    const res = await request(app)
      .post('/api/files/read')
      .send({ path: '/tmp/definitely-does-not-exist-jsx-viewer.jsx' });
    expect(res.status).toBe(404);
  });

  it('returns 200 with content for existing file', async () => {
    const res = await request(app).post('/api/files/read').send({ path: tmpFile });
    expect(res.status).toBe(200);
    expect(res.body.content).toBe('export default () => null;');
  });
});
