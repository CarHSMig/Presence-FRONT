"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import AuthenticatedLayout from "@/components/authenticated-layout";

const TITLE_TEXT = `
 ██████╗ ███████╗████████╗████████╗███████╗██████╗
 ██╔══██╗██╔════╝╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗
 ██████╔╝█████╗     ██║      ██║   █████╗  ██████╔╝
 ██╔══██╗██╔══╝     ██║      ██║   ██╔══╝  ██╔══██╗
 ██████╔╝███████╗   ██║      ██║   ███████╗██║  ██║
 ╚═════╝ ╚══════╝   ╚═╝      ╚═╝   ╚══════╝╚═╝  ╚═╝

 ████████╗    ███████╗████████╗ █████╗  ██████╗██╗  ██╗
 ╚══██╔══╝    ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝
    ██║       ███████╗   ██║   ███████║██║     █████╔╝
    ██║       ╚════██║   ██║   ██╔══██║██║     ██╔═██╗
    ██║       ███████║   ██║   ██║  ██║╚██████╗██║  ██╗
    ╚═╝       ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
 `;

export default function Home() {
	const { user } = useAuth();

	return (
		<ProtectedRoute>
			<AuthenticatedLayout className="p-6">
				<div className="container mx-auto max-w-3xl">
					<pre className="overflow-x-auto font-mono text-sm">{TITLE_TEXT}</pre>
					<div className="grid gap-6 mt-6">
						<section className="rounded-lg border p-4">
							<h2 className="mb-2 font-medium">Bem-vindo, {user?.name}!</h2>
							<p className="text-sm text-muted-foreground">
								Você está logado com sucesso no sistema.
							</p>
						</section>
						<section className="rounded-lg border p-4">
							<h2 className="mb-2 font-medium">API Status</h2>
							<p className="text-sm text-green-600 dark:text-green-400">
								✅ Conectado e autenticado
							</p>
						</section>
					</div>
				</div>
			</AuthenticatedLayout>
		</ProtectedRoute>
	);
}
