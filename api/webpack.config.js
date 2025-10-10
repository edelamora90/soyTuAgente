// api/webpack.config.js
const path = require('path');
const { composePlugins, withNx } = require('@nx/webpack');

module.exports = composePlugins(withNx(), (config) => {
  // Compilamos desde el directorio del proyecto "api"
  config.context = __dirname;

  // ENTRY correcto relativo a api/
  config.entry = {
    main: { import: path.resolve(__dirname, 'src/main.ts') },
  };

  // Es una app Node (Nest)
  config.target = 'node';

  // Limpia la carpeta de salida entre builds (opcional)
  config.output = { ...config.output, clean: true };

  return config;
});
