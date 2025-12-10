"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthenticatedLayout from "@/components/authenticated-layout";
import { authUtils } from "@/utils/auth.utils";
import { applicationUtils } from "@/utils/application.utils";
import { toast } from "sonner";
import { 
	Calendar, 
	Clock, 
	MapPin, 
	GraduationCap, 
	Users, 
	ArrowLeft, 
	Loader2,
	CheckCircle2,
	XCircle,
	Info,
	QrCode,
	Maximize2,
	X,
	ChevronLeft,
	ChevronRight,
	UserCheck,
	UserX,
	Edit,
	FileText,
	AlertCircle,
	Sparkles,
	Download,
	FileSpreadsheet,
	Copy,
	Check
} from "lucide-react";
import QRCodeSVG from "react-qr-code";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Multiselect, type MultiselectOption } from '@/components/ui/multiselect';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useForm } from '@tanstack/react-form';
import { createEventSchema, type CreateEventFormData } from '@/validators/event.validator';
import Image from "next/image";
import CardBannerImage from "@/assets/images/home/card_banner.png";

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
	face_auth?: boolean;
}

interface CourseAttributes {
	id: string;
	name: string;
	periods: number;
}

interface Course {
	id: string;
	type: string;
	attributes: CourseAttributes;
}

interface ClassRoomAttributes {
	name: string;
	period: number;
	course: {
		id: string;
		name: string;
		periods: number;
	};
}

interface ClassRoom {
	id: string;
	type: string;
	attributes: ClassRoomAttributes;
}

interface EventData {
	id: string;
	type: string;
	attributes: EventAttributes;
	relationships: {
		courses: {
			data: Array<{ type: string; id: string }>;
		};
		class_rooms: {
			data: Array<{ type: string; id: string }>;
		};
	};
}

interface EventResponse {
	data: EventData;
	included: Array<Course | ClassRoom>;
	meta: {
		presence_url: string;
	};
}

interface ParticipantAttributes {
	id: string;
	present: boolean;
	location: string | null;
	event_id: string;
	student_id: string;
	student_ra: string;
	student_name: string;
	email: string | null;
}

interface Participant {
	id: string;
	type: string;
	attributes: ParticipantAttributes;
}

interface ParticipantsResponse {
	data: Participant[];
	jsonapi: {
		version: string;
	};
}

