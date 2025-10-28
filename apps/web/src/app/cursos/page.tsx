"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import AuthenticatedLayout from "@/components/authenticated-layout";

export default function CursosPage() {
	return (
		<ProtectedRoute>
			<AuthenticatedLayout className="p-6">
				<div className="container mx-auto max-w-6xl">
					<h1 className="text-3xl font-bold mb-6">Cursos</h1>
					<p className="text-muted-foreground">
						Página de cursos em desenvolvimento...
					</p>
				</div>
			</AuthenticatedLayout>
		</ProtectedRoute>
	);
}

