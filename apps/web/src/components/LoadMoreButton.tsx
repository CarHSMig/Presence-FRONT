"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadMoreButtonProps {
	onClick: () => void;
	loading?: boolean;
	hasMore?: boolean;
	className?: string;
}

export function LoadMoreButton({ onClick, loading = false, hasMore = true, className }: LoadMoreButtonProps) {
	if (!hasMore) {
		return (
			<div className={cn("text-center py-6", className)}>
				<p className="text-sm text-muted-foreground">
					Todos os registros foram carregados
				</p>
			</div>
		);
	}

	return (
		<div className={cn("flex justify-center py-6", className)}>
			<Button
				onClick={onClick}
				disabled={loading}
				variant="outline"
				className="min-w-[200px]"
			>
				{loading ? (
					<>
						<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						Carregando...
					</>
				) : (
					"Carregar Mais"
				)}
			</Button>
		</div>
	);
}