export default function EventoDetailPage() {
	const params = useParams();
	const router = useRouter();
	const eventId = params?.id as string;

	const [event, setEvent] = useState<EventData | null>(null);
	const [courses, setCourses] = useState<Course[]>([]);
	const [classRooms, setClassRooms] = useState<ClassRoom[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [presenceUrl, setPresenceUrl] = useState<string | null>(null);
	const [showQrModal, setShowQrModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	
	// Estados para edição
	const [editCourses, setEditCourses] = useState<Course[]>([]);
	const [editClassRooms, setEditClassRooms] = useState<ClassRoom[]>([]);
	const [loadingEditCourses, setLoadingEditCourses] = useState(false);
	const [loadingEditClassRooms, setLoadingEditClassRooms] = useState(false);
	const [selectedEditCourseIds, setSelectedEditCourseIds] = useState<string[]>([]);
	const [showEditValidationErrors, setShowEditValidationErrors] = useState(false);
	
	// Estados para participantes
	const [participants, setParticipants] = useState<Participant[]>([]);
	const [loadingParticipants, setLoadingParticipants] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMoreParticipants, setHasMoreParticipants] = useState(true);
	const [isExporting, setIsExporting] = useState(false);
	const [updatingPresence, setUpdatingPresence] = useState<Record<string, boolean>>({});
	const [linkCopied, setLinkCopied] = useState(false);
	const perPage = 20;

	useEffect(() => {
		const fetchEvent = async () => {
			try {
				setLoading(true);
				setError(null);

				const token = authUtils.getToken();
				if (!token) {
					toast.error('Você precisa estar autenticado');
					router.push('/login');
					return;
				}

				const baseUrl = applicationUtils.getBaseUrl();
				if (!baseUrl) {
					throw new Error('URL do servidor não configurada');
				}

				const url = `${baseUrl}/admin/events/${eventId}?include=courses,class_rooms`;
				
				const response = await fetch(url, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
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

				// Salvar presence_url
				if (data.meta?.presence_url) {
					setPresenceUrl(data.meta.presence_url);
				}

				// Separar cursos e turmas do included
				const fetchedCourses: Course[] = [];
				const fetchedClassRooms: ClassRoom[] = [];

				data.included?.forEach((item) => {
					if (item.type === 'course') {
						fetchedCourses.push(item as Course);
					} else if (item.type === 'class_rooms') {
						fetchedClassRooms.push(item as ClassRoom);
					}
				});

				setCourses(fetchedCourses);
				setClassRooms(fetchedClassRooms);
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
	}, [eventId, router]);

	// Função para copiar o link de presença
	const handleCopyLink = async () => {
		if (!presenceUrl) {
			toast.error('Link de presença não disponível');
			return;
		}

		try {
			await navigator.clipboard.writeText(presenceUrl);
			setLinkCopied(true);
			toast.success('Link copiado para a área de transferência!');
			
			// Resetar o estado após 2 segundos
			setTimeout(() => {
				setLinkCopied(false);
			}, 2000);
		} catch (error) {
			console.error('Erro ao copiar link:', error);
			toast.error('Erro ao copiar link. Tente novamente.');
		}
	};

	// Função para exportar participantes
	const handleExportParticipants = async (format: 'csv' | 'xlsx') => {
		if (!eventId) {
			toast.error('ID do evento não encontrado');
			return;
		}

		try {
			setIsExporting(true);
			const token = authUtils.getToken();
			if (!token) {
				toast.error('Você precisa estar autenticado');
				return;
			}

			const baseUrl = applicationUtils.getBaseUrl();
			if (!baseUrl) {
				throw new Error('URL do servidor não configurada');
			}

			const url = `${baseUrl}/admin/events/${eventId}/participants/export_participants?format=${format}`;
			
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.message || 
					errorData.error ||
					`Erro ao exportar participantes: ${response.status} ${response.statusText}`
				);
			}

			// Obter o blob do arquivo
			const blob = await response.blob();
			
			// Criar URL temporária para download
			const downloadUrl = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = downloadUrl;
			
			// Definir nome do arquivo baseado no formato
			const extension = format === 'csv' ? 'csv' : 'xlsx';
			const eventName = event?.attributes.name || 'evento';
			const sanitizedEventName = eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
			link.download = `participantes_${sanitizedEventName}_${new Date().toISOString().split('T')[0]}.${extension}`;
			
			// Trigger download
			document.body.appendChild(link);
			link.click();
			
			// Limpar
			document.body.removeChild(link);
			window.URL.revokeObjectURL(downloadUrl);

			toast.success(`Participantes exportados com sucesso em formato ${format.toUpperCase()}!`);
		} catch (error) {
			console.error('Erro ao exportar participantes:', error);
			toast.error(
				error instanceof Error 
					? error.message 
					: 'Erro ao exportar participantes. Tente novamente.'
			);
		} finally {
			setIsExporting(false);
		}
	};

	// Buscar participantes
	useEffect(() => {
		const fetchParticipants = async () => {
			if (!eventId) return;

			try {
				setLoadingParticipants(true);
				const token = authUtils.getToken();
				if (!token) return;

				const baseUrl = applicationUtils.getBaseUrl();
				if (!baseUrl) return;

				// Tentar usar page se disponível, senão usar offset
				const offset = (currentPage - 1) * perPage;
				const url = `${baseUrl}/admin/events/${eventId}/participants?per_page=${perPage}&page=${currentPage}&q[s]=student_name+asc`;
				
				const response = await fetch(url, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
					},
				});

				if (!response.ok) {
					// Se falhar com page, tentar sem page (buscar todos)
					if (currentPage === 1) {
						const urlWithoutPage = `${baseUrl}/admin/events/${eventId}/participants?per_page=${perPage}&q[s]=student_name+asc`;
						const retryResponse = await fetch(urlWithoutPage, {
							method: 'GET',
							headers: {
								'Content-Type': 'application/json',
								'Authorization': `Bearer ${token}`,
							},
						});

						if (!retryResponse.ok) {
							throw new Error(`Erro ao buscar participantes: ${retryResponse.status}`);
						}

						const retryData: ParticipantsResponse = await retryResponse.json();
						setParticipants(retryData.data);
						setHasMoreParticipants(retryData.data.length === perPage);
						return;
					} else {
						throw new Error(`Erro ao buscar participantes: ${response.status}`);
					}
				}

				const data: ParticipantsResponse = await response.json();
				
				if (currentPage === 1) {
					setParticipants(data.data);
				} else {
					setParticipants(prev => [...prev, ...data.data]);
				}

				// Verificar se há mais participantes
				setHasMoreParticipants(data.data.length === perPage);
			} catch (err) {
				console.error('Erro ao buscar participantes:', err);
				if (currentPage === 1) {
					toast.error('Erro ao carregar participantes');
				} else {
					toast.error('Erro ao carregar mais participantes');
				}
			} finally {
				setLoadingParticipants(false);
			}
		};

		if (eventId) {
			fetchParticipants();
		}
	}, [eventId, currentPage]);

	const loadMoreParticipants = () => {
		if (!loadingParticipants && hasMoreParticipants) {
			setCurrentPage(prev => prev + 1);
		}
	};

	// Função para atualizar presença do participante
	const handleUpdatePresence = async (participantId: string, present: boolean) => {
		try {
			setUpdatingPresence(prev => ({ ...prev, [participantId]: true }));

			const token = authUtils.getToken();
			if (!token) {
				toast.error('Você precisa estar autenticado');
				router.push('/login');
				return;
			}

			const baseUrl = applicationUtils.getBaseUrl();
			if (!baseUrl) {
				throw new Error('URL do servidor não configurada');
			}

			const url = `${baseUrl}/admin/events/${eventId}/participants/${participantId}`;
			
			const response = await fetch(url, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
				body: JSON.stringify({
					data: {
						type: 'participant',
						attributes: {
							present: present
						}
					}
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.errors?.[0]?.detail || 
					`Erro ao atualizar presença: ${response.status}`
				);
			}

			// Atualizar o estado local do participante
			setParticipants(prev => prev.map(p => 
				p.id === participantId 
					? { ...p, attributes: { ...p.attributes, present } }
					: p
			));

			toast.success(
				present 
					? 'Presença confirmada com sucesso!' 
					: 'Presença removida com sucesso!'
			);
		} catch (error) {
			console.error('Erro ao atualizar presença:', error);
			toast.error(
				error instanceof Error 
					? error.message 
					: 'Erro ao atualizar presença. Tente novamente.'
			);
		} finally {
			setUpdatingPresence(prev => {
				const newState = { ...prev };
				delete newState[participantId];
				return newState;
			});
		}
	};

	// Função para abrir modal de edição e preencher dados
	const handleOpenEditModal = () => {
		if (!event) return;
		
		const startDateTime = formatEventDateTimeForForm(event.attributes.event_start);
		const endDateTime = formatEventDateTimeForForm(event.attributes.event_end);
		
		// Preencher form com dados do evento
		editForm.setFieldValue('nome', event.attributes.name);
		editForm.setFieldValue('descricao', event.attributes.description || '');
		editForm.setFieldValue('data', startDateTime.date);
		editForm.setFieldValue('hora', startDateTime.time);
		editForm.setFieldValue('dataFim', endDateTime.date);
		editForm.setFieldValue('horaFim', endDateTime.time);
		editForm.setFieldValue('local', formatLocation(event.attributes.location));
		editForm.setFieldValue('locationOptional', event.attributes.location_optional);
		editForm.setFieldValue('face_auth', event.attributes.face_auth || false);
		
		// Preencher cursos e turmas selecionados
		const currentCourseIds = event.relationships?.courses?.data?.map(c => c.id) || [];
		const currentClassRoomIds = event.relationships?.class_rooms?.data?.map(cr => cr.id) || [];
		editForm.setFieldValue('course_ids', currentCourseIds);
		editForm.setFieldValue('class_room_ids', currentClassRoomIds);
		setSelectedEditCourseIds(currentCourseIds);
		
		setShowEditModal(true);
		setShowEditValidationErrors(false);
	};

	// Buscar cursos ao abrir modal de edição
	useEffect(() => {
		if (!showEditModal) return;

		const fetchEditCourses = async () => {
			try {
				setLoadingEditCourses(true);
				const token = authUtils.getToken();
				if (!token) return;

				const baseUrl = applicationUtils.getBaseUrl();
				if (!baseUrl) return;

				const response = await fetch(`${baseUrl}/admin/courses`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
					},
				});

				if (response.ok) {
					const data = await response.json();
					setEditCourses(data.data || []);
				}
			} catch (error) {
				console.error('Erro ao buscar cursos:', error);
				toast.error('Erro ao carregar cursos');
			} finally {
				setLoadingEditCourses(false);
			}
		};

		fetchEditCourses();
	}, [showEditModal]);

	// Buscar turmas quando cursos são selecionados no modal de edição
	useEffect(() => {
		if (!showEditModal) return;

		const fetchEditClassRooms = async () => {
			if (selectedEditCourseIds.length === 0) {
				setEditClassRooms([]);
				editForm.setFieldValue('class_room_ids', []);
				return;
			}

			try {
				setLoadingEditClassRooms(true);
				const token = authUtils.getToken();
				if (!token) return;

				const baseUrl = applicationUtils.getBaseUrl();
				if (!baseUrl) return;

				const params = new URLSearchParams();
				selectedEditCourseIds.forEach((id: string) => {
					params.append('course_ids[]', id);
				});

				const response = await fetch(`${baseUrl}/admin/events/classrooms_by_courses?${params.toString()}`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
					},
				});

				if (response.ok) {
					const data = await response.json();
					const fetchedClassRooms = data.data || [];
					setEditClassRooms(fetchedClassRooms);
					
					// Remover turmas selecionadas que não pertencem mais aos cursos selecionados
					setTimeout(() => {
						const currentClassRoomIds = editForm.state.values.class_room_ids || [];
						const validClassRoomIds = currentClassRoomIds.filter((id: string) => 
							fetchedClassRooms.some((cr: ClassRoom) => cr.id === id)
						);
						
						if (validClassRoomIds.length !== currentClassRoomIds.length) {
							editForm.setFieldValue('class_room_ids', validClassRoomIds);
						}
					}, 0);
				}
			} catch (error) {
				console.error('Erro ao buscar turmas:', error);
				toast.error('Erro ao carregar turmas');
			} finally {
				setLoadingEditClassRooms(false);
			}
		};

		fetchEditClassRooms();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedEditCourseIds, showEditModal]);

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

	// Função para formatar data/hora do evento para o form
	const formatEventDateTimeForForm = (dateTimeString: string) => {
		const date = new Date(dateTimeString);
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		
		return {
			date: `${year}-${month}-${day}`,
			time: `${hours}:${minutes}`,
		};
	};

	// Form de edição
	const editForm = useForm({
		defaultValues: {
			nome: '',
			descricao: '',
			data: '',
			hora: '',
			dataFim: '',
			horaFim: '',
			local: '',
			locationOptional: false,
			face_auth: false,
			course_ids: [] as string[],
			class_room_ids: [] as string[],
		} as CreateEventFormData,
		validators: {
			onChange: ({ value }) => {
				const result = createEventSchema.safeParse(value);
				if (result.success) return undefined;
				return result.error.flatten().fieldErrors.nome?.[0] ||
					result.error.flatten().fieldErrors.data?.[0] ||
					result.error.flatten().fieldErrors.hora?.[0] ||
					result.error.flatten().fieldErrors.dataFim?.[0] ||
					result.error.flatten().fieldErrors.horaFim?.[0] ||
					result.error.flatten().fieldErrors.local?.[0] ||
					'Erro de validação';
			},
		},
		onSubmitInvalid: ({ value }) => {
			setShowEditValidationErrors(true);
			const result = createEventSchema.safeParse(value);
			if (!result.success) {
				const errors = result.error.flatten().fieldErrors;
				const errorMessages: string[] = [];
				const fieldLabels: Record<string, string> = {
					nome: 'Nome do Evento',
					data: 'Data de Início',
					hora: 'Hora de Início',
					dataFim: 'Data de Término',
					horaFim: 'Hora de Término',
					local: 'Local do Evento',
				};
				Object.entries(errors).forEach(([field, messages]) => {
					if (messages && messages.length > 0) {
						const label = fieldLabels[field] || field;
						errorMessages.push(`${label}: ${messages[0]}`);
					}
				});
				if (errorMessages.length > 0) {
					toast.error(
						`Por favor, corrija os seguintes erros:\n${errorMessages.join('\n')}`,
						{ duration: 6000 }
					);
				}
			}
		},
		onSubmit: async ({ value }) => {
			try {
				setIsEditing(true);
				const token = authUtils.getToken();
				if (!token) {
					toast.error('Você precisa estar autenticado');
					return;
				}

				// Formatar data e hora de início
				const eventStart = `${value.data}T${value.hora}:00`;
				// Formatar data e hora de término
				const eventEnd = `${value.dataFim}T${value.horaFim}:00`;

				// Montar o payload no formato JSON:API
				const payload = {
					data: {
						type: "event",
						id: eventId,
						attributes: {
							name: value.nome,
							...(value.descricao && { description: value.descricao }),
							event_start: eventStart,
							event_end: eventEnd,
							location_optional: value.locationOptional,
							face_auth: value.face_auth,
							location: value.local,
							course_ids: value.course_ids || [],
							class_room_ids: value.class_room_ids || [],
						}
					}
				};

				const baseUrl = applicationUtils.getBaseUrl();
				if (!baseUrl) {
					throw new Error('URL do servidor não configurada');
				}

				const url = `${baseUrl}/admin/events/${eventId}`;
				const response = await fetch(url, {
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
					},
					body: JSON.stringify(payload),
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					throw new Error(
						errorData.message || 
						errorData.error ||
						`Erro ao atualizar evento: ${response.status} ${response.statusText}`
					);
				}

				toast.success('Evento atualizado com sucesso!');
				setShowEditModal(false);
				
				// Recarregar os dados do evento
				const refreshResponse = await fetch(`${baseUrl}/admin/events/${eventId}?include=courses,class_rooms`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
					},
				});

				if (refreshResponse.ok) {
					const refreshData: EventResponse = await refreshResponse.json();
					setEvent(refreshData.data);
					
					// Atualizar cursos e turmas
					const fetchedCourses: Course[] = [];
					const fetchedClassRooms: ClassRoom[] = [];
					refreshData.included?.forEach((item) => {
						if (item.type === 'course') {
							fetchedCourses.push(item as Course);
						} else if (item.type === 'class_rooms') {
							fetchedClassRooms.push(item as ClassRoom);
						}
					});
					setCourses(fetchedCourses);
					setClassRooms(fetchedClassRooms);
				}
			} catch (error) {
				console.error('Erro ao atualizar evento:', error);
				toast.error(
					error instanceof Error 
						? error.message 
						: 'Erro ao atualizar evento. Tente novamente.'
				);
			} finally {
				setIsEditing(false);
			}
		},
	});

	if (loading) {
		return (
			<ProtectedRoute>
				<AuthenticatedLayout className="p-4 md:p-8">
					<div className="container mx-auto max-w-6xl flex items-center justify-center min-h-[60vh]">
						<div className="flex flex-col items-center gap-4">
							<Loader2 className="h-10 w-10 animate-spin text-primary" />
							<p className="text-sm text-muted-foreground font-medium">Carregando evento...</p>
						</div>
					</div>
				</AuthenticatedLayout>
			</ProtectedRoute>
		);
	}

	if (error || !event) {
		return (
			<ProtectedRoute>
				<AuthenticatedLayout className="p-4 md:p-8">
					<div className="container mx-auto max-w-6xl">
						<Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
							<ArrowLeft className="h-4 w-4" />
							Voltar
						</Link>
						<div className="rounded-xl border border-destructive/50 bg-destructive/10 p-12 text-center">
							<XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
							<h2 className="text-2xl font-bold text-foreground mb-2">
								Erro ao carregar evento
							</h2>
							<p className="text-muted-foreground mb-6">
								{error || 'Evento não encontrado'}
							</p>
							<Button onClick={() => router.push('/')}>
								Voltar para Home
							</Button>
						</div>
					</div>
				</AuthenticatedLayout>
			</ProtectedRoute>
		);
	}

	const startDateTime = formatDateTime(event.attributes.event_start);
	const endDateTime = formatDateTime(event.attributes.event_end);
	const location = formatLocation(event.attributes.location);

	return (
		<ProtectedRoute>
			<AuthenticatedLayout className="p-0">
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
						<Link href="/" className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-6 backdrop-blur-sm bg-white/10 px-4 py-2 rounded-lg">
							<ArrowLeft className="h-4 w-4" />
							Voltar
						</Link>
						
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
				<div className="container mx-auto max-w-6xl px-6 py-8 md:py-12">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						{/* Coluna Principal */}
						<div className="lg:col-span-2 space-y-6">
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

							{/* Cursos Vinculados */}
							{courses.length > 0 && (
								<div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
									<h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
										<GraduationCap className="h-5 w-5 text-primary" />
										Cursos Vinculados
									</h2>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										{courses.map((course) => (
											<div
												key={course.id}
												className="p-4 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary/40 transition-colors"
											>
												<h3 className="font-semibold text-foreground mb-1">
													{course.attributes.name}
												</h3>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Turmas Vinculadas */}
							{classRooms.length > 0 && (
								<div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
									<h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
										<Users className="h-5 w-5 text-primary" />
										Turmas Vinculadas
									</h2>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										{classRooms.map((classRoom) => (
											<div
												key={classRoom.id}
												className="p-4 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary/40 transition-colors"
											>
												<h3 className="font-semibold text-foreground mb-1">
													{classRoom.attributes.name}
												</h3>
												<p className="text-sm text-muted-foreground mb-1">
													Período: {classRoom.attributes.period}
												</p>
												<p className="text-xs text-muted-foreground">
													{classRoom.attributes.course.name}
												</p>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Lista de Participantes */}
							<div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
								<div className="mb-6">
									<div className="flex items-center justify-between mb-4">
										<h2 className="text-xl font-bold text-foreground flex items-center gap-2">
											<div className="p-2 rounded-lg bg-primary/10">
												<Users className="h-5 w-5 text-primary" />
											</div>
											Participantes
										</h2>
										{participants.length > 0 && (
											<div className="flex items-center gap-3">
												{/* Botão de Exportar */}
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="outline"
															size="sm"
															disabled={isExporting}
															className="gap-2"
														>
															{isExporting ? (
																<>
																	<Loader2 className="h-4 w-4 animate-spin" />
																	Exportando...
																</>
															) : (
																<>
																	<Download className="h-4 w-4" />
																	Exportar
																</>
															)}
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem
															onClick={() => handleExportParticipants('csv')}
															disabled={isExporting}
														>
															<FileText className="h-4 w-4 mr-2" />
															Exportar como CSV
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => handleExportParticipants('xlsx')}
															disabled={isExporting}
														>
															<FileSpreadsheet className="h-4 w-4 mr-2" />
															Exportar como XLSX
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
												<div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
													<CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
													<span className="text-sm font-semibold text-green-700 dark:text-green-300">
														{participants.filter(p => p.attributes.present).length}
													</span>
													<span className="text-xs text-muted-foreground">presentes</span>
												</div>
												<div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50">
													<span className="text-sm font-semibold text-foreground">
														{participants.length}
													</span>
													<span className="text-xs text-muted-foreground">total</span>
												</div>
											</div>
										)}
									</div>
									{participants.length > 0 && (
										<div className="h-2 bg-muted rounded-full overflow-hidden">
											<div 
												className="h-full bg-green-500 transition-all duration-500 rounded-full"
												style={{ 
													width: `${(participants.filter(p => p.attributes.present).length / participants.length) * 100}%` 
												}}
											/>
										</div>
									)}
								</div>

								{loadingParticipants && participants.length === 0 ? (
									<div className="flex items-center justify-center py-12">
										<div className="flex flex-col items-center gap-4">
											<Loader2 className="h-8 w-8 animate-spin text-primary" />
											<p className="text-sm text-muted-foreground">Carregando participantes...</p>
										</div>
									</div>
								) : participants.length === 0 ? (
									<div className="text-center py-12">
										<Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
										<p className="text-sm text-muted-foreground">
											Nenhum participante encontrado
										</p>
									</div>
								) : (
									<>
										<div className="space-y-4">
											{participants.map((participant) => (
												<div
													key={participant.id}
													className={`
														group relative rounded-xl border transition-all duration-300 overflow-hidden
														${participant.attributes.present 
															? 'border-green-500/30 bg-green-500/5 hover:bg-green-500/10 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10' 
															: 'border-border/50 bg-card hover:bg-secondary/50 hover:border-primary/30 hover:shadow-md'
														}
													`}
												>
													{/* Barra lateral de status */}
													<div className={`
														absolute left-0 top-0 bottom-0 w-1 transition-all duration-300
														${participant.attributes.present 
															? 'bg-green-500 group-hover:bg-green-400' 
															: 'bg-muted-foreground/30 group-hover:bg-muted-foreground/50'
														}
													`} />
													
													<div className="p-5">
														<div className="flex items-start gap-4">
															{/* Avatar/Ícone do Participante */}
															<div className={`
																relative shrink-0 p-4 rounded-xl transition-all duration-300
																${participant.attributes.present 
																	? 'bg-green-500/20 group-hover:bg-green-500/30 group-hover:scale-105' 
																	: 'bg-muted/50 group-hover:bg-muted'
																}
															`}>
																{participant.attributes.present ? (
																	<UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
																) : (
																	<UserX className="h-6 w-6 text-muted-foreground" />
																)}
																{participant.attributes.present && (
																	<div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-card animate-pulse" />
																)}
															</div>

															{/* Informações do Participante */}
															<div className="flex-1 min-w-0">
																<div className="flex items-start justify-between gap-4 mb-3">
																	<div className="flex-1 min-w-0">
																		<h3 className="text-base font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">
																			{participant.attributes.student_name}
																		</h3>
																		<div className="flex items-center gap-3 flex-wrap">
																			<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
																				<span className="font-semibold">RA:</span>
																				<span>{participant.attributes.student_ra}</span>
																			</div>
																		</div>
																	</div>

																	{/* Badge de Status e Botões de Ação */}
																	<div className="shrink-0 flex flex-col items-end gap-2">
																		{participant.attributes.present ? (
																			<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-700 dark:text-green-300 text-sm font-semibold border border-green-500/30 shadow-sm">
																				<CheckCircle2 className="h-4 w-4" />
																				<span>Presente</span>
																			</div>
																		) : (
																			<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/80 text-muted-foreground text-sm font-semibold border border-border/50">
																				<XCircle className="h-4 w-4" />
																				<span>Ausente</span>
																			</div>
																		)}
																		
																		{/* Botões de Ação */}
																		<div className="flex items-center gap-2">
																			{participant.attributes.present ? (
																				<Button
																					variant="outline"
																					size="sm"
																					onClick={() => handleUpdatePresence(participant.id, false)}
																					disabled={updatingPresence[participant.id]}
																					className="h-8 px-3 text-xs border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
																				>
																					{updatingPresence[participant.id] ? (
																						<>
																							<Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
																							Atualizando...
																						</>
																					) : (
																						<>
																							<XCircle className="h-3 w-3 mr-1.5" />
																							Marcar Ausente
																						</>
																					)}
																				</Button>
																			) : (
																				<Button
																					variant="outline"
																					size="sm"
																					onClick={() => handleUpdatePresence(participant.id, true)}
																					disabled={updatingPresence[participant.id]}
																					className="h-8 px-3 text-xs border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10 hover:border-green-500/50"
																				>
																					{updatingPresence[participant.id] ? (
																						<>
																							<Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
																							Atualizando...
																						</>
																					) : (
																						<>
																							<CheckCircle2 className="h-3 w-3 mr-1.5" />
																							Marcar Presente
																						</>
																					)}
																				</Button>
																			)}
																		</div>
																	</div>
																</div>

																{/* Informações Adicionais */}
																<div className="space-y-2">
																	{participant.attributes.email && (
																		<div className="flex items-center gap-2 text-sm text-muted-foreground">
																			<div className="p-1.5 rounded-md bg-primary/5">
																				<Info className="h-3.5 w-3.5 text-primary" />
																			</div>
																			<span className="truncate">{participant.attributes.email}</span>
																		</div>
																	)}
																	
																	{participant.attributes.location && (
																		<div className="flex items-start gap-2 text-sm text-muted-foreground">
																			<div className="p-1.5 rounded-md bg-primary/5 mt-0.5 shrink-0">
																				<MapPin className="h-3.5 w-3.5 text-primary" />
																			</div>
																			<span className="leading-relaxed">{participant.attributes.location}</span>
																		</div>
																	)}
																</div>
															</div>
														</div>
													</div>
												</div>
											))}
										</div>

										{/* Paginação */}
										{hasMoreParticipants && (
											<div className="mt-6 flex justify-center">
												<Button
													variant="outline"
													onClick={loadMoreParticipants}
													disabled={loadingParticipants}
													className="gap-2"
												>
													{loadingParticipants ? (
														<>
															<Loader2 className="h-4 w-4 animate-spin" />
															Carregando...
														</>
													) : (
														<>
															<ChevronRight className="h-4 w-4" />
															Carregar mais participantes
														</>
													)}
												</Button>
											</div>
										)}
									</>
								)}
							</div>
						</div>

						{/* Sidebar */}
						<div className="lg:col-span-1">
							<div className="sticky top-8 space-y-6">
								{/* Card de Status */}
								<div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
									<h3 className="text-lg font-semibold text-foreground mb-4">
										Status do Evento
									</h3>
									<div className="space-y-3">
										<div className="flex items-center gap-3">
											<CheckCircle2 className="h-5 w-5 text-green-500" />
											<span className="text-sm text-foreground">Evento ativo</span>
										</div>
										<div className="flex items-center gap-3">
											<GraduationCap className="h-5 w-5 text-primary" />
											<span className="text-sm text-foreground">
												{courses.length} {courses.length === 1 ? 'curso' : 'cursos'}
											</span>
										</div>
										<div className="flex items-center gap-3">
											<Users className="h-5 w-5 text-primary" />
											<span className="text-sm text-foreground">
												{classRooms.length} {classRooms.length === 1 ? 'turma' : 'turmas'}
											</span>
										</div>
									</div>
								</div>

								{/* Card de QR Code */}
								{presenceUrl && (
									<div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
										<h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
											<QrCode className="h-5 w-5 text-primary" />
											Código QR de Presença
										</h3>
										<div className="flex flex-col items-center gap-4">
											<div className="p-4 rounded-lg bg-white border-2 border-border/50">
												<QRCodeSVG
													value={presenceUrl}
													size={180}
													style={{ height: "auto", maxWidth: "100%", width: "100%" }}
													viewBox={`0 0 256 256`}
												/>
											</div>
											<Button
												variant="outline"
												className="w-full"
												onClick={() => setShowQrModal(true)}
											>
												<Maximize2 className="h-4 w-4 mr-2" />
												Expandir QR Code
											</Button>
											<p className="text-xs text-muted-foreground text-center">
												Escaneie o código para registrar presença no evento
											</p>
										</div>
									</div>
								)}

								{/* Card de Ações */}
								<div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
									<h3 className="text-lg font-semibold text-foreground mb-4">
										Ações
									</h3>
									<div className="space-y-2">
										<Button 
											variant="outline" 
											className="w-full justify-start"
											onClick={handleOpenEditModal}
											disabled={isEditing}
										>
											<Edit className="h-4 w-4 mr-2" />
											Editar Evento
										</Button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Modal de QR Code Expandido */}
				{showQrModal && presenceUrl && (
					<div
						className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
						onClick={() => setShowQrModal(false)}
					>
						<div
							className="relative bg-card rounded-2xl border border-border/50 shadow-2xl p-8 max-w-md w-full animate-in zoom-in-95 duration-200"
							onClick={(e) => e.stopPropagation()}
						>
							{/* Botão de Fechar e Copiar Link */}
							<div className="absolute top-4 right-4 flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={handleCopyLink}
									className="h-9 px-3 text-xs"
									title="Copiar link de presença"
								>
									{linkCopied ? (
										<>
											<Check className="h-3.5 w-3.5 mr-1.5 text-green-600 dark:text-green-400" />
											<span className="text-green-600 dark:text-green-400">Copiado!</span>
										</>
									) : (
										<>
											<Copy className="h-3.5 w-3.5 mr-1.5" />
											<span className="hidden sm:inline">Copiar Link</span>
										</>
									)}
								</Button>
								<button
									onClick={() => {
										setShowQrModal(false);
										setLinkCopied(false);
									}}
									className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
									aria-label="Fechar modal"
								>
									<X className="h-5 w-5" />
								</button>
							</div>

							{/* Conteúdo do Modal */}
							<div className="flex flex-col items-center gap-6">
								<h3 className="text-2xl font-bold text-foreground text-center">
									Código QR de Presença
								</h3>
								<div className="p-6 rounded-xl bg-white border-2 border-border shadow-lg">
									<QRCodeSVG
										value={presenceUrl}
										size={320}
										style={{ height: "auto", maxWidth: "100%", width: "100%" }}
										viewBox={`0 0 256 256`}
									/>
								</div>
								<p className="text-sm text-muted-foreground text-center">
									Escaneie o código para registrar presença no evento
								</p>
								
								{/* Botões de Ação */}
								<div className="w-full space-y-3">
									<Button
										variant="default"
										onClick={handleCopyLink}
										className="w-full"
									>
										{linkCopied ? (
											<>
												<Check className="h-4 w-4 mr-2 text-white" />
												Link Copiado!
											</>
										) : (
											<>
												<Copy className="h-4 w-4 mr-2" />
												Copiar Link
											</>
										)}
									</Button>
									<Button
										variant="outline"
										onClick={() => {
											setShowQrModal(false);
											setLinkCopied(false);
										}}
										className="w-full"
									>
										Fechar
									</Button>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Modal de Edição de Evento */}
				{showEditModal && (
					<div
						className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
						onClick={() => !isEditing && setShowEditModal(false)}
					>
						<div
							className="relative bg-card rounded-2xl border border-border/50 shadow-2xl p-6 md:p-8 max-w-4xl w-full my-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
							onClick={(e) => e.stopPropagation()}
						>
							{/* Botão de Fechar */}
							<button
								onClick={() => !isEditing && setShowEditModal(false)}
								disabled={isEditing}
								className="absolute top-4 right-4 p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
								aria-label="Fechar modal"
							>
								<X className="h-5 w-5" />
							</button>

							{/* Header do Modal */}
							<div className="mb-6">
								<div className="flex items-center gap-3 mb-2">
									<div className="p-2 rounded-lg bg-primary/10">
										<Sparkles className="h-5 w-5 text-primary" />
									</div>
									<h2 className="text-2xl font-bold text-foreground">
										Editar Evento
									</h2>
								</div>
								<p className="text-sm text-muted-foreground">
									Atualize as informações do evento
								</p>
							</div>

							{/* Erros de Validação */}
							{showEditValidationErrors && (() => {
								const result = createEventSchema.safeParse(editForm.state.values);
								if (!result.success) {
									const errors = result.error.flatten().fieldErrors;
									const errorList: Array<{ field: string; message: string; label: string }> = [];
									const fieldLabels: Record<string, string> = {
										nome: 'Nome do Evento',
										data: 'Data de Início',
										hora: 'Hora de Início',
										dataFim: 'Data de Término',
										horaFim: 'Hora de Término',
										local: 'Local do Evento',
									};
									Object.entries(errors).forEach(([field, messages]) => {
										if (messages && messages.length > 0) {
											errorList.push({
												field,
												message: messages[0],
												label: fieldLabels[field] || field,
											});
										}
									});
									if (errorList.length > 0) {
										return (
											<div className="p-4 mb-6 rounded-lg bg-destructive/10 border border-destructive/30">
												<div className="flex items-start gap-3">
													<AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
													<div className="flex-1">
														<h3 className="text-sm font-semibold text-destructive mb-2">
															Erros de Validação
														</h3>
														<ul className="space-y-1">
															{errorList.map((error, index) => (
																<li key={index} className="text-sm text-destructive/90">
																	<span className="font-medium">{error.label}:</span> {error.message}
																</li>
															))}
														</ul>
													</div>
												</div>
											</div>
										);
									}
								}
								return null;
							})()}

							{/* Formulário */}
							<form
								onSubmit={(e) => {
									e.preventDefault();
									e.stopPropagation();
									const result = createEventSchema.safeParse(editForm.state.values);
									if (!result.success) {
										setShowEditValidationErrors(true);
									} else {
										setShowEditValidationErrors(false);
									}
									editForm.handleSubmit().catch((error) => {
										console.error('Erro no submit do formulário:', error);
									});
								}}
								className="space-y-6"
							>
								{/* Informações Básicas */}
								<div className="space-y-4">
									<div>
										<h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
											<FileText className="h-5 w-5 text-primary" />
											Informações do Evento
										</h3>
									</div>

									<editForm.Field
										name="nome"
										children={(field) => (
											<Input
												label="Nome do Evento"
												type="text"
												placeholder="Ex: Workshop de Tecnologia Avançada"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												error={field.state.meta.errors.length > 0}
												errorMessage={field.state.meta.errors[0]}
												disabled={isEditing}
											/>
										)}
									/>

									<editForm.Field
										name="descricao"
										children={(field) => (
											<div className="space-y-2">
												<label className="text-sm font-semibold text-foreground">
													Descrição Detalhada
												</label>
												<textarea
													placeholder="Descreva o evento..."
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
													onBlur={field.handleBlur}
													rows={4}
													disabled={isEditing}
													className="w-full rounded-lg border border-input bg-transparent px-4 py-3 text-sm shadow-sm transition-all outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
												/>
											</div>
										)}
									/>
								</div>

								{/* Data e Hora */}
								<div className="space-y-4">
									<div>
										<h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
											<Calendar className="h-5 w-5 text-primary" />
											Agendamento
										</h3>
									</div>

									<div>
										<h4 className="text-sm font-medium text-foreground mb-3">Início do Evento</h4>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<editForm.Field
												name="data"
												children={(field) => (
													<Input
														label="Data de Início"
														type="date"
														value={field.state.value}
														onChange={(e) => field.handleChange(e.target.value)}
														onBlur={field.handleBlur}
														icon={<Calendar className="h-4 w-4 text-primary" />}
														iconPosition="left"
														error={field.state.meta.errors.length > 0}
														errorMessage={field.state.meta.errors[0]}
														disabled={isEditing}
													/>
												)}
											/>
											<editForm.Field
												name="hora"
												children={(field) => (
													<Input
														label="Hora de Início"
														type="time"
														value={field.state.value}
														onChange={(e) => field.handleChange(e.target.value)}
														onBlur={field.handleBlur}
														icon={<Clock className="h-4 w-4 text-primary" />}
														iconPosition="left"
														error={field.state.meta.errors.length > 0}
														errorMessage={field.state.meta.errors[0]}
														disabled={isEditing}
													/>
												)}
											/>
										</div>
									</div>

									<div>
										<h4 className="text-sm font-medium text-foreground mb-3">Término do Evento</h4>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<editForm.Field
												name="dataFim"
												children={(field) => (
													<Input
														label="Data de Término"
														type="date"
														value={field.state.value}
														onChange={(e) => field.handleChange(e.target.value)}
														onBlur={field.handleBlur}
														icon={<Calendar className="h-4 w-4 text-primary" />}
														iconPosition="left"
														error={field.state.meta.errors.length > 0}
														errorMessage={field.state.meta.errors[0]}
														disabled={isEditing}
													/>
												)}
											/>
											<editForm.Field
												name="horaFim"
												children={(field) => (
													<Input
														label="Hora de Término"
														type="time"
														value={field.state.value}
														onChange={(e) => field.handleChange(e.target.value)}
														onBlur={field.handleBlur}
														icon={<Clock className="h-4 w-4 text-primary" />}
														iconPosition="left"
														error={field.state.meta.errors.length > 0}
														errorMessage={field.state.meta.errors[0]}
														disabled={isEditing}
													/>
												)}
											/>
										</div>
									</div>

									<editForm.Field
										name="local"
										children={(field) => (
											<Input
												label="Local do Evento"
												type="text"
												placeholder="Ex: Auditório Principal"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												icon={<MapPin className="h-4 w-4 text-primary" />}
												iconPosition="left"
												error={field.state.meta.errors.length > 0}
												errorMessage={field.state.meta.errors[0]}
												disabled={isEditing}
											/>
										)}
									/>

									<editForm.Field
										name="locationOptional"
										children={(field) => (
											<div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-secondary/30">
												<div className="flex-1">
													<label className="text-sm font-semibold text-foreground block mb-1 cursor-pointer" onClick={() => !isEditing && field.handleChange(!field.state.value)}>
														Localização Opcional
													</label>
													<p className="text-xs text-muted-foreground">
														Validação de localização dos participantes
													</p>
												</div>
												<button
													type="button"
													role="switch"
													aria-checked={field.state.value}
													onClick={() => !isEditing && field.handleChange(!field.state.value)}
													disabled={isEditing}
													className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
														field.state.value ? 'bg-primary' : 'bg-input'
													} disabled:opacity-50`}
												>
													<span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
														field.state.value ? 'translate-x-6' : 'translate-x-1'
													}`} />
												</button>
											</div>
										)}
									/>

									<editForm.Field
										name="face_auth"
										children={(field) => (
											<div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-secondary/30">
												<div className="flex-1">
													<label className="text-sm font-semibold text-foreground block mb-1 cursor-pointer" onClick={() => !isEditing && field.handleChange(!field.state.value)}>
														Ativar reconhecimento fácial
													</label>
													<p className="text-xs text-muted-foreground">
														Permite validação de presença através de reconhecimento facial
													</p>
												</div>
												<button
													type="button"
													role="switch"
													aria-checked={field.state.value}
													onClick={() => !isEditing && field.handleChange(!field.state.value)}
													disabled={isEditing}
													className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
														field.state.value ? 'bg-primary' : 'bg-input'
													} disabled:opacity-50`}
												>
													<span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
														field.state.value ? 'translate-x-6' : 'translate-x-1'
													}`} />
												</button>
											</div>
										)}
									/>
								</div>

								{/* Cursos e Turmas */}
								<div className="space-y-4">
									<div>
										<h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
											<GraduationCap className="h-5 w-5 text-primary" />
											Cursos e Turmas
										</h3>
									</div>

									<editForm.Field
										name="course_ids"
										children={(field) => {
											const courseOptions: MultiselectOption[] = editCourses.map(course => ({
												id: course.id,
												label: course.attributes.name,
											}));

											return (
												<Multiselect
													options={courseOptions}
													selectedIds={field.state.value}
													onChange={(selectedIds) => {
														field.handleChange(selectedIds);
														setSelectedEditCourseIds(selectedIds);
													}}
													label="Cursos"
													placeholder="Selecione os cursos"
													loading={loadingEditCourses}
													disabled={isEditing}
												/>
											);
										}}
									/>

									<editForm.Field
										name="class_room_ids"
										children={(field) => {
											const classRoomOptions: MultiselectOption[] = editClassRooms.map(classRoom => ({
												id: classRoom.id,
												label: `${classRoom.attributes.name} - ${classRoom.attributes.course.name}`,
											}));

											return (
												<Multiselect
													options={classRoomOptions}
													selectedIds={field.state.value}
													onChange={(selectedIds) => field.handleChange(selectedIds)}
													label="Turmas"
													placeholder={
														selectedEditCourseIds.length === 0
															? "Selecione cursos primeiro"
															: "Selecione as turmas"
													}
													loading={loadingEditClassRooms}
													disabled={isEditing || selectedEditCourseIds.length === 0}
												/>
											);
										}}
									/>
								</div>

								{/* Botões */}
								<div className="flex gap-4 pt-4 border-t border-border/50">
									<Button
										type="button"
										variant="outline"
										onClick={() => setShowEditModal(false)}
										disabled={isEditing}
										className="flex-1"
									>
										Cancelar
									</Button>
									<Button
										type="submit"
										disabled={isEditing}
										className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
										loading={isEditing}
										loadingIcon={<Loader2 className="h-4 w-4 animate-spin" />}
									>
										{isEditing ? 'Salvando...' : 'Salvar Alterações'}
									</Button>
								</div>
							</form>
						</div>
					</div>
				)}
			</AuthenticatedLayout>
		</ProtectedRoute>
	);
}

