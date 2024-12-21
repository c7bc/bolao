const fs = require("fs");
const path = require("path");

// Configuração
 const config = {
  // Diretórios base para o modo 'directories'
  baseDirs: [
    "src/app/api/jogos/list",
    "src/app/api/jogos/create",
    "src/app/api/jogos/update/{jogoId}",
    "src/app/api/jogos/{jogoSlug}",
    "src/app/api/config/jogos/valores",
    "src/app/api/config/recebimentos",
    "src/app/api/config/porcentagens",
    "src/app/api/resultados/{jogoSlug}",
    "src/app/api/resultados/create",
  ],

  // Diretório base para arquivos específicos
  specificBaseDir: "./src/app/components/dashboard/Admin",

  // Lista de arquivos específicos para o modo 'specific'
  specificFiles: [
    "Configuracoes.jsx",
    "GameDetailsModal.jsx",
    "GameEditModal.jsx",
    "GameFormModal.jsx",
    "GameManagement.jsx",
    "JogosConfig.jsx",
    "PorcentagensConfig.jsx",
    "RecebimentoConfig.jsx",
  ],

  // Configurações gerais
  outputFilePrefix: "./combinedFile",
  numberOfOutputFiles: 2,

  // Extensões de arquivo a serem processadas
  allowedExtensions: [".js", ".jsx", ".ts", ".tsx", ".route.js"],
};

// Função para verificar se o arquivo possui uma extensão permitida
const hasAllowedExtension = (fileName) => {
  const ext = path.extname(fileName);
  return config.allowedExtensions.includes(ext);
};

// Função para coletar arquivos recursivamente
const readFilesRecursively = (dir) => {
  const files = fs.readdirSync(dir);
  let fileList = [];

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
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

  specificFilesPath.forEach((file, index) => {
    if (!fs.existsSync(file)) {
      console.warn(`Arquivo específico não encontrado: ${file}`);
    }
  });

  return existingFiles;
};

// Função para dividir um array em N partes
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
    console.log(`Encontrados ${specificFiles.length} arquivos específicos.`);
    allFiles.push(...specificFiles);

    // Remover duplicatas
    const uniqueFiles = Array.from(new Set(allFiles));
    console.log(`Total de arquivos únicos a serem processados: ${uniqueFiles.length}`);

    if (uniqueFiles.length === 0) {
      console.log("Nenhum arquivo encontrado para combinar.");
      return;
    }

    // Dividir os arquivos em grupos
    const fileChunks = splitArrayIntoChunks(uniqueFiles, config.numberOfOutputFiles);

    // Processar cada grupo
    for (let i = 0; i < fileChunks.length; i++) {
      const chunk = fileChunks[i];
      let combinedContent = "";

      combinedContent += `// Arquivos combinados - Grupo ${i + 1}\n`;
      combinedContent += `// Data de geração: ${new Date().toISOString()}\n\n`;

      chunk.forEach((file) => {
        try {
          const fileContent = fs.readFileSync(file, "utf-8");
          combinedContent += `// Caminho: ${file}\n`;
          combinedContent += `${fileContent}\n\n`;
        } catch (err) {
          console.error(`Erro ao ler o arquivo ${file}:`, err);
        }
      });

      const outputFilePath = `${config.outputFilePrefix}_${i + 1}.ts`;
      try {
        fs.writeFileSync(outputFilePath, combinedContent, "utf-8");
        console.log(`Arquivo combinado ${i + 1} criado com sucesso em ${outputFilePath}`);
      } catch (err) {
        console.error(`Erro ao escrever no arquivo ${outputFilePath}:`, err);
      }
    }

    console.log("Processo de combinação concluído com sucesso!");
  } catch (err) {
    console.error("Erro ao combinar os arquivos:", err);
  }
};

// Rodar a função
createDividedFiles();
