"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import { applicationUtils } from "@/utils/application.utils";
import { toast } from "sonner";
import { 
	Calendar, 
	Clock, 
	MapPin, 
	Loader2,
	CheckCircle2,
	XCircle,
	Info,
	User,
	Navigation,
	X,
	Camera,
	RotateCcw,
	ChevronRight,
	ChevronLeft,
	Copy,
	Check
} from "lucide-react";
import Image from "next/image";
import CardBannerImage from "@/assets/images/home/card_banner.png";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import Logo from "@/assets/images/logo.png";
import DarkLogo from "@/assets/images/dark-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EventLocation {
	road?: string;
	town?: string;
	state?: string;
	region?: string;
	amenity?: string;
	postcode?: string;
	country?: string;
	country_code?: string;
	municipality?: string;
	"ISO3166-2-lvl4"?: string;
	state_district?: string;
}

interface EventAttributes {
	id: string;
	name: string;
	description: string;
	event_start: string;
	event_end: string;
	location_optional: boolean;
	location: EventLocation;
	latitude?: string;
	longitude?: string;
	creator_id?: string;
}

interface EventData {
	id: string;
	type: string;
	attributes: EventAttributes;
}

interface EventResponse {
	data: EventData;
	jsonapi: {
		version: string;
	};
}

