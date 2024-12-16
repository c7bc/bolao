const fs = require("fs");
const path = require("path");

const baseDirs = [
  "./src/app/components/dashboard/Admin",
]; // Diretórios base onde a busca deve começar

const outputFilePrefix = "./combinedFile"; // Prefixo do nome do arquivo de saída
const numberOfOutputFiles = 1; // Número de arquivos de saída desejados

// Lista de arquivos específicos que devem ser processados
const specificFiles = [
  "AdminDashboard.jsx",
  "Configuracoes.jsx",
  "Financeiro.jsx",
  "GameDetailsModal.jsx",
  "GameEditModal.jsx",
  "GameManagement.jsx",
  "JogosConfig.jsx",
  "PorcentagensConfig.jsx",
  "RecebimentoConfig.jsx",
];

// Função para verificar se o arquivo está na lista de arquivos específicos
const isSpecificFile = (fileName) => {
  return specificFiles.includes(fileName);
};

// Função para coletar arquivos da pasta raiz, sem subpastas
const readFiles = (dir) => {
  const files = fs.readdirSync(dir);
  const fileList = [];

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isFile() && isSpecificFile(file)) {
      fileList.push(filePath);
    }
  });

  return fileList;
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

// Função para criar os arquivos divididos
const createDividedFiles = async () => {
  try {
    const allFiles = [];

    // Coletar apenas os arquivos específicos das pastas base
    for (const baseDir of baseDirs) {
      if (!fs.existsSync(baseDir)) {
        console.error(`Diretório base não encontrado: ${baseDir}`);
        continue;
      }

      const files = readFiles(baseDir);
      console.log(`Encontrados ${files.length} arquivos em ${baseDir}`);

      allFiles.push(...files);
    }

    // Remover possíveis duplicatas com base no caminho completo
    const uniqueFiles = Array.from(new Set(allFiles));
    console.log(`Total de arquivos únicos a serem processados: ${uniqueFiles.length}`);

    if (uniqueFiles.length === 0) {
      console.log("Nenhum arquivo encontrado para combinar.");
      return;
    }

    // Dividir os arquivos em grupos conforme o número de arquivos de saída
    const fileChunks = splitArrayIntoChunks(uniqueFiles, numberOfOutputFiles);
    console.log(`Dividindo os arquivos em ${numberOfOutputFiles} grupo(s).`);

    // Processar cada grupo e escrever no respectivo arquivo de saída
    for (let i = 0; i < fileChunks.length; i++) {
      const chunk = fileChunks[i];
      let combinedContent = "";

      console.log(`Processando grupo ${i + 1} com ${chunk.length} arquivos.`);

      chunk.forEach((file) => {
        try {
          const fileContent = fs.readFileSync(file, "utf-8");
          const relativePath = baseDirs.reduce((relPath, baseDir) => {
            if (relPath) return relPath; // Já encontrou o caminho relativo
            if (file.startsWith(baseDir)) {
              return path.relative(baseDir, file);
            }
            return "";
          }, "");

          combinedContent += `// Caminho: ${relativePath}
`;
          combinedContent += `${fileContent}

`;
        } catch (readError) {
          console.error(`Erro ao ler o arquivo ${file}:`, readError);
        }
      });

      // Definir o nome do arquivo de saída
      const outputFilePath = `${outputFilePrefix}_${i + 1}.ts`;

      try {
        fs.writeFileSync(outputFilePath, combinedContent, "utf-8");
        console.log(`Arquivo combinado ${i + 1} criado com sucesso em ${outputFilePath}`);
      } catch (writeError) {
        console.error(`Erro ao escrever no arquivo ${outputFilePath}:`, writeError);
      }
    }

    console.log("Processo de combinação concluído com sucesso!");
  } catch (error) {
    console.error("Erro ao combinar os arquivos:", error);
  }
};

// Rodar a função
createDividedFiles();
