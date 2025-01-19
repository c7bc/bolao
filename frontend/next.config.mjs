/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      ignoreDuringBuilds: true, // Ignora erros de ESLint durante o build
    },
    typescript: {
      ignoreBuildErrors: true, // Ignora erros de tipagem durante o build
    },
  };
  
  export default nextConfig;
  