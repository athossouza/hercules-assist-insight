import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export const DataImporter = () => {
    const { importData, importMetadata, loading } = useDashboardData();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            await importData(file);
            toast.success("Dados importados com sucesso!");
        } catch (error) {
            toast.error("Erro ao importar dados.");
            console.error(error);
        } finally {
            // Reset input so same file can be selected again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="flex items-center gap-4">
            {importMetadata && (
                <div className="hidden md:flex flex-col items-end text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 font-medium text-foreground">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        <span>Dados Atualizados</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span>{importMetadata.filename}</span>
                        <span>•</span>
                        <span>{format(importMetadata.date, "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                    </div>
                </div>
            )}

            <div className="relative">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xls,.xlsx,.csv"
                    className="hidden"
                />
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleButtonClick}
                    disabled={loading}
                    className="gap-2"
                >
                    {loading ? (
                        "Importando..."
                    ) : (
                        <>
                            <Upload className="h-4 w-4" />
                            <span className="hidden sm:inline">Importar Dados</span>
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};
