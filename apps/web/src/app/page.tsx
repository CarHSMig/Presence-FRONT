"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/header";

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
			<Header />
			<div className="container mx-auto max-w-3xl px-4 py-2">
				<pre className="overflow-x-auto font-mono text-sm">{TITLE_TEXT}</pre>
				<div className="grid gap-6">
					<section className="rounded-lg border p-4">
						<h2 className="mb-2 font-medium">Bem-vindo, {user?.name}!</h2>
						<p className="text-sm text-gray-600 dark:text-gray-400">
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
		</ProtectedRoute>
	);
}
