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

        try {
            setLoading(true);

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

            const rawRows = await response.json();

            if (rawRows && Array.isArray(rawRows)) {
                const processedData = processData(rawRows);
                setData(processedData);

                // Set metadata if we have data (simplified for now as API doesn't return metadata yet)
                if (processedData.length > 0) {
                    setImportMetadata({
                        filename: 'Dados do Servidor',
                        date: new Date()
                    });
                }
            }

        } catch (err: any) {
            console.error("Error loading data:", err);
            setError(err.message);
            toast.error("Erro ao carregar dados do servidor.");
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

            toast.success("Dados enviados para a nuvem com sucesso!");

            // Refresh Data
            await loadData();

        } catch (err: any) {
            setError('Erro ao importar arquivo: ' + err.message);
            console.error(err);
            toast.error("Erro ao salvar dados: " + err.message);
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
