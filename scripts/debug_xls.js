import XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.resolve(__dirname, '../ATwebReport-Janeiro-2020-30Nov-2025.xls');

try {
    console.log(`Reading file: ${INPUT_FILE}`);
    const workbook = XLSX.readFile(INPUT_FILE);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON exactly as we do in the app
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    if (jsonData.length === 0) {
        console.log("File is empty");
    } else {
        console.log("First row sample:");
        console.log(JSON.stringify(jsonData[0], null, 2));

        console.log("\nChecking specific columns for first 5 rows:");
        jsonData.slice(0, 5).forEach((row, i) => {
            console.log(`Row ${i}:`);
            console.log(`  OS: ${row['OS']} (Type: ${typeof row['OS']})`);
            console.log(`  Data Abertura: ${row['Data Abertura']} (Type: ${typeof row['Data Abertura']})`);
            console.log(`  Data Fechamento: ${row['Data Fechamento']} (Type: ${typeof row['Data Fechamento']})`);
            console.log(`  Data Fabricação: ${row['Data Fabricação']} (Type: ${typeof row['Data Fabricação']})`);
        });
    }

} catch (error) {
    console.error("Error:", error);
}
