module.exports = {
  apps: [
    {
      name: 'soyTuAgente-api',

      script: 'dist/api/src/main.js',
      cwd: '/opt/soyTuAgente',

      exec_mode: 'fork',
      instances: 1,

      autorestart: true,
      watch: false,
      max_memory_restart: '600M',

      env_file: '.env',   // ✅ ESTA LÍNEA ES LA CLAVE

      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      out_file: '/var/log/soyTuAgente-api.out.log',
      error_file: '/var/log/soyTuAgente-api.err.log',
      merge_logs: true,
      time: true,
    },
  ],
};
