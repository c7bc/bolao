/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
      if (!dev) {
        // Configuração para produção
        config.optimization.minimizer = config.optimization.minimizer.map((plugin) => {
          if (plugin.constructor.name === 'TerserPlugin') {
            return new webpack.optimize.TerserPlugin({
              ...plugin.options,
              terserOptions: {
                ...plugin.options.terserOptions,
                cache: true,
                parallel: true,
                sourceMap: false,
                memoryLimit: 512, // Limita a quantidade de memória utilizada para minificação
                ecma: 2020,
                compress: {
                  ecma: 2020,
                  passes: 2,
                },
                mangle: {
                  safari10: true,
                },
              },
            });
          }
          return plugin;
        });
      }
      return config;
    },
  };
  
  export default nextConfig;