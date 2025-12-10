"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, X, Loader2 } from "lucide-react";

interface ConfirmDeleteModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	isLoading?: boolean;
}

export function ConfirmDeleteModal({
	isOpen,
	onClose,
	onConfirm,
	title,
	message,
	confirmText = "Deletar",
	cancelText = "Cancelar",
	isLoading = false,
}: ConfirmDeleteModalProps) {
	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
			onClick={() => !isLoading && onClose()}
		>
			<div
				className="relative bg-card rounded-2xl border border-border/50 shadow-2xl p-6 md:p-8 max-w-md w-full animate-in zoom-in-95 duration-200"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Botão de Fechar */}
				<button
					onClick={() => !isLoading && onClose()}
					disabled={isLoading}
					className="absolute top-4 right-4 p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
					aria-label="Fechar modal"
				>
					<X className="h-5 w-5" />
				</button>

				{/* Conteúdo do Modal */}
				<div className="flex flex-col items-center text-center space-y-4">
					{/* Ícone de Alerta */}
					<div className="p-4 rounded-full bg-destructive/10">
						<AlertCircle className="h-12 w-12 text-destructive" />
					</div>

					{/* Título e Mensagem */}
					<div className="space-y-2">
						<h3 className="text-2xl font-bold text-foreground">
							{title}
						</h3>
						<p className="text-sm text-muted-foreground whitespace-pre-line">
							{message}
						</p>
						<p className="text-sm font-medium text-destructive">
							Esta ação não pode ser desfeita.
						</p>
					</div>

					{/* Botões de Ação */}
					<div className="flex gap-4 w-full pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={isLoading}
							className="flex-1"
						>
							{cancelText}
						</Button>
						<Button
							type="button"
							variant="destructive"
							onClick={onConfirm}
							disabled={isLoading}
							className="flex-1"
							loading={isLoading}
							loadingIcon={<Loader2 className="h-4 w-4 animate-spin" />}
						>
							{isLoading ? 'Deletando...' : confirmText}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

