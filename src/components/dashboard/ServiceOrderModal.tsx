import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ServiceOrder } from "@/types/dashboard";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ServiceOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: ServiceOrder[];
    title?: string;
}

export const ServiceOrderModal = ({
    isOpen,
    onClose,
    data,
    title = "Detalhes das Ordens de Serviço",
}: ServiceOrderModalProps) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(data.length / itemsPerPage);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = data.slice(startIndex, startIndex + itemsPerPage);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{title} ({data.length} registros)</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-auto min-h-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>OS</TableHead>
                                <TableHead>Data Abertura</TableHead>
                                <TableHead>Produto</TableHead>
                                <TableHead>Defeito</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Finalidade</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentData.map((order, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{order.OS}</TableCell>
                                    <TableCell>{order["Data Abertura"]?.split(' ')[0]}</TableCell>
                                    <TableCell className="max-w-[200px]" title={order.relatedItems?.map(i => i["Desc Produto"]).join(", ") || order["Desc Produto"]}>
                                        <div className="flex flex-col gap-1">
                                            {Array.from(new Set(order.relatedItems?.map(i => i["Desc Produto"]) || [order["Desc Produto"]])).map((prod, i) => (
                                                <span key={i} className="truncate block text-xs border-b last:border-0 pb-1 last:pb-0">
                                                    {prod}
                                                </span>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[200px]" title={order.relatedItems?.map(i => i["Defeito Constatado"]).join(", ") || order["Defeito Constatado"]}>
                                        <div className="flex flex-col gap-1">
                                            {Array.from(new Set(order.relatedItems?.map(i => i["Defeito Constatado"]) || [order["Defeito Constatado"]])).map((def, i) => (
                                                <span key={i} className="truncate block text-xs border-b last:border-0 pb-1 last:pb-0">
                                                    {def}
                                                </span>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>{order.Status}</TableCell>
                                    <TableCell>{order.Finalidade}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {data.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <p>Nenhum registro encontrado com os filtros atuais.</p>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                        Página {currentPage} de {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
