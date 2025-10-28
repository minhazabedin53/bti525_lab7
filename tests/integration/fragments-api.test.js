import request from 'supertest';
import app from '../../src/app.js';

const auth = () => ({
  Authorization: 'Basic ' + Buffer.from('user@example.com:pass').toString('base64'),
});

describe('Fragments API (A1 scope)', () => {
  test('unauthorized requests get 401 with error shape', async () => {
    const res = await request(app).get('/v1/fragments');
    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(401);
  });

  test('health check at /v1/ works', async () => {
    const res = await request(app).get('/v1/');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('version');
  });

  test('POST text/plain creates fragment and sets Location header', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .set(auth())
      .set('Content-Type', 'text/plain')
      .send('Hello A1');
    expect(res.status).toBe(201);
    expect(res.headers).toHaveProperty('location');
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toMatchObject({
      id: expect.any(String),
      ownerId: expect.any(String),
      type: 'text/plain',
      size: 8,
    });
  });

  test('unsupported type gets 415 error response', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .set(auth())
      .set('Content-Type', 'application/pdf')
      .send('x');
    expect(res.status).toBe(415);
    expect(res.body.status).toBe('error');
  });

  test('list, get, info, put (same type), delete', async () => {
    const create = await request(app)
      .post('/v1/fragments')
      .set(auth())
      .set('Content-Type', 'text/plain')
      .send('abc');
    const id = create.body.fragment.id;

    // list ids contains id
    const list = await request(app).get('/v1/fragments').set(auth());
    expect(list.status).toBe(200);
    expect(list.body.fragments).toContain(id);

    // expand=1 returns metadata array
    const expand = await request(app).get('/v1/fragments?expand=1').set(auth());
    expect(expand.status).toBe(200);
    expect(Array.isArray(expand.body.fragments)).toBe(true);
    expect(expand.body.fragments[0]).toHaveProperty('id');

    // get raw data
    const getRaw = await request(app).get(`/v1/fragments/${id}`).set(auth());
    expect(getRaw.status).toBe(200);
    expect(getRaw.headers['content-type']).toMatch(/^text\/plain/);
    expect(getRaw.text).toBe('abc');

    // info
    const info = await request(app).get(`/v1/fragments/${id}/info`).set(auth());
    expect(info.status).toBe(200);
    expect(info.body.fragment).toHaveProperty('id', id);

    // put same type
    const putSame = await request(app)
      .put(`/v1/fragments/${id}`)
      .set(auth())
      .set('Content-Type', 'text/plain')
      .send('updated');
    expect(putSame.status).toBe(200);
    expect(putSame.body.fragment.size).toBe(7);

    // put mismatch type
    const putMismatch = await request(app)
      .put(`/v1/fragments/${id}`)
      .set(auth())
      .set('Content-Type', 'text/markdown')
      .send('# nope');
    expect(putMismatch.status).toBe(400);

    // delete
    const del = await request(app).delete(`/v1/fragments/${id}`).set(auth());
    expect(del.status).toBe(200);
    expect(del.body.status).toBe('ok');

    // get after delete -> 404
    const get404 = await request(app).get(`/v1/fragments/${id}`).set(auth());
    expect(get404.status).toBe(404);
  });
});