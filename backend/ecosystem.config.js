module.exports = {
  apps: [{
    name: 'ai-grammar-backend',
    script: 'server.js',
    instances: 'max', // Use all available CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

    // Process management
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s',

    // Monitoring
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],

    // Advanced features
    kill_timeout: 5000,
    listen_timeout: 3000,

    // Health check
    health_check_grace_period: 3000
  }],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-production-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/ai-grammar-web.git',
      path: '/var/www/ai-grammar-backend',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};
