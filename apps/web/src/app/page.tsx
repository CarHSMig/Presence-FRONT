"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import AuthenticatedLayout from "@/components/authenticated-layout";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import BannerImage from "@/assets/images/home/banner_peoples.png";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { authUtils } from "@/utils/auth.utils";
import { applicationUtils } from "@/utils/application.utils";
import { toast } from "sonner";
import { EventCard } from "@/components/EventCard";

interface EventAttributes {
	id: string;
	name: string;
	description: string;
	event_start: string;
	event_end: string;
	location: {
		road?: string;
		town?: string;
		state?: string;
		amenity?: string;
		postcode?: string;
		country?: string;
	};
	latitude?: string;
	longitude?: string;
}

interface Event {
	id: string;
	type: string;
	attributes: EventAttributes;
}

export default function Home() {
	const { user } = useAuth();
	const router = useRouter();
	const [events, setEvents] = useState<Event[]>([]);
	const [loadingEvents, setLoadingEvents] = useState(true);


	// Buscar eventos
	useEffect(() => {
		const fetchEvents = async () => {
			try {
				setLoadingEvents(true);
				const token = authUtils.getToken();
				if (!token) return;

				const baseUrl = applicationUtils.getBaseUrl();
				if (!baseUrl) return;

				const response = await fetch(`${baseUrl}/admin/events`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
					},
				});

				if (response.ok) {
					const data = await response.json();
					// Garantir que data.data seja um array (mesmo se vier vazio)
					const eventsData = Array.isArray(data.data) ? data.data : [];
					setEvents(eventsData);
				} else {
					console.error('Erro ao buscar eventos:', response.status);
				}
			} catch (error) {
				console.error('Erro ao buscar eventos:', error);
				toast.error('Erro ao carregar eventos');
			} finally {
				setLoadingEvents(false);
			}
		};

		fetchEvents();
	}, []);

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

				{/* Seção de Eventos - Destaque */}
				<section className="bg-linear-to-b from-background via-background to-secondary/10 py-12 md:py-16">
					<div className="container mx-auto max-w-7xl px-6">
						{/* Header da Seção */}
						<div className="text-center mb-10 md:mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
							<div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-4">
								<CalendarIcon className="h-6 w-6 text-primary" />
							</div>
							<h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
								Meus Eventos
							</h2>
							<p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
								Visualize, gerencie e acompanhe todos os seus eventos em um só lugar
							</p>
						</div>

						{/* Conteúdo dos Cards */}
						{loadingEvents ? (
							<div className="flex items-center justify-center py-20">
								<div className="flex flex-col items-center gap-4">
									<Loader2 className="h-10 w-10 animate-spin text-primary" />
									<p className="text-sm text-muted-foreground font-medium">Carregando eventos...</p>
								</div>
							</div>
						) : !events || events.length === 0 ? (
							<div className="max-w-2xl mx-auto rounded-2xl border-2 border-dashed border-border/50 bg-card p-12 md:p-16 text-center animate-in fade-in zoom-in duration-500 shadow-lg">
								<div className="inline-flex items-center justify-center p-5 rounded-full bg-primary/10 mb-6 animate-in zoom-in duration-500 delay-200">
									<CalendarIcon className="h-14 w-14 text-primary" />
								</div>
								<h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
									Nenhum evento cadastrado
								</h3>
								<p className="text-base md:text-lg text-muted-foreground mb-10 leading-relaxed max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
									Você ainda não possui eventos cadastrados no sistema.{' '}
									Comece criando seu primeiro evento para gerenciar suas atividades e participantes de forma organizada.
								</p>
								<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
									<Button
										onClick={() => router.push("/eventos/criar" as any)}
										size="lg"
										className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200 px-10 py-4 text-base font-semibold hover:scale-105"
									>
										Criar Primeiro Evento
									</Button>
								</div>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
								{events.map((event, index) => (
									<EventCard key={event.id} event={event} index={index} />
								))}
							</div>
						)}
					</div>
				</section>
			</AuthenticatedLayout>
		</ProtectedRoute>
	);
}
