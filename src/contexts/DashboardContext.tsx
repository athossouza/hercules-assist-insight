import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ServiceOrder } from '@/types/dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
    const { user, token } = useAuth();
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

    const loadData = async () => {
        if (!user || !token) {
            setLoading(false);
            return;
        }

        // Try to load from cache first
        const cachedData = localStorage.getItem('dashboardData');
        const cachedMetadata = localStorage.getItem('dashboardMetadata');

        if (cachedData) {
            try {
                const parsedCache = JSON.parse(cachedData);
                if (Array.isArray(parsedCache) && parsedCache.length > 0) {
                    setData(parsedCache);
                    setLoading(false); // Show cached data immediately
                }
            } catch (e) {
                console.error("Error parsing cache", e);
            }
        }

        if (cachedMetadata) {
            try {
                const parsedMeta = JSON.parse(cachedMetadata);
                setImportMetadata({
                    ...parsedMeta,
                    date: new Date(parsedMeta.date)
                });
            } catch (e) {
                console.error("Error parsing metadata cache", e);
            }
        }

        try {
            // Don't set loading to true if we have cached data, to avoid flickering
            if (!cachedData) setLoading(true);

            const response = await fetch('/api/orders', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    // Token expired or invalid
                    return;
                }
                throw new Error('Failed to fetch data');
            }

            const responseData = await response.json();
            // Handle new response structure: { orders: [], metadata: {} }
            const rawRows = responseData.orders || responseData; // Fallback for backward compatibility
            const metadata = responseData.metadata;

            if (rawRows && Array.isArray(rawRows)) {
                // Normalize data: ensure all fields are strings to prevent .trim() errors
                const normalizedRows = rawRows.map(row => {
                    const newRow: any = {};
                    Object.keys(row).forEach(key => {
                        const val = row[key];
                        newRow[key] = val !== undefined && val !== null ? String(val) : "";
                    });
                    return newRow;
                });

                const processedData = processData(normalizedRows);

                // Only update if data has changed (simple length check for now, or deep compare if needed)
                // For performance, we'll just update it. React handles diffing.
                setData(processedData);

                // Update cache
                try {
                    localStorage.setItem('dashboardData', JSON.stringify(processedData));
                } catch (e) {
                    console.error("Failed to save to localStorage (quota exceeded?)", e);
                }

                // Set metadata
                if (metadata) {
                    const newMeta = {
                        filename: metadata.filename,
                        date: new Date(metadata.date)
                    };
                    // Always update state and cache if metadata is present
                    setImportMetadata(newMeta);
                    localStorage.setItem('dashboardMetadata', JSON.stringify(metadata));
                } else if (processedData.length > 0 && !importMetadata) {
                    // Fallback if no metadata but we have data
                    const fallbackMeta = {
                        filename: 'Dados do Servidor',
                        date: new Date()
                    };
                    setImportMetadata(fallbackMeta);
                } else if (!metadata && importMetadata) {
                    // If API returns no metadata (e.g. cleared), but we have local metadata, 
                    // we might want to keep it OR clear it. 
                    // But since we just fetched fresh data, if metadata is missing, it implies no import.
                    // However, our backend returns null if no import.
                    // So if metadata is null, we should probably clear it?
                    // But let's be safe and keep it if we have data.
                }
            }

        } catch (err: any) {
            console.error("Error loading data:", err);
            setError(err.message);
            // Only show toast if we don't have cached data, to be less annoying
            if (!data.length) {
                toast.error("Erro ao carregar dados do servidor.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user, token]);

    const importData = async (file: File) => {
        if (!user || !token) {
            toast.error("Você precisa estar logado para importar dados.");
            return;
        }

        setLoading(true);
        setError(null);

        const uploadPromise = new Promise(async (resolve, reject) => {
            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Falha no upload');
                }

                // Refresh Data
                await loadData();
                resolve("Dados importados com sucesso!");
            } catch (err: any) {
                reject(err);
            }
        });

        toast.promise(uploadPromise, {
            loading: 'Enviando e processando arquivo...',
            success: (data) => `${data}`,
            error: (err) => `Erro ao importar: ${err.message}`,
        });

        try {
            await uploadPromise;
        } catch (err: any) {
            setError('Erro ao importar arquivo: ' + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const clearData = async () => {
        setData([]);
    };

    return (
        <DashboardContext.Provider value={{ data, loading, error, importMetadata, importData, refreshData: loadData, clearData }}>
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
