// ============================================================================
// PM2 process manager — production runtime for the Aperture monorepo.
//   pm2 start ecosystem.config.cjs --env production
// Run migrations BEFORE starting (see docs/DEPLOYMENT.md). The cron worker runs
// as a SINGLE instance so scheduled jobs don't double-fire across the cluster.
// ============================================================================
module.exports = {
  apps: [
    {
      name: 'aperture-backend',
      cwd: __dirname,
      script: 'apps/backend/dist/main.js',
      instances: 'max', // cluster mode across CPU cores
      exec_mode: 'cluster',
      max_memory_restart: '600M',
      env: { NODE_ENV: 'production' },
      // Cron jobs are guarded to a single instance via RUN_CRON; see below.
      env_production: { NODE_ENV: 'production', RUN_CRON: 'false' },
    },
    {
      // Dedicated single-instance worker that owns scheduled jobs.
      name: 'aperture-cron',
      cwd: __dirname,
      script: 'apps/backend/dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '400M',
      env_production: { NODE_ENV: 'production', RUN_CRON: 'true', BACKEND_PORT: '4001' },
    },
    {
      name: 'aperture-frontend',
      cwd: __dirname,
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: `${__dirname}/apps/frontend`,
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '500M',
      env_production: { NODE_ENV: 'production' },
    },
  ],
};
