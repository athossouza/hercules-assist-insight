import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ServiceOrder } from '@/types/dashboard';
import * as XLSX from 'xlsx';
import localforage from 'localforage';

// Configure localforage
localforage.config({
    name: 'HerculesDashboard',
    storeName: 'dashboard_data'
});

interface ImportMetadata {
    filename: string;
    date: Date;
}

interface DashboardContextType {
    data: ServiceOrder[];
    loading: boolean;
    error: string | null;
    importMetadata: ImportMetadata | null;
    importData: (file: File) => Promise<void>;
    refreshData: () => Promise<void>;
    clearData: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

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

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
    const [data, setData] = useState<ServiceOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [importMetadata, setImportMetadata] = useState<ImportMetadata | null>(null);

    const processData = (rawData: any[]) => {
        // Deduplicate data based on "Número OS" (or "OS")
        const uniqueMap = new Map<string, ServiceOrder>();
        const itemsMap = new Map<string, ServiceOrder[]>();

        rawData.forEach(item => {
            const id = item["Número OS"] || item["OS"];
            if (id) {
                if (!itemsMap.has(id)) {
                    itemsMap.set(id, []);
                }
                itemsMap.get(id)?.push(item);
                uniqueMap.set(id, item);
            }
        });

        return Array.from(uniqueMap.values()).map(item => {
            const id = item["Número OS"] || item["OS"];
            return {
                ...item,
                relatedItems: itemsMap.get(id) || [item]
            };
        });
    };

    const loadDefaultData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/data/ATwebReport.csv');
            const csvText = await response.text();

            const lines = csvText.split('\n');
            const headers = lines[0].split(';').map(header => header.replace('﻿', '').trim());

            const parsedData: ServiceOrder[] = [];

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const values = line.split(';');
                const row: any = {};

                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });

                parsedData.push(row as ServiceOrder);
            }

            const processedData = processData(parsedData);
            setData(processedData);
            setImportMetadata(null);

            await localforage.removeItem('imported_data');
            await localforage.removeItem('import_metadata');

        } catch (err) {
            setError('Erro ao carregar dados padrão: ' + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const initializeData = async () => {
        try {
            setLoading(true);

            const savedData = await localforage.getItem<ServiceOrder[]>('imported_data');
            const savedMetadata = await localforage.getItem<ImportMetadata>('import_metadata');

            if (savedData && savedMetadata) {
                console.log("Loading data from storage...", savedMetadata);
                setData(savedData);
                setImportMetadata({
                    ...savedMetadata,
                    date: new Date(savedMetadata.date)
                });
            } else {
                console.log("No saved data found, loading default CSV...");
                await loadDefaultData();
            }
        } catch (err) {
            console.error("Error initializing data:", err);
            await loadDefaultData();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        initializeData();
    }, []);

    const importData = async (file: File) => {
        setLoading(true);
        setError(null);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet);

            if (jsonData.length === 0) {
                throw new Error("O arquivo está vazio.");
            }

            // Helper to convert Excel serial date to JS Date object
            const excelDateToJSDate = (serial: number) => {
                const utc_days = Math.floor(serial - 25569);
                const utc_value = utc_days * 86400;
                const date_info = new Date(utc_value * 1000);
                return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
            }

            // Helper to format date as dd/mm/yyyy
            const formatDate = (dateVal: any) => {
                if (!dateVal) return "";

                // Handle Excel serial number
                if (typeof dateVal === 'number') {
                    const date = excelDateToJSDate(dateVal);
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    return `${day}/${month}/${year}`;
                }

                // Handle string dates with time (e.g., "27/01/2020  00:00:00")
                if (typeof dateVal === 'string') {
                    // Extract just the date part (dd/mm/yyyy)
                    const match = dateVal.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                    if (match) {
                        return `${match[1].padStart(2, '0')}/${match[2].padStart(2, '0')}/${match[3]}`;
                    }
                }

                return String(dateVal);
            }

            // Filter and normalize data
            const normalizedData = jsonData.reduce((acc: any[], row: any) => {
                const newRow: any = {};
                let isValidRow = true;

                EXPECTED_COLUMNS.forEach(col => {
                    let val = row[col];

                    // Check if column is a date column
                    if (col.includes('Data') || col.includes('Date')) {
                        val = formatDate(val);

                        // Validation: "Data Abertura" must be present and valid
                        if (col === "Data Abertura") {
                            if (!val || !val.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                                isValidRow = false;
                            }
                        }
                    }

                    newRow[col] = val !== undefined ? String(val) : "";
                });

                if (isValidRow) {
                    acc.push(newRow);
                }

                return acc;
            }, []);

            const processedData = processData(normalizedData);
            const metadata = {
                filename: file.name,
                date: new Date()
            };

            setData(processedData);
            setImportMetadata(metadata);

            await localforage.setItem('imported_data', processedData);
            await localforage.setItem('import_metadata', metadata);

        } catch (err) {
            setError('Erro ao importar arquivo: ' + (err as Error).message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const clearData = async () => {
        await localforage.clear();
        await loadDefaultData();
    };

    return (
        <DashboardContext.Provider value={{ data, loading, error, importMetadata, importData, refreshData: loadDefaultData, clearData }}>
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboardContext = () => {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error('useDashboardContext must be used within a DashboardProvider');
    }
    return context;
};
