import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ServiceOrder } from '@/types/dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import localforage from 'localforage';

// Configure localforage
localforage.config({
    name: 'dashboard-hercules',
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
    user: any; // Using any for simplicity, but ideally should be User type
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

        // 1. Load cache from localforage (IndexedDB)
        let cachedData: ServiceOrder[] | null = null;
        let cachedMetadata: ImportMetadata | null = null;
        let parsedMetadata: ImportMetadata | null = null;

        try {
            cachedData = await localforage.getItem<ServiceOrder[]>('dashboardData');
            const rawMetadata = await localforage.getItem<any>('dashboardMetadata');

            if (rawMetadata) {
                cachedMetadata = rawMetadata;
                parsedMetadata = { ...rawMetadata, date: new Date(rawMetadata.date) };
                setImportMetadata(parsedMetadata);
            }

            if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
                setData(cachedData);
                setLoading(false); // Show cached data immediately
            }
        } catch (e) {
            console.error("Error reading from localforage", e);
        }

        try {
            // 2. Check server metadata to see if we need to update
            // Don't set loading true yet if we have cache
            if (!cachedData) setLoading(true);

            const metaResponse = await fetch(`/api/orders/metadata?t=${new Date().getTime()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                }
            });

            if (!metaResponse.ok) throw new Error('Failed to fetch metadata');

            const { metadata: serverMetadata } = await metaResponse.json();

            // 3. Compare metadata
            let needsUpdate = true;

            if (parsedMetadata && serverMetadata) {
                const filenameMatch = serverMetadata.filename === parsedMetadata.filename;
                const serverDate = new Date(serverMetadata.date).getTime();
                const localDate = parsedMetadata.date.getTime();
                // Allow 2 seconds tolerance for potential precision loss
                const dateMatch = Math.abs(serverDate - localDate) < 2000;

                if (filenameMatch && dateMatch) {
                    needsUpdate = false;
                } else {
                    console.log(`[Cache] Update needed. Filename match: ${filenameMatch}, Date match: ${dateMatch}`);
                    console.log(`[Cache] Server: ${serverMetadata.filename} (${serverMetadata.date})`);
                    console.log(`[Cache] Local: ${parsedMetadata.filename} (${parsedMetadata.date.toISOString()})`);
                }
            } else {
                console.log("[Cache] Missing metadata (local or server). Forcing update.");
            }

            // If cache is valid and metadata matches, we are done!
            if (!needsUpdate && cachedData) {
                console.log("[Cache] Cache is up to date. Skipping fetch.");
                setLoading(false);
                return;
            }

            console.log("[Cache] Cache outdated or missing. Fetching fresh data...");
            if (cachedData) setLoading(true); // Show loading if we are updating existing data

            // 4. Fetch full data if needed
            const response = await fetch(`/api/orders?t=${new Date().getTime()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) return;
                throw new Error('Failed to fetch data');
            }

            const responseData = await response.json();
            const rawRows = responseData.orders || responseData;
            const metadata = responseData.metadata;

            if (rawRows && Array.isArray(rawRows)) {
                const normalizedRows = rawRows.map(row => {
                    const newRow: any = {};
                    Object.keys(row).forEach(key => {
                        const val = row[key];
                        newRow[key] = val !== undefined && val !== null ? String(val) : "";
                    });
                    return newRow;
                });

                const processedData = processData(normalizedRows);
                setData(processedData);

                try {
                    await localforage.setItem('dashboardData', processedData);
                } catch (e) {
                    console.error("Failed to save to localforage", e);
                }

                if (metadata) {
                    const newMeta = {
                        filename: metadata.filename,
                        date: new Date(metadata.date)
                    };
                    setImportMetadata(newMeta);
                    await localforage.setItem('dashboardMetadata', metadata);
                }
            }

        } catch (err: any) {
            console.error("Error loading data:", err);
            setError(err.message);
            if (!data.length) toast.error("Erro ao carregar dados do servidor.");
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

        // Clear cache immediately
        try {
            await localforage.removeItem('dashboardData');
            await localforage.removeItem('dashboardMetadata');
        } catch (e) {
            console.error("Error clearing localforage", e);
        }

        setData([]); // Clear current data view
        setImportMetadata(null);

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
        await localforage.clear();
    };

    return (
        <DashboardContext.Provider value={{ data, loading, error, importMetadata, importData, refreshData: loadData, clearData, user }}>
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
