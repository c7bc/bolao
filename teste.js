const fs = require("fs");
const path = require("path");

// Configuração
const config = {
  // Diretórios base para o modo 'directories'
  baseDirs: [
    "src/app/api/activities/recent",
    "src/app/api/tasks/progress",
    "src/app/api/users/active",
    "src/app/api/financeiro/resumo",
    "src/app/api/jogos/list",
    "src/app/api/jogos/create",
    "src/app/api/jogos/update/{jogoId}",
    "src/app/api/jogos/{jogoSlug}",
    "src/app/api/jogos/{jogoSlug}",
    "src/app/api/jogos/list",
    "src/app/api/financeiro/resumo",
    "src/app/api/financeiro/colaboradores",
    "src/app/api/financeiro/clientes",
    "src/app/api/config/jogos/valores",
    "src/app/api/config/recebimentos",
    "src/app/api/config/porcentagens",
    "src/app/api/resultados/{jogoSlug}",
    "src/app/api/resultados/create",
  ],

  // Base directory para arquivos específicos
  specificBaseDir: "./src/app/components/dashboard/Admin",

  // Lista de arquivos específicos para o modo 'specific'
  specificFiles: [],

  // Configurações gerais
  outputFilePrefix: "./combinedFile",
  numberOfOutputFiles: 1,

  // Extensões de arquivo a serem processadas (adicione ou remova conforme necessário)
  allowedExtensions: [".js", ".jsx", ".ts", ".tsx", ".route.js"],
};

// Função para verificar se o arquivo possui uma extensão permitida
const hasAllowedExtension = (fileName) => {
  const ext = path.extname(fileName);
  return config.allowedExtensions.includes(ext);
};

// Função para verificar se o arquivo está na lista de arquivos específicos
const isSpecificFile = (fileName) => {
  return config.specificFiles.includes(fileName);
};

// Função para coletar arquivos recursivamente (incluindo subpastas)
const readFilesRecursively = (dir) => {
  const files = fs.readdirSync(dir);
  let fileList = [];

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recursivamente ler subpastas
      fileList = fileList.concat(readFilesRecursively(filePath));
    } else if (stat.isFile() && hasAllowedExtension(file)) {
      fileList.push(filePath);
    }
  });

  return fileList;
};

// Função para coletar arquivos específicos
const collectSpecificFiles = () => {
  const specificFilesPath = config.specificFiles.map((file) =>
    path.join(config.specificBaseDir, file)
  );
  const existingFiles = specificFilesPath.filter((file) => fs.existsSync(file));

  if (existingFiles.length < config.specificFiles.length) {
    config.specificFiles.forEach((file, index) => {
      if (!fs.existsSync(specificFilesPath[index])) {
        console.warn(
          `Arquivo específico não encontrado: ${specificFilesPath[index]}`
        );
      }
    });
  }

  return existingFiles;
};

// Função para dividir um array em N partes aproximadamente iguais
const splitArrayIntoChunks = (array, chunks) => {
  const result = [];
  const chunkSize = Math.ceil(array.length / chunks);
  for (let i = 0; i < chunks; i++) {
    const start = i * chunkSize;
    const end = start + chunkSize;
    result.push(array.slice(start, end));
  }
  return result;
};

// Função principal para criar os arquivos divididos
const createDividedFiles = async () => {
  try {
    const allFiles = [];

    // Coletar arquivos de diretórios completos
    for (const baseDir of config.baseDirs) {
      if (!fs.existsSync(baseDir)) {
        console.error(`Diretório base não encontrado: ${baseDir}`);
        continue;
      }

      const files = readFilesRecursively(baseDir);
      console.log(`Encontrados ${files.length} arquivos em ${baseDir}`);

      allFiles.push(...files);
    }

    // Coletar arquivos específicos
    const specificFiles = collectSpecificFiles();
    console.log(
      `Encontrados ${specificFiles.length} arquivos específicos em ${config.specificBaseDir}`
    );
    allFiles.push(...specificFiles);

    // Remover possíveis duplicatas
    const uniqueFiles = Array.from(new Set(allFiles));
    console.log(
      `Total de arquivos únicos a serem processados: ${uniqueFiles.length}`
    );

    if (uniqueFiles.length === 0) {
      console.log("Nenhum arquivo encontrado para combinar.");
      return;
    }

    // Dividir os arquivos em grupos
    const fileChunks = splitArrayIntoChunks(
      uniqueFiles,
      config.numberOfOutputFiles
    );
    console.log(
      `Dividindo os arquivos em ${config.numberOfOutputFiles} grupo(s).`
    );

    // Processar cada grupo
    for (let i = 0; i < fileChunks.length; i++) {
      const chunk = fileChunks[i];
      let combinedContent = "";

      console.log(`Processando grupo ${i + 1} com ${chunk.length} arquivos.`);

      // Adicionar informações sobre o modo de operação no início do arquivo
      combinedContent += `// Modo de operação: mixed (directories + specific files)\n`;
      combinedContent += `// Data de geração: ${new Date().toISOString()}\n\n`;

      chunk.forEach((file) => {
        try {
          const fileContent = fs.readFileSync(file, "utf-8");
          let relativePath = "";

          // Determinar se o arquivo é específico ou de diretório
          if (file.startsWith(config.specificBaseDir)) {
            relativePath = path.relative(config.specificBaseDir, file);
          } else {
            // Encontrar o baseDir correspondente
            relativePath =
              config.baseDirs.reduce((relPath, baseDir) => {
                if (relPath) return relPath;
                if (file.startsWith(baseDir)) {
                  return path.relative(baseDir, file);
                }
                return "";
              }, "") || file; // Usar o caminho completo se não encontrar um caminho relativo
          }

          combinedContent += `// Caminho: ${relativePath}\n`;
          combinedContent += `${fileContent}\n\n`;
        } catch (readError) {
          console.error(`Erro ao ler o arquivo ${file}:`, readError);
        }
      });

      // Definir o nome do arquivo de saída
      const outputFilePath = `${config.outputFilePrefix}_${i + 1}.ts`;

      try {
        fs.writeFileSync(outputFilePath, combinedContent, "utf-8");
        console.log(
          `Arquivo combinado ${i + 1} criado com sucesso em ${outputFilePath}`
        );
      } catch (writeError) {
        console.error(
          `Erro ao escrever no arquivo ${outputFilePath}:`,
          writeError
        );
      }
    }

    console.log("Processo de combinação concluído com sucesso!");
  } catch (error) {
    console.error("Erro ao combinar os arquivos:", error);
  }
};

// Rodar a função
createDividedFiles();
