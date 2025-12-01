import XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.resolve(__dirname, '../ATwebReport-Janeiro-2020-30Nov-2025.xls');
const OUTPUT_FILE = path.resolve(__dirname, '../public/data/ATwebReport.csv');

// Expected columns based on the old CSV
const EXPECTED_COLUMNS = [
    "OS", "Tipo", "Status", "Data Abertura", "Data Fechamento", "Finalidade", "Origem",
    "CNPJ Posto", "Razão Social Posto", "Cidade Posto", "UF Posto", "CPF/CNPJ Consum",
    "Consumidor", "Cidade Cons", "UF Cons", "Telefone", "Telefone 2", "Ref Prod",
    "Desc Produto", "Família Prod", "Lote/Serie", "Data Fabricação", "Data Faturamento",
    "NF de Faturamento", "Faturado Para", "Revendedor", "CNPJ Rev", "Cidade Rev", "UF Rev",
    "NF Compra", "Data NF Compra", "NF Conserto", "Data NF Conserto", "Obs", "Adicionais da OS",
    "Qtde  Adicional da OS", "Vlr Unit Adicional da OS", "Vlr Total Adicional da OS",
    "Obs Adicional da OS", "Defeito Reclamado", "Defeito Constatado", "Garantia", "Tecnico",
    "Data Hora Check", "Tipo", "Lat", "Lng", "Peças Trocadas", "Descrição Peça",
    "Qtde Trocada", "Ação de Reparo", "Defeito Peça", "Obs Defeito Peça", "Data Lançto Peça",
    "Usuários Papel Abertura", "Nº do Extrato", "Status da Extrato", "Data de Pagamento"
];

try {
    console.log(`Reading file: ${INPUT_FILE}`);
    const workbook = XLSX.readFile(INPUT_FILE);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON (array of arrays) to check headers
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (data.length === 0) {
        throw new Error("File is empty");
    }

    const headers = data[0];
    console.log("Found headers:", headers);

    // Verify columns
    const missingColumns = EXPECTED_COLUMNS.filter(col => !headers.includes(col));

    if (missingColumns.length > 0) {
        console.warn("WARNING: The following expected columns are missing in the new file:");
        missingColumns.forEach(col => console.warn(` - ${col}`));
    } else {
        console.log("SUCCESS: All expected columns are present.");
    }

    // Convert to CSV with semicolon delimiter
    // XLSX.utils.sheet_to_csv uses comma by default. We can use FS option if available or just replace.
    // However, simply replacing ',' with ';' is dangerous if content has commas.
    // Better to use sheet_to_csv with FS option if supported, or build it manually.
    // SheetJS sheet_to_csv supports 'FS' option.

    const csvContent = XLSX.utils.sheet_to_csv(sheet, { FS: ";" });

    console.log(`Writing to: ${OUTPUT_FILE}`);
    fs.writeFileSync(OUTPUT_FILE, csvContent); // Write with BOM if needed, but standard write is usually UTF-8 without BOM or with.
    // The previous file seemed to have BOM (based on '﻿' in header check earlier).
    // Let's add BOM just in case to match Excel export style if needed, but usually UTF-8 is fine.
    // Actually, the previous code handled BOM removal: header.replace('﻿', '')

    console.log("Conversion complete.");

} catch (error) {
    console.error("Error converting file:", error);
    process.exit(1);
}
