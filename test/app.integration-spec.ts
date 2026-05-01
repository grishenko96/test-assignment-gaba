import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { validationExceptionFactory } from '../src/common/validation/validation-exception.factory';
import { PrismaExceptionFilter } from '../src/prisma/prisma-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

type PromoCodeResponse = {
  id: string;
  code: string;
  discountPercent: number;
  activationLimit: number;
  activationsCount: number;
};

type ActivationResponse = {
  id: string;
  email: string;
  promoCodeId: string;
};

type ValidationErrorBody = {
  code: string;
  message: string;
  errors: Array<{
    field: string;
    messages: string[];
  }>;
};

function parseBody<T>(response: request.Response): T {
  return JSON.parse(response.text) as T;
}

async function createPromocode(
  app: INestApplication<App>,
  overrides: Partial<{
    code: string;
    discountPercent: number;
    activationLimit: number;
    expiresAt: string;
  }> = {},
) {
  const response = await request(app.getHttpServer())
    .post('/promocodes')
    .send({
      code: 'SALE10',
      discountPercent: 10,
      activationLimit: 2,
      expiresAt: '2099-12-31T23:59:59.000Z',
      ...overrides,
    })
    .expect(201);

  return parseBody<PromoCodeResponse>(response);
}

describe('Promocodes API (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        exceptionFactory: validationExceptionFactory,
      }),
    );
    app.useGlobalFilters(new PrismaExceptionFilter());

    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.activation.deleteMany();
    await prisma.promoCode.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates, lists, reads, updates, activates, and deletes promocode', async () => {
    const httpServer = app.getHttpServer();

    const created = await request(httpServer)
      .post('/promocodes')
      .send({
        code: ' sale10 ',
        discountPercent: 10,
        activationLimit: 2,
        expiresAt: '2099-12-31T23:59:59.000Z',
      })
      .expect(201);
    const createdBody = parseBody<PromoCodeResponse>(created);

    expect(createdBody).toMatchObject({
      code: 'SALE10',
      discountPercent: 10,
      activationLimit: 2,
      activationsCount: 0,
    });

    await request(httpServer)
      .get('/promocodes')
      .expect(200)
      .expect((response) => {
        const body = parseBody<PromoCodeResponse[]>(response);

        expect(body).toHaveLength(1);
        expect(body[0]).toMatchObject({ code: 'SALE10' });
      });

    await request(httpServer)
      .get('/promocodes/sale10')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({ code: 'SALE10' });
      });

    await request(httpServer)
      .patch('/promocodes/sale10')
      .send({
        discountPercent: 20,
        activationLimit: 1,
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          code: 'SALE10',
          discountPercent: 20,
          activationLimit: 1,
        });
      });

    await request(httpServer)
      .post('/promocodes/sale10/activate')
      .send({ email: 'USER@example.com' })
      .expect(201)
      .expect((response) => {
        const body = parseBody<ActivationResponse>(response);

        expect(body).toMatchObject({
          email: 'user@example.com',
          promoCodeId: createdBody.id,
        });
      });

    await request(httpServer)
      .delete('/promocodes/sale10')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({ code: 'SALE10' });
      });
  });

  it('rejects duplicate promocode code using real unique index', async () => {
    await createPromocode(app);

    await request(app.getHttpServer())
      .post('/promocodes')
      .send({
        code: 'SALE10',
        discountPercent: 15,
        activationLimit: 1,
        expiresAt: '2099-12-31T23:59:59.000Z',
      })
      .expect(409)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          code: 'PROMOCODE_CODE_ALREADY_EXISTS',
          fields: ['code'],
        });
      });
  });

  it('rejects repeated activation by the same email using real unique index', async () => {
    await createPromocode(app);
    const httpServer = app.getHttpServer();

    await request(httpServer)
      .post('/promocodes/sale10/activate')
      .send({ email: 'user@example.com' })
      .expect(201);

    await request(httpServer)
      .post('/promocodes/sale10/activate')
      .send({ email: 'user@example.com' })
      .expect(409)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          code: 'PROMOCODE_ALREADY_ACTIVATED',
          fields: ['email'],
        });
      });
  });

  it('rejects activation when limit is reached and rolls back activation insert', async () => {
    await createPromocode(app, { activationLimit: 1 });
    const httpServer = app.getHttpServer();

    await request(httpServer)
      .post('/promocodes/sale10/activate')
      .send({ email: 'first@example.com' })
      .expect(201);

    await request(httpServer)
      .post('/promocodes/sale10/activate')
      .send({ email: 'second@example.com' })
      .expect(410)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          code: 'PROMOCODE_NOT_ACTIVATABLE',
        });
      });

    await expect(prisma.activation.count()).resolves.toBe(1);
    await expect(
      prisma.promoCode.findUniqueOrThrow({ where: { code: 'SALE10' } }),
    ).resolves.toMatchObject({ activationsCount: 1 });
  });

  it('rejects activation limit update below current usage', async () => {
    await createPromocode(app, { activationLimit: 3 });
    const httpServer = app.getHttpServer();

    await request(httpServer)
      .post('/promocodes/sale10/activate')
      .send({ email: 'first@example.com' })
      .expect(201);

    await request(httpServer)
      .post('/promocodes/sale10/activate')
      .send({ email: 'second@example.com' })
      .expect(201);

    await request(httpServer)
      .patch('/promocodes/sale10')
      .send({ activationLimit: 2 })
      .expect(200);

    await request(httpServer)
      .patch('/promocodes/sale10')
      .send({ activationLimit: 1 })
      .expect(400)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          code: 'ACTIVATION_LIMIT_BELOW_USAGE',
          fields: ['activationLimit'],
        });
      });
  });

  it('rejects activation when promocode is expired', async () => {
    await createPromocode(app);

    await prisma.promoCode.update({
      where: { code: 'SALE10' },
      data: { expiresAt: new Date('2020-01-01T00:00:00.000Z') },
    });

    await request(app.getHttpServer())
      .post('/promocodes/sale10/activate')
      .send({ email: 'user@example.com' })
      .expect(410)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          code: 'PROMOCODE_NOT_ACTIVATABLE',
        });
      });

    await expect(prisma.activation.count()).resolves.toBe(0);
    await expect(
      prisma.promoCode.findUniqueOrThrow({ where: { code: 'SALE10' } }),
    ).resolves.toMatchObject({ activationsCount: 0 });
  });

  it('does not exceed activation limit under concurrent requests', async () => {
    await createPromocode(app, { activationLimit: 1 });

    const responses = await Promise.all([
      request(app.getHttpServer())
        .post('/promocodes/sale10/activate')
        .send({ email: 'first@example.com' }),
      request(app.getHttpServer())
        .post('/promocodes/sale10/activate')
        .send({ email: 'second@example.com' }),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([
      201, 410,
    ]);
    await expect(prisma.activation.count()).resolves.toBe(1);
    await expect(
      prisma.promoCode.findUniqueOrThrow({ where: { code: 'SALE10' } }),
    ).resolves.toMatchObject({ activationsCount: 1 });
  });

  it('returns not found for missing promocode', async () => {
    await request(app.getHttpServer())
      .get('/promocodes/sale10')
      .expect(404)
      .expect(({ body }) => {
        expect(body).toMatchObject({ code: 'PROMOCODE_NOT_FOUND' });
      });
  });

  it('returns standardized validation errors', async () => {
    await request(app.getHttpServer())
      .post('/promocodes')
      .send({
        code: '',
        discountPercent: 101,
        activationLimit: 0,
        expiresAt: '2020-01-01T00:00:00.000Z',
        unexpected: true,
      })
      .expect(400)
      .expect((response) => {
        const body = parseBody<ValidationErrorBody>(response);

        expect(body).toMatchObject({
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
        });
        expect(body.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'discountPercent' }),
            expect.objectContaining({ field: 'activationLimit' }),
            expect.objectContaining({ field: 'expiresAt' }),
            expect.objectContaining({ field: 'unexpected' }),
          ]),
        );
      });
  });
});
