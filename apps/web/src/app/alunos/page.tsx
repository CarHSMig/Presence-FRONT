"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import AuthenticatedLayout from "@/components/authenticated-layout";

export default function AlunosPage() {
	return (
		<ProtectedRoute>
			<AuthenticatedLayout className="p-6">
				<div className="container mx-auto max-w-6xl">
					<h1 className="text-3xl font-bold mb-6">Alunos</h1>
					<p className="text-muted-foreground">
						Página de alunos em desenvolvimento...
					</p>
				</div>
			</AuthenticatedLayout>
		</ProtectedRoute>
	);
}