export default function ParticipantEventPage() {
	const params = useParams();
	const eventId = params?.event_id as string;
	const { theme, resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	const [event, setEvent] = useState<EventData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	
	// Estados para modal de confirmação de presença
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [currentStep, setCurrentStep] = useState(1); // 1 = Foto, 2 = RA + Localização
	const [ra, setRa] = useState("");
	const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
	const [isRequestingLocation, setIsRequestingLocation] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [locationError, setLocationError] = useState<string | null>(null);
	const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
	const [showErrorAnimation, setShowErrorAnimation] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string>("");
	const [linkCopied, setLinkCopied] = useState(false);
	
	// Estados para captura de foto
	const [stream, setStream] = useState<MediaStream | null>(null);
	const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
	const [isAccessingCamera, setIsAccessingCamera] = useState(false);
	const [cameraError, setCameraError] = useState<string | null>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	// Evitar hidratação mismatch
	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		const fetchEvent = async () => {
			try {
				setLoading(true);
				setError(null);

				const baseUrl = applicationUtils.getBaseUrl();
				if (!baseUrl) {
					throw new Error('URL do servidor não configurada');
				}

				const url = `${baseUrl}/participants/${eventId}`;
				
				const response = await fetch(url, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
				});

				if (!response.ok) {
					if (response.status === 404) {
						throw new Error('Evento não encontrado');
					}
					throw new Error(`Erro ao buscar evento: ${response.status}`);
				}

				const data: EventResponse = await response.json();
				setEvent(data.data);
			} catch (err) {
				console.error('Erro ao buscar evento:', err);
				setError(err instanceof Error ? err.message : 'Erro ao carregar evento');
				toast.error(err instanceof Error ? err.message : 'Erro ao carregar evento');
			} finally {
				setLoading(false);
			}
		};

		if (eventId) {
			fetchEvent();
		}
	}, [eventId]);

	// Usar resolvedTheme para considerar o tema do sistema
	const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");
	const logoSrc = isDark ? DarkLogo : Logo;

	const formatDateTime = (dateString: string) => {
		const date = new Date(dateString);
		const day = date.getDate().toString().padStart(2, '0');
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const year = date.getFullYear();
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		
		return {
			date: `${day}/${month}/${year}`,
			time: `${hours}:${minutes}`,
			full: `${day}/${month}/${year} às ${hours}:${minutes}`,
		};
	};

	const formatLocation = (location: EventLocation) => {
		const parts: string[] = [];
		
		if (location.amenity) parts.push(location.amenity);
		if (location.road) parts.push(location.road);
		if (location.town) parts.push(location.town);
		if (location.state) parts.push(location.state);
		
		return parts.length > 0 ? parts.join(', ') : 'Localização não informada';
	};

	// Função para capturar geolocalização
	const requestLocation = () => {
		if (!navigator.geolocation) {
			setLocationError("Geolocalização não suportada pelo seu navegador.");
			return;
		}

		setIsRequestingLocation(true);
		setLocationError(null);

		navigator.geolocation.getCurrentPosition(
			(position) => {
				setCoords({
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
				});
				setIsRequestingLocation(false);
				setLocationError(null);
			},
			(error) => {
				console.error("Erro ao obter localização:", error);
				setIsRequestingLocation(false);
				setLocationError("Permita acesso à localização para continuar.");
			}
		);
	};

	// Funções para câmera
	const startCamera = async () => {
		try {
			// Verificar se a API está disponível
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
				throw new Error("Seu navegador não suporta acesso à câmera. Use um navegador moderno.");
			}

			// Verificar se estamos em contexto seguro (HTTPS ou localhost)
			const isSecureContext = window.isSecureContext || 
				(window.location.protocol === 'https:' || 
				 window.location.hostname === 'localhost' || 
				 window.location.hostname === '127.0.0.1');
			if (!isSecureContext) {
				throw new Error("Acesso à câmera requer HTTPS ou localhost. Por favor, acesse via HTTPS.");
			}

			setIsAccessingCamera(true);
			setCameraError(null);

			// Configuração da câmera - tentar primeiro câmera frontal, depois qualquer câmera disponível
			const constraints: MediaStreamConstraints = {
				video: {
					width: { ideal: 1280 },
					height: { ideal: 720 },
					facingMode: { ideal: 'user' } // Idealmente câmera frontal, mas aceita qualquer câmera
				}
			};

			console.log('🎥 Solicitando acesso à câmera...', constraints);
			const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
			console.log('✅ Acesso à câmera concedido!', mediaStream);

			setStream(mediaStream);
			
			// Aguardar um pouco para garantir que o vídeo está no DOM
			setTimeout(() => {
				if (videoRef.current) {
					videoRef.current.srcObject = mediaStream;
					videoRef.current.play().catch((err) => {
						console.error('Erro ao reproduzir vídeo:', err);
					});
				}
			}, 100);
		} catch (err: any) {
			console.error("❌ Erro ao acessar câmera:", err);
			
			let errorMessage = "Não foi possível acessar a câmera.";
			
			if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
				errorMessage = "Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações do navegador.";
			} else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
				errorMessage = "Nenhuma câmera encontrada. Verifique se há uma câmera conectada.";
			} else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
				errorMessage = "A câmera está sendo usada por outro aplicativo. Feche outros aplicativos que usam a câmera.";
			} else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
				errorMessage = "A câmera não suporta as configurações solicitadas. Tentando configurações alternativas...";
				// Tentar com configurações mais simples
				try {
					const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
					setStream(fallbackStream);
					if (videoRef.current) {
						videoRef.current.srcObject = fallbackStream;
						videoRef.current.play().catch(() => {});
					}
					setIsAccessingCamera(false);
					return;
				} catch (fallbackErr) {
					console.error("Erro no fallback:", fallbackErr);
				}
			} else if (err.message) {
				errorMessage = err.message;
			}
			
			setCameraError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setIsAccessingCamera(false);
		}
	};

	const stopCamera = () => {
		if (stream) {
			stream.getTracks().forEach(track => track.stop());
			setStream(null);
		}
		if (videoRef.current) {
			videoRef.current.srcObject = null;
		}
	};

	const capturePhoto = () => {
		if (!videoRef.current || !canvasRef.current) return;

		const video = videoRef.current;
		const canvas = canvasRef.current;
		const context = canvas.getContext('2d');

		if (!context) return;

		// Ajustar dimensões do canvas para o vídeo
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;

		// Desenhar o frame atual do vídeo no canvas
		context.drawImage(video, 0, 0, canvas.width, canvas.height);

		// Converter para base64
		const photoData = canvas.toDataURL('image/jpeg', 0.8);
		setCapturedPhoto(photoData);
		stopCamera();
	};

	const retakePhoto = () => {
		setCapturedPhoto(null);
		setCameraError(null);
		// Limpar stream anterior antes de iniciar nova
		stopCamera();
		// Aguardar um pouco antes de reiniciar
		setTimeout(() => {
			startCamera();
		}, 100);
	};

	// Iniciar câmera quando o modal abrir e estiver no step 1
	useEffect(() => {
		if (isModalOpen && currentStep === 1 && !capturedPhoto && !stream && !isAccessingCamera) {
			// Aguardar um pouco para garantir que o DOM está pronto
			const timer = setTimeout(() => {
				startCamera();
			}, 300);
			return () => clearTimeout(timer);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isModalOpen, currentStep, capturedPhoto, stream, isAccessingCamera]);

	// Limpar stream ao fechar modal ou desmontar
	useEffect(() => {
		return () => {
			stopCamera();
		};
	}, []);

	// Abrir modal e iniciar câmera no step 1
	const handleOpenModal = () => {
		setIsModalOpen(true);
		setCurrentStep(1);
		setCapturedPhoto(null);
		setRa("");
		setCoords(null);
		setCameraError(null);
		// A câmera será iniciada pelo useEffect quando o modal estiver aberto
	};

	// Fechar modal e limpar tudo
	const handleCloseModal = () => {
		if (isSubmitting) return;
		stopCamera();
		setIsModalOpen(false);
		setCurrentStep(1);
		setCapturedPhoto(null);
		setRa("");
		setCoords(null);
		setLocationError(null);
		setCameraError(null);
	};

	// Avançar para step 2
	const handleNextStep = () => {
		if (capturedPhoto) {
			setCurrentStep(2);
			stopCamera();
			if (!coords) {
				requestLocation();
			}
		}
	};

	// Voltar para step 1
	const handlePreviousStep = () => {
		setCurrentStep(1);
		setCameraError(null);
		// Reiniciar câmera se não houver foto capturada
		if (!capturedPhoto) {
			stopCamera();
			setTimeout(() => {
				startCamera();
			}, 100);
		}
	};

	// Função auxiliar para converter base64 em Blob
	const base64ToBlob = (base64: string, mimeType: string = 'image/jpeg'): Blob => {
		// Remove o prefixo data:image/jpeg;base64, se existir
		const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
		const byteCharacters = atob(base64Data);
		const byteNumbers = new Array(byteCharacters.length);
		
		for (let i = 0; i < byteCharacters.length; i++) {
			byteNumbers[i] = byteCharacters.charCodeAt(i);
		}
		
		const byteArray = new Uint8Array(byteNumbers);
		return new Blob([byteArray], { type: mimeType });
	};

	// Submeter confirmação de presença
	const handleSubmitPresence = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!ra.trim()) {
			toast.error("Por favor, informe seu RA.");
			return;
		}

		if (!coords) {
			toast.error("Localização não disponível. Por favor, permita o acesso à localização.");
			requestLocation();
			return;
		}

		if (!capturedPhoto) {
			toast.error("Por favor, tire uma foto antes de confirmar a presença.");
			return;
		}

		setIsSubmitting(true);

		try {
			const baseUrl = applicationUtils.getBaseUrl();
			if (!baseUrl) {
				throw new Error('URL do servidor não configurada');
			}

			// Criar FormData
			const formData = new FormData();

			// Adicionar dados no formato JSON-API mantendo a estrutura dentro de attributes
			formData.append('data[type]', 'participant');
			formData.append('data[attributes][ra]', ra.trim());
			formData.append('data[attributes][latitude]', coords.latitude.toString());
			formData.append('data[attributes][longitude]', coords.longitude.toString());

			// Converter foto base64 para Blob e adicionar ao FormData como "photo"
			const photoBlob = base64ToBlob(capturedPhoto, 'image/jpeg');
			formData.append('photo', photoBlob, 'photo.jpg');

			const response = await fetch(`${baseUrl}/participants/${eventId}/confirm_presence`, {
				method: 'PATCH',
				// Não definir Content-Type - o navegador vai definir automaticamente com o boundary correto
				body: formData,
			});

			if (response.ok) {
				// Mostrar animação de sucesso
				setShowSuccessAnimation(true);
				setTimeout(() => {
					setShowSuccessAnimation(false);
					handleCloseModal();
				}, 2000); // Fechar após 2 segundos
			} else {
				const errorData = await response.json().catch(() => ({}));
				const errorMsg = errorData.error || errorData.message || `Erro: ${response.status}`;
				setErrorMessage(errorMsg);
				setShowErrorAnimation(true);
				setTimeout(() => {
					setShowErrorAnimation(false);
					setErrorMessage("");
				}, 4000); // Fechar após 4 segundos
			}
		} catch (err) {
			console.error('Erro ao confirmar presença:', err);
			const errorMsg = err instanceof Error ? err.message : "Ocorreu um erro ao confirmar sua presença. Tente novamente.";
			setErrorMessage(errorMsg);
			setShowErrorAnimation(true);
			setTimeout(() => {
				setShowErrorAnimation(false);
				setErrorMessage("");
			}, 4000); // Fechar após 4 segundos
		} finally {
			setIsSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-background">
				{/* Header Simples */}
				<div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
					<div className="container mx-auto flex h-24 items-center justify-between px-6">
						<div className="flex items-center gap-3">
							<ModeToggle />
						</div>
						<Link href="/" className="absolute left-1/2 -translate-x-1/2">
							<Image 
								src={Logo} 
								alt="Presence System" 
								width={300} 
								height={300}
								className="w-auto cursor-pointer transition-opacity hover:opacity-80"
								priority
							/>
						</Link>
						<div className="w-12" /> {/* Spacer para centralizar logo */}
					</div>
				</div>

				<div className="container mx-auto max-w-6xl px-6 py-12 flex items-center justify-center min-h-[60vh]">
					<div className="flex flex-col items-center gap-4">
						<Loader2 className="h-10 w-10 animate-spin text-primary" />
						<p className="text-sm text-muted-foreground font-medium">Carregando evento...</p>
					</div>
				</div>
			</div>
		);
	}

	if (error || !event) {
		return (
			<div className="min-h-screen bg-background">
				{/* Header Simples */}
				<div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
					<div className="container mx-auto flex h-24 items-center justify-between px-6">
						<div className="flex items-center gap-3">
							<ModeToggle />
						</div>
						<Link href="/" className="absolute left-1/2 -translate-x-1/2">
							<Image 
								src={Logo} 
								alt="Presence System" 
								width={300} 
								height={300}
								className="w-auto cursor-pointer transition-opacity hover:opacity-80"
								priority
							/>
						</Link>
						<div className="w-12" /> {/* Spacer para centralizar logo */}
					</div>
				</div>

				<div className="container mx-auto max-w-6xl px-6 py-12">
					<div className="rounded-xl border border-destructive/50 bg-destructive/10 p-12 text-center">
						<XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
						<h2 className="text-2xl font-bold text-foreground mb-2">
							Erro ao carregar evento
						</h2>
						<p className="text-muted-foreground mb-6">
							{error || 'Evento não encontrado'}
						</p>
					</div>
				</div>
			</div>
		);
	}

	const startDateTime = formatDateTime(event.attributes.event_start);
	const endDateTime = formatDateTime(event.attributes.event_end);
	const location = formatLocation(event.attributes.location);

	return (
		<div className="min-h-screen bg-background">
			{/* Header Simples */}
			<div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
				<div className="container mx-auto flex h-24 items-center justify-between px-6">
					<div className="flex items-center gap-3">
						<ModeToggle />
					</div>
					<Link href="/" className="absolute left-1/2 -translate-x-1/2">
						<Image 
							src={logoSrc} 
							alt="Presence System" 
							width={300} 
							height={300}
							className="w-auto cursor-pointer transition-opacity hover:opacity-80"
							priority
						/>
					</Link>
					<div className="w-12" /> {/* Spacer para centralizar logo */}
				</div>
			</div>

			{/* Header com Banner */}
			<div className="relative w-full h-64 md:h-80 overflow-hidden bg-linear-to-r from-[#0288D1] via-[#00ACC1] to-[#4DB6AC]">
				<Image
					src={CardBannerImage}
					alt={event.attributes.name}
					fill
					className="object-cover opacity-40"
					priority
				/>
				<div className="absolute inset-0 bg-linear-to-t from-background via-background/50 to-transparent" />
				
				<div className="relative container mx-auto px-6 py-8">
					<div className="max-w-4xl">
						<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 drop-shadow-lg">
							{event.attributes.name}
						</h1>
						{event.attributes.description && (
							<p className="text-base md:text-lg text-white/90 max-w-3xl leading-relaxed drop-shadow-md">
								{event.attributes.description}
							</p>
						)}
					</div>
				</div>
			</div>

			{/* Conteúdo Principal */}
			<div className="container mx-auto max-w-4xl px-6 py-8 md:py-12">
				{/* Informações do Evento */}
				<div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
					<h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
						<Info className="h-5 w-5 text-primary" />
						Informações do Evento
					</h2>
					
					<div className="space-y-6">
						{/* Data e Hora de Início */}
						<div className="flex items-start gap-4">
							<div className="p-3 rounded-lg bg-primary/10 shrink-0">
								<Calendar className="h-5 w-5 text-primary" />
							</div>
							<div className="flex-1">
								<p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
									Início do Evento
								</p>
								<p className="text-base font-semibold text-foreground">
									{startDateTime.full}
								</p>
							</div>
						</div>

						{/* Data e Hora de Término */}
						<div className="flex items-start gap-4">
							<div className="p-3 rounded-lg bg-primary/10 shrink-0">
								<Clock className="h-5 w-5 text-primary" />
							</div>
							<div className="flex-1">
								<p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
									Término do Evento
								</p>
								<p className="text-base font-semibold text-foreground">
									{endDateTime.full}
								</p>
							</div>
						</div>

						{/* Localização */}
						<div className="flex items-start gap-4">
							<div className="p-3 rounded-lg bg-primary/10 shrink-0">
								<MapPin className="h-5 w-5 text-primary" />
							</div>
							<div className="flex-1">
								<p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
									Local do Evento
								</p>
								<p className="text-base font-medium text-foreground leading-relaxed">
									{location}
								</p>
								<div className="mt-2">
									{event.attributes.location_optional ? (
										<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium">
											<CheckCircle2 className="h-3 w-3" />
											<span>Validação por localização ativa</span>
										</div>
									) : (
										<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/10 text-muted-foreground text-xs font-medium">
											<XCircle className="h-3 w-3" />
											<span>Validação por localização desativada</span>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Botão de Confirmar Presença */}
				<div className="container mx-auto max-w-4xl px-6 pb-8 mt-8">
					<div className="flex justify-center">
						<Button
							onClick={handleOpenModal}
							size="lg"
							className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-6 text-lg font-semibold"
						>
							<User className="h-5 w-5 mr-2" />
							Confirmar Presença
						</Button>
					</div>
				</div>
			</div>

			{/* Modal de Confirmação de Presença */}
			{isModalOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
					onClick={handleCloseModal}
				>
					<div
						className="relative bg-card rounded-2xl border border-border/50 shadow-2xl p-8 max-w-lg w-full animate-in zoom-in-95 duration-200"
						onClick={(e) => e.stopPropagation()}
					>
						{/* Botão de Fechar - Ocultar durante animações */}
						{!showSuccessAnimation && !showErrorAnimation && (
							<div className="absolute top-4 right-4">
								<button
									onClick={handleCloseModal}
									disabled={isSubmitting}
									className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
									aria-label="Fechar modal"
								>
									<X className="h-5 w-5" />
								</button>
							</div>
						)}

						{/* Indicador de Steps - Ocultar quando mostrar animação */}
						{!showSuccessAnimation && !showErrorAnimation && (
							<div className="flex items-center justify-center gap-2 mb-6">
								<div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
									<div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
										currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
									}`}>
										1
									</div>
									<span className="text-sm font-medium hidden sm:inline">Foto</span>
								</div>
								<div className={`h-px w-12 ${currentStep >= 2 ? 'bg-primary' : 'bg-border'}`} />
								<div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
									<div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
										currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
									}`}>
										2
									</div>
									<span className="text-sm font-medium hidden sm:inline">Dados</span>
								</div>
							</div>
						)}

						{/* Animação de Sucesso dentro do Modal */}
						{showSuccessAnimation && (
							<div className="flex flex-col items-center justify-center py-12 animate-in fade-in zoom-in-95 duration-500">
								{/* Círculo de fundo animado */}
								<div className="relative flex items-center justify-center mb-6">
									<div className="absolute w-24 h-24 bg-green-500/20 rounded-full animate-ping" />
									<div className="absolute w-24 h-24 bg-green-500/30 rounded-full animate-pulse" />
									
									{/* Ícone de check */}
									<div className="relative z-10 flex items-center justify-center w-20 h-20 bg-green-500 rounded-full shadow-lg animate-in zoom-in-95 duration-500">
										<CheckCircle2 className="h-12 w-12 text-white" />
									</div>
								</div>
								
								{/* Mensagem de sucesso */}
								<div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
									<h3 className="text-2xl font-bold text-foreground mb-2">
										Presença Confirmada!
									</h3>
									<p className="text-sm text-muted-foreground">
										Sua presença foi registrada com sucesso
									</p>
								</div>
							</div>
						)}

						{/* Animação de Erro dentro do Modal */}
						{showErrorAnimation && (
							<div className="flex flex-col items-center justify-center py-12 animate-in fade-in zoom-in-95 duration-500">
								{/* Círculo de fundo animado */}
								<div className="relative flex items-center justify-center mb-6">
									<div className="absolute w-24 h-24 bg-destructive/20 rounded-full animate-ping" />
									<div className="absolute w-24 h-24 bg-destructive/30 rounded-full animate-pulse" />
									
									{/* Ícone de X */}
									<div className="relative z-10 flex items-center justify-center w-20 h-20 bg-destructive rounded-full shadow-lg animate-in zoom-in-95 duration-500">
										<XCircle className="h-12 w-12 text-white" />
									</div>
								</div>
								
								{/* Mensagem de erro */}
								<div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 px-4">
									<h3 className="text-2xl font-bold text-foreground mb-3">
										Erro ao Confirmar
									</h3>
									<p className="text-sm text-muted-foreground mb-6">
										{errorMessage || "Ocorreu um erro ao confirmar sua presença. Tente novamente."}
									</p>
									<Button
										type="button"
										variant="outline"
										onClick={() => {
											setShowErrorAnimation(false);
											setErrorMessage("");
										}}
										className="mt-4"
									>
										Tentar Novamente
									</Button>
								</div>
							</div>
						)}

						{/* Step 1: Captura de Foto */}
						{currentStep === 1 && !showSuccessAnimation && !showErrorAnimation && (
							<div className="space-y-6">
								<div>
									<h3 className="text-2xl font-bold text-foreground mb-2">
										Tire uma Foto
									</h3>
									<p className="text-sm text-muted-foreground">
										Posicione seu rosto na câmera e tire uma foto
									</p>
								</div>

								{/* Área da Câmera */}
								<div className="relative w-full rounded-xl overflow-hidden bg-muted border-2 border-border" style={{ aspectRatio: '4/3' }}>
									{capturedPhoto ? (
										<div className="relative w-full h-full">
											<img
												src={capturedPhoto}
												alt="Foto capturada"
												className="w-full h-full object-cover"
											/>
											<div className="absolute inset-0 bg-black/20 flex items-center justify-center">
												<div className="text-center">
													<CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
													<p className="text-sm font-medium text-white">Foto capturada!</p>
												</div>
											</div>
										</div>
									) : (
										<div className="relative w-full h-full">
											{stream ? (
												<video
													ref={videoRef}
													autoPlay
													playsInline
													muted
													className="w-full h-full object-cover -scale-x-100"
													onLoadedMetadata={() => {
														if (videoRef.current) {
															videoRef.current.play().catch((err) => {
																console.error('Erro ao reproduzir vídeo:', err);
															});
														}
													}}
												/>
											) : (
												<div className="w-full h-full flex items-center justify-center">
													{isAccessingCamera ? (
														<div className="text-center">
															<Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-2" />
															<p className="text-sm text-muted-foreground">Acessando câmera...</p>
														</div>
													) : cameraError ? (
														<div className="text-center p-4">
															<XCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
															<p className="text-sm text-destructive mb-3">{cameraError}</p>
															<Button
																type="button"
																variant="outline"
																size="sm"
																onClick={startCamera}
															>
																Tentar Novamente
															</Button>
														</div>
													) : (
														<div className="text-center p-4">
															<Camera className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
															<p className="text-sm text-muted-foreground mb-4">
																Clique no botão abaixo para ativar a câmera
															</p>
															<Button
																type="button"
																variant="outline"
																size="sm"
																onClick={startCamera}
																disabled={isAccessingCamera}
																className="gap-2"
															>
																{isAccessingCamera ? (
																	<>
																		<Loader2 className="h-4 w-4 animate-spin" />
																		Ativando...
																	</>
																) : (
																	<>
																		<Camera className="h-4 w-4" />
																		Ativar Câmera
																	</>
																)}
															</Button>
														</div>
													)}
												</div>
											)}
										</div>
									)}
									<canvas ref={canvasRef} className="hidden" />
								</div>

								{/* Botões do Step 1 */}
								<div className="flex gap-3">
									<Button
										type="button"
										variant="outline"
										onClick={handleCloseModal}
										disabled={isSubmitting}
										className="flex-1"
									>
										Cancelar
									</Button>
									{capturedPhoto ? (
										<>
											<Button
												type="button"
												variant="outline"
												onClick={retakePhoto}
												disabled={isSubmitting}
												className="flex-1"
											>
												<RotateCcw className="h-4 w-4 mr-2" />
												Tirar Novamente
											</Button>
											<Button
												type="button"
												onClick={handleNextStep}
												disabled={isSubmitting}
												className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
											>
												Continuar
												<ChevronRight className="h-4 w-4 ml-2" />
											</Button>
										</>
									) : (
										<Button
											type="button"
											onClick={capturePhoto}
											disabled={!stream || isAccessingCamera}
											className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
										>
											<Camera className="h-4 w-4 mr-2" />
											Capturar Foto
										</Button>
									)}
								</div>
							</div>
						)}

						{/* Step 2: RA e Localização */}
						{currentStep === 2 && !showSuccessAnimation && !showErrorAnimation && (
							<form onSubmit={handleSubmitPresence} className="space-y-6">
								<div>
									<h3 className="text-2xl font-bold text-foreground mb-2">
										Informe seus Dados
									</h3>
									<p className="text-sm text-muted-foreground">
										Preencha seu RA e confirme sua localização
									</p>
								</div>

							{/* Status da Localização */}
							<div className="p-4 rounded-lg border bg-secondary/30">
								<div className="flex items-start gap-3">
									<div className={`
										p-2 rounded-lg shrink-0
										${coords 
											? 'bg-green-500/20' 
											: isRequestingLocation 
												? 'bg-yellow-500/20' 
												: 'bg-muted/50'
										}
									`}>
										{coords ? (
											<CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
										) : isRequestingLocation ? (
											<Loader2 className="h-5 w-5 text-yellow-600 dark:text-yellow-400 animate-spin" />
										) : (
											<Navigation className="h-5 w-5 text-muted-foreground" />
										)}
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-semibold text-foreground mb-1">
											{coords 
												? "Localização capturada" 
												: isRequestingLocation 
													? "Solicitando localização..." 
													: "Aguardando permissão de localização"
											}
										</p>
										{coords ? (
											<p className="text-xs text-muted-foreground">
												Lat: {coords.latitude.toFixed(6)}, Long: {coords.longitude.toFixed(6)}
											</p>
										) : (
											<p className="text-xs text-muted-foreground">
												{locationError || "Permita o acesso à localização para continuar"}
											</p>
										)}
									</div>
								</div>
								{!coords && !isRequestingLocation && (
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={requestLocation}
										className="w-full mt-3"
									>
										<Navigation className="h-4 w-4 mr-2" />
										Solicitar Localização
									</Button>
								)}
							</div>

							{/* Input de RA */}
							<div>
								<Input
									label="RA (Registro Acadêmico)"
									type="text"
									placeholder="Ex: 249693-1"
									value={ra}
									onChange={(e) => setRa(e.target.value)}
									icon={<User className="h-4 w-4 text-primary" />}
									iconPosition="left"
									required
									disabled={isSubmitting}
									className="text-base"
								/>
							</div>

								{/* Botões do Step 2 */}
								<div className="flex gap-3">
									<Button
										type="button"
										variant="outline"
										onClick={handlePreviousStep}
										disabled={isSubmitting}
										className="flex-1"
									>
										<ChevronLeft className="h-4 w-4 mr-2" />
										Voltar
									</Button>
									<Button
										type="submit"
										disabled={!coords || !ra.trim() || !capturedPhoto || isSubmitting}
										className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
										loading={isSubmitting}
										loadingIcon={<Loader2 className="h-4 w-4 animate-spin" />}
									>
										{isSubmitting ? "Confirmando..." : "Confirmar Presença"}
									</Button>
								</div>
							</form>
						)}
					</div>
				</div>
			)}

		</div>
	);
}

