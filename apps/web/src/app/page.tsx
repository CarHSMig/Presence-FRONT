"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import AuthenticatedLayout from "@/components/authenticated-layout";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import BannerImage from "@/assets/images/home/banner_peoples.png";

export default function Home() {
	const { user } = useAuth();
	const router = useRouter();

	return (
		<ProtectedRoute>
			<AuthenticatedLayout className="p-0">
				{/* Banner com gradiente, imagem e botão */}
				<section className="relative w-full overflow-hidden bg-linear-to-r from-[#0288D1] via-[#00ACC1] to-[#4DB6AC] shadow-xl">
					{/* Overlay sutil para melhorar legibilidade do texto */}
					<div className="absolute inset-0 bg-linear-to-r from-black/5 to-transparent pointer-events-none" />
					
					<div className="container mx-auto px-6 relative z-10">
						<div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 min-h-[280px] md:min-h-[320px] py-8 md:py-12">
							{/* Texto do lado esquerdo */}
							<div className="flex-1 flex flex-col justify-center text-center md:text-left space-y-4 md:space-y-6">
								<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg leading-tight animate-in fade-in slide-in-from-left-8 duration-700 delay-200">
									<span className="inline-block animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
										Gerencie
									</span>
									{' '}
									<span className="inline-block animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
										seus
									</span>
									{' '}
									<span className="inline-block animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
										eventos
									</span>
									{' '}
									<span className="inline-block animate-in fade-in slide-in-from-bottom-4 duration-500 delay-600">
										com
									</span>
									{' '}
									<span className="inline-block animate-in fade-in slide-in-from-bottom-4 duration-500 delay-700">
										facilidade
									</span>
								</h1>
								<p className="text-base md:text-lg lg:text-xl text-white/90 max-w-2xl leading-relaxed drop-shadow-md animate-in fade-in slide-in-from-left-8 duration-700 delay-800">
									Sistema completo de validação de presença para seus eventos.{' '}
									Crie, gerencie e controle a participação de forma simples e eficiente.
								</p>
								{/* Botão posicionado abaixo do texto */}
								<div className="flex justify-center md:justify-start pt-2 animate-in fade-in slide-in-from-left-8 duration-700 delay-900">
									<Button
										onClick={() => router.push("/eventos/criar" as any)}
										className="bg-white text-[#4DB6AC] hover:bg-white/95 hover:text-[#4DB6AC] border-2 border-white/20 hover:border-white font-semibold px-8 py-3 shadow-2xl hover:shadow-white/20 transition-all hover:scale-105 text-base"
									>
										Criar evento
									</Button>
								</div>
							</div>

							{/* Imagem do lado direito */}
							<div className="flex items-center justify-center md:justify-end">
								<div className="relative w-full max-w-xs md:max-w-md lg:max-w-lg drop-shadow-2xl animate-in fade-in zoom-in duration-700 delay-300">
									<Image
										src={BannerImage}
										alt="Pessoas em evento"
										width={600}
										height={600}
										className="object-contain w-full"
										priority
									/>
								</div>
							</div>
						</div>
					</div>
				</section>

				<div className="container mx-auto max-w-6xl px-6 pt-6">
					<div className="grid gap-6">
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
