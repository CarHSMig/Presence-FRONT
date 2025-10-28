"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import AuthenticatedLayout from "@/components/authenticated-layout";

export default function EventosPage() {
	return (
		<ProtectedRoute>
			<AuthenticatedLayout className="p-6">
				<div className="container mx-auto max-w-6xl">
					<h1 className="text-3xl font-bold mb-6">Eventos</h1>
					<p className="text-muted-foreground">
						Página de eventos em desenvolvimento...
					</p>
				</div>
			</AuthenticatedLayout>
		</ProtectedRoute>
	);
}

