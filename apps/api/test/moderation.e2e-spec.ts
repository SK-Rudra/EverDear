import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Test,
  type TestingModule,
} from '@nestjs/testing';
import request from 'supertest';
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';

import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Moderation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const originalDatabaseUrl =
    process.env.DATABASE_URL;

  const testMarker = '[moderation-e2e]';

  const userEmail =
    'moderation-user@everdear.test';

  const moderatorEmail =
    'moderation-staff@everdear.test';

  const adminEmail =
    'moderation-admin@everdear.test';

  const testEmails = [
    userEmail,
    moderatorEmail,
    adminEmail,
  ];

  const testPassword =
    'A secure moderation passphrase 2026!';

  beforeAll(async () => {
    const testDatabaseUrl =
      process.env.TEST_DATABASE_URL;

    if (!testDatabaseUrl) {
      throw new Error(
        'TEST_DATABASE_URL is not configured',
      );
    }

    process.env.DATABASE_URL = testDatabaseUrl;

    const { AppModule } = await import(
      '../src/app.module.js'
    );

    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication();

    configureApp(app, app.get(ConfigService));

    await app.init();

    prisma = app.get(PrismaService);

    await prisma.moderationLog.deleteMany();

    await prisma.publicMessage.deleteMany({
      where: {
        content: {
          startsWith: testMarker,
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: testEmails,
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.moderationLog.deleteMany();

    await prisma.publicMessage.deleteMany({
      where: {
        content: {
          startsWith: testMarker,
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: testEmails,
        },
      },
    });

    await app.close();

    if (originalDatabaseUrl) {
      process.env.DATABASE_URL =
        originalDatabaseUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
  });

  it('enforces staff roles, moderates content, resolves reports, and audits actions', async () => {
    const server = app.getHttpServer();

    const userAgent = request.agent(server);
    const moderatorAgent =
      request.agent(server);
    const adminAgent = request.agent(server);

    await request(server)
      .get('/api/v1/moderation/overview')
      .expect(401);

    await userAgent
      .post('/api/v1/auth/register')
      .send({
        name: 'Ordinary Wall User',
        email: userEmail,
        password: testPassword,
      })
      .expect(201);

    await moderatorAgent
      .post('/api/v1/auth/register')
      .send({
        name: 'EverDear Moderator',
        email: moderatorEmail,
        password: testPassword,
      })
      .expect(201);

    await adminAgent
      .post('/api/v1/auth/register')
      .send({
        name: 'EverDear Administrator',
        email: adminEmail,
        password: testPassword,
      })
      .expect(201);

    await prisma.user.update({
      where: {
        email: moderatorEmail,
      },
      data: {
        role: 'MODERATOR',
      },
    });

    await prisma.user.update({
      where: {
        email: adminEmail,
      },
      data: {
        role: 'ADMIN',
      },
    });

    await userAgent
      .get('/api/v1/moderation/overview')
      .expect(403);

    const now = new Date();

    const futureExpiration = new Date(
      now.getTime() +
        30 * 24 * 60 * 60 * 1000,
    );

    const pendingMessage =
      await prisma.publicMessage.create({
        data: {
          content:
            `${testMarker} A message awaiting staff review.`,
          anonymous: true,
          authorHash:
            'moderation-pending-author',
          status: 'PENDING',
        },
      });

    const publishedMessage =
      await prisma.publicMessage.create({
        data: {
          content:
            `${testMarker} A published message for state-transition testing.`,
          anonymous: true,
          authorHash:
            'moderation-published-author',
          status: 'PUBLISHED',
          publishedAt: now,
          expiresAt: futureExpiration,
        },
      });

    const reportedMessage =
      await prisma.publicMessage.create({
        data: {
          content:
            `${testMarker} A reported message requiring action.`,
          anonymous: true,
          authorHash:
            'moderation-reported-author',
          status: 'PUBLISHED',
          publishedAt: now,
          expiresAt: futureExpiration,
        },
      });

    const actionReport =
      await prisma.report.create({
        data: {
          messageId: reportedMessage.id,
          reporterHash:
            'moderation-reporter-action',
          reason: 'HARASSMENT',
          details:
            'This message requires intervention.',
          status: 'PENDING',
        },
      });

    const overviewResponse =
      await moderatorAgent
        .get('/api/v1/moderation/overview')
        .expect(200);

    expect(
      overviewResponse.body.messages.pending,
    ).toBeGreaterThanOrEqual(1);

    expect(
      overviewResponse.body.reports.pending,
    ).toBeGreaterThanOrEqual(1);

    const pendingListResponse =
      await moderatorAgent
        .get('/api/v1/moderation/messages')
        .query({
          status: 'PENDING',
          query: 'awaiting',
        })
        .expect(200);

    const listedPendingMessage =
      pendingListResponse.body.messages.find(
        (message: { id: string }) =>
          message.id === pendingMessage.id,
      );

    expect(listedPendingMessage).toMatchObject({
      id: pendingMessage.id,
      status: 'PENDING',
      reportCount: 0,
      pendingReportCount: 0,
    });

    expect(
      listedPendingMessage,
    ).not.toHaveProperty('authorHash');

    const publishResponse =
      await moderatorAgent
        .patch(
          `/api/v1/moderation/messages/${pendingMessage.id}`,
        )
        .send({
          action: 'PUBLISH',
          note:
            'Reviewed and suitable for the Wall.',
        })
        .expect(200);

    expect(
      publishResponse.body.status,
    ).toBe('PUBLISHED');

    expect(
      publishResponse.body.publishedAt,
    ).toEqual(expect.any(String));

    expect(
      publishResponse.body.expiresAt,
    ).toEqual(expect.any(String));

    const hideResponse =
      await moderatorAgent
        .patch(
          `/api/v1/moderation/messages/${publishedMessage.id}`,
        )
        .send({
          action: 'HIDE',
          note:
            'Temporarily hidden for review.',
        })
        .expect(200);

    expect(hideResponse.body.status).toBe(
      'HIDDEN',
    );

    const restoreResponse =
      await moderatorAgent
        .patch(
          `/api/v1/moderation/messages/${publishedMessage.id}`,
        )
        .send({
          action: 'RESTORE',
          note:
            'Review completed successfully.',
        })
        .expect(200);

    expect(restoreResponse.body.status).toBe(
      'PUBLISHED',
    );

    await moderatorAgent
      .patch(
        `/api/v1/moderation/messages/${publishedMessage.id}`,
      )
      .send({
        action: 'REMOVE',
      })
      .expect(403);

    const removeResponse =
      await adminAgent
        .patch(
          `/api/v1/moderation/messages/${publishedMessage.id}`,
        )
        .send({
          action: 'REMOVE',
          note:
            'Administrator removal test.',
        })
        .expect(200);

    expect(removeResponse.body.status).toBe(
      'REMOVED',
    );

    const actionedReportResponse =
      await moderatorAgent
        .patch(
          `/api/v1/moderation/reports/${actionReport.id}`,
        )
        .send({
          resolution: 'ACTIONED',
          note:
            'Report confirmed and content hidden.',
        })
        .expect(200);

    expect(
      actionedReportResponse.body.status,
    ).toBe('HIDDEN');

    const resolvedActionReport =
      actionedReportResponse.body.reports.find(
        (report: { id: string }) =>
          report.id === actionReport.id,
      );

    expect(resolvedActionReport).toMatchObject({
      id: actionReport.id,
      status: 'ACTIONED',
      resolver: {
        email: moderatorEmail,
      },
    });

    expect(
      resolvedActionReport,
    ).not.toHaveProperty('reporterHash');

    const dismissedReport =
      await prisma.report.create({
        data: {
          messageId: reportedMessage.id,
          reporterHash:
            'moderation-reporter-dismiss',
          reason: 'OTHER',
          details:
            'This report should be dismissed.',
          status: 'PENDING',
        },
      });

    const dismissedResponse =
      await moderatorAgent
        .patch(
          `/api/v1/moderation/reports/${dismissedReport.id}`,
        )
        .send({
          resolution: 'DISMISSED',
          note:
            'No policy violation was found.',
        })
        .expect(200);

    const resolvedDismissedReport =
      dismissedResponse.body.reports.find(
        (report: { id: string }) =>
          report.id === dismissedReport.id,
      );

    expect(
      resolvedDismissedReport.status,
    ).toBe('DISMISSED');

    await moderatorAgent
      .patch(
        `/api/v1/moderation/reports/${dismissedReport.id}`,
      )
      .send({
        resolution: 'REVIEWED',
      })
      .expect(409);

    const historyResponse =
      await adminAgent
        .get('/api/v1/moderation/history')
        .expect(200);

    expect(
      historyResponse.body.history.length,
    ).toBeGreaterThanOrEqual(7);

    const actions =
      historyResponse.body.history.map(
        (entry: { action: string }) =>
          entry.action,
      );

    expect(actions).toContain(
      'MESSAGE_PUBLISHED',
    );

    expect(actions).toContain(
      'MESSAGE_HIDDEN',
    );

    expect(actions).toContain(
      'MESSAGE_RESTORED',
    );

    expect(actions).toContain(
      'MESSAGE_REMOVED',
    );

    expect(actions).toContain(
      'REPORT_ACTIONED',
    );

    expect(actions).toContain(
      'REPORT_DISMISSED',
    );

    const staffHistoryEntry =
      historyResponse.body.history.find(
        (entry: {
          actor: {
            email: string;
          } | null;
        }) =>
          entry.actor?.email ===
          moderatorEmail,
      );

    expect(staffHistoryEntry).toBeDefined();

    expect(
      staffHistoryEntry.actor,
    ).not.toHaveProperty('passwordHash');
  });
});