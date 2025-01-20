const fs = require("fs");
const path = require("path");

// Configuração
const config = {
  baseDirs: ["src/app/api/jogos"], 
  specificBaseDir: "./src/app/components/dashboard/",
  specificFiles: [
    // "Admin/Configuracoes.jsx",
    // "Admin/Financeiro.jsx",
    // "Admin/GameDetailsModal.jsx",
    // "Admin/GameEditModal.jsx",
    // "Admin/GameFormModal.jsx",
    // "Admin/GameManagement.jsx",
    // "Admin/PrizeCalculation.jsx",
    // "Admin/LotteryForm.jsx",
    // "Admin/PremiationForm.jsx",
    // "Admin/LotteryHistory.jsx"
    // "Admin/GameTypeEditModal.jsx",
    // "Admin/GameTypeFormModal.jsx",
    // "Admin/GameTypeManagement.jsx",
    // "Admin/JogosConfig.jsx",
    // "Admin/PorcentagensConfig.jsx",
    // "Admin/ResultadosManagement.jsx",
    // "Admin/RecebimentoConfig.jsx",
    // "Admin/TaxasComissaoConfig.jsx",
    // "Colaborador/CommissionHistory.jsx",
    // "Colaborador/Financeiro.jsx",
    // "Colaborador/GameDetailsModal.jsx",
    // "Colaborador/GameFormModalColaborador.jsx",
    // "Colaborador/GameHistory.jsx",
    // "Colaborador/Jogos.jsx",
    // "Colaborador/JogosAtivos.jsx",
    // "Colaborador/JogosFinalizados.jsx",
    // "Colaborador/ListaJogos.jsx",
    // "Colaborador/PaymentForm.jsx",
    // "Colaborador/Referrals.jsx",
    // "Cliente/ClienteDashboard.jsx",
    // "Cliente/ClienteFinancialHistory.jsx",
    // "Cliente/ClienteGameHistory.jsx",
    // "Cliente/ClienteScores.jsx",
    // "Cliente/Historico.jsx",
    // "Cliente/JogosDisponiveis.jsx",
    // "Cliente/JogosFinalizados.jsx",
  ],
  outputFilePrefix: "./combinedFile",
  numberOfOutputFiles: 1,
  allowedExtensions: [".js", ".jsx", ".ts", ".tsx", ".route.js"],
};

const hasAllowedExtension = (fileName) => {
  const ext = path.extname(fileName);
  return config.allowedExtensions.includes(ext);
};

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

const collectSpecificFiles = () => {
  const specificFilesPath = config.specificFiles.map((file) =>
    path.join(config.specificBaseDir, file)
  );
  const existingFiles = specificFilesPath.filter((file) => fs.existsSync(file));

  specificFilesPath.forEach((file) => {
    if (!fs.existsSync(file)) {
      console.warn(`Arquivo específico não encontrado: ${file}`);
    }
  });

  return existingFiles;
};

const countFileLines = (filePath) => {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  return fileContent.split("\n").length;
};

const distributeFilesByLines = (filesWithLines, numberOfChunks) => {
  filesWithLines.sort((a, b) => b.lines - a.lines);
  const chunks = Array.from({ length: numberOfChunks }, () => ({ totalLines: 0, files: [] }));

  for (const file of filesWithLines) {
    chunks.sort((a, b) => a.totalLines - b.totalLines);
    chunks[0].files.push(file);
    chunks[0].totalLines += file.lines;
  }

  return chunks;
};

const createBalancedFiles = async () => {
  try {
    const allFiles = [];

    for (const baseDir of config.baseDirs) {
      if (!fs.existsSync(baseDir)) {
        console.error(`Diretório base não encontrado: ${baseDir}`);
        continue;
      }
      const files = readFilesRecursively(baseDir);
      allFiles.push(...files);
    }

    const specificFiles = collectSpecificFiles();
    allFiles.push(...specificFiles);

    const uniqueFiles = Array.from(new Set(allFiles));
    console.log(`Total de arquivos únicos: ${uniqueFiles.length}`);

    if (uniqueFiles.length === 0) {
      console.log("Nenhum arquivo encontrado para combinar.");
      return;
    }

    const filesWithLines = uniqueFiles.map((file) => ({
      path: file,
      lines: countFileLines(file),
    }));

    const chunks = distributeFilesByLines(filesWithLines, config.numberOfOutputFiles);

    chunks.forEach((chunk, index) => {
      let combinedContent = `// Arquivos combinados - Grupo ${index + 1}\n`;
      combinedContent += `// Data de geração: ${new Date().toISOString()}\n\n`;

      chunk.files.forEach((file) => {
        try {
          const fileContent = fs.readFileSync(file.path, "utf-8");
          combinedContent += `// Caminho: ${file.path} (Linhas: ${file.lines})\n`;
          combinedContent += `${fileContent}\n\n`;
        } catch (err) {
          console.error(`Erro ao ler o arquivo ${file.path}:`, err);
        }
      });

      const outputFilePath = `${config.outputFilePrefix}_${index + 1}.ts`;
      try {
        fs.writeFileSync(outputFilePath, combinedContent, "utf-8");
        console.log(`Arquivo combinado ${index + 1} criado com sucesso em ${outputFilePath}`);
      } catch (err) {
        console.error(`Erro ao escrever no arquivo ${outputFilePath}:`, err);
      }
    });

    console.log("Processo de combinação concluído com sucesso!");
  } catch (err) {
    console.error("Erro ao combinar os arquivos:", err);
  }
};

createBalancedFiles();
