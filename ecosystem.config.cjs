module.exports = {
  apps: [
    {
      name: 'magazin-cms',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/home/zaja/magazin-cms',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/home/zaja/magazin-cms/logs/error.log',
      out_file: '/home/zaja/magazin-cms/logs/out.log',
      log_file: '/home/zaja/magazin-cms/logs/combined.log',
      time: true,
    },
  ],
};
