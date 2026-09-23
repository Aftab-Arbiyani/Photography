import 'reflect-metadata';
import * as argon2 from 'argon2';
import { AuthProvider, CmsPageStatus, SubscriptionInterval, UserRole } from '@photography/types';
import { slugify } from '@photography/utils';
import dataSource from '../data-source';
import { User } from '../../modules/users/entities/user.entity';
import { Category } from '../../modules/categories/entities/category.entity';
import { SubscriptionPlan } from '../../modules/subscriptions/entities/subscription-plan.entity';
import { PlatformSetting } from '../../modules/platform/entities/platform-setting.entity';
import { FeatureFlag } from '../../modules/platform/entities/feature-flag.entity';
import { CmsPage } from '../../modules/platform/entities/cms-page.entity';

/**
 * Idempotent seed: creates an initial admin/photographer account and a baseline
 * set of categories. Safe to re-run — existing rows are skipped.
 *
 *   ADMIN_EMAIL / ADMIN_PASSWORD env vars override the defaults.
 */
async function seed(): Promise<void> {
  await dataSource.initialize();
  // eslint-disable-next-line no-console
  console.log('🌱 Seeding database…');

  const userRepo = dataSource.getRepository(User);
  const categoryRepo = dataSource.getRepository(Category);

  // ----- admin / primary photographer -----
  const email = (process.env.ADMIN_EMAIL ?? 'admin@photography.local').toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? 'Admin123!';

  let admin = await userRepo.findOne({ where: { email } });
  if (!admin) {
    admin = userRepo.create({
      email,
      passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
      firstName: 'Studio',
      lastName: 'Owner',
      role: UserRole.ADMIN,
      provider: AuthProvider.LOCAL,
      isEmailVerified: true,
    });
    await userRepo.save(admin);
    // eslint-disable-next-line no-console
    console.log(`✅ Admin created: ${email} / ${password}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`↩️  Admin already exists: ${email}`);
  }

  // ----- categories -----
  const categories = ['Landscape', 'Portrait', 'Wildlife', 'Street', 'Architecture', 'Travel'];
  for (const name of categories) {
    const slug = slugify(name);
    const exists = await categoryRepo.findOne({ where: { slug } });
    if (!exists) {
      await categoryRepo.save(categoryRepo.create({ name, slug }));
      // eslint-disable-next-line no-console
      console.log(`✅ Category created: ${name}`);
    }
  }

  // ----- membership plans -----
  const planRepo = dataSource.getRepository(SubscriptionPlan);
  const plans = [
    {
      code: 'free',
      name: 'Free',
      priceCents: 0,
      interval: SubscriptionInterval.MONTH,
      isPremium: false,
      sortOrder: 0,
      features: ['Browse the full gallery', 'Like & bookmark', 'Follow photographers'],
    },
    {
      code: 'premium-monthly',
      name: 'Premium (Monthly)',
      priceCents: 900,
      interval: SubscriptionInterval.MONTH,
      isPremium: true,
      sortOrder: 1,
      features: [
        'Everything in Free',
        'Exclusive collections',
        'Early access drops',
        'Higher download limits',
      ],
    },
    {
      code: 'premium-yearly',
      name: 'Premium (Yearly)',
      priceCents: 9000,
      interval: SubscriptionInterval.YEAR,
      isPremium: true,
      sortOrder: 2,
      features: ['Everything in Premium', '2 months free'],
    },
  ];
  for (const p of plans) {
    if (!(await planRepo.findOne({ where: { code: p.code } }))) {
      await planRepo.save(planRepo.create(p));
      // eslint-disable-next-line no-console
      console.log(`✅ Plan created: ${p.code}`);
    }
  }

  // ----- platform settings -----
  const settingRepo = dataSource.getRepository(PlatformSetting);
  const settings = [
    { key: 'site.name', value: 'Aperture', category: 'branding', isPublic: true },
    { key: 'site.tagline', value: 'Photography, framed.', category: 'branding', isPublic: true },
    { key: 'commerce.default_commission_rate', value: 0.3, category: 'commerce', isPublic: false },
    {
      key: 'photographers.applications_open',
      value: true,
      category: 'photographers',
      isPublic: true,
    },
  ];
  for (const s of settings) {
    if (!(await settingRepo.findOne({ where: { key: s.key } }))) {
      await settingRepo.save(settingRepo.create(s));
    }
  }

  // ----- feature flags -----
  const flagRepo = dataSource.getRepository(FeatureFlag);
  for (const f of [
    {
      key: 'photographer-applications',
      enabled: true,
      description: 'Allow users to apply as photographers',
    },
  ]) {
    if (!(await flagRepo.findOne({ where: { key: f.key } }))) {
      await flagRepo.save(flagRepo.create({ ...f, rolloutPercentage: 100 }));
    }
  }

  // ----- CMS pages -----
  const pageRepo = dataSource.getRepository(CmsPage);
  const pages = [
    {
      slug: 'about',
      title: 'About',
      body: '# About Aperture\n\nA marketplace and community for photographers.',
    },
    { slug: 'terms', title: 'Terms of Service', body: '# Terms of Service\n\nPlaceholder terms.' },
    {
      slug: 'privacy',
      title: 'Privacy Policy',
      body: '# Privacy Policy\n\nPlaceholder privacy policy.',
    },
  ];
  for (const pg of pages) {
    if (!(await pageRepo.findOne({ where: { slug: pg.slug } }))) {
      await pageRepo.save(pageRepo.create({ ...pg, status: CmsPageStatus.PUBLISHED }));
    }
  }

  await dataSource.destroy();
  // eslint-disable-next-line no-console
  console.log('🌱 Seed complete.');
}

seed().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
