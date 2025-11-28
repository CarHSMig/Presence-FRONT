"use client";

import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthenticatedLayout from "@/components/authenticated-layout";
import { createEventSchema, type CreateEventFormData } from '@/validators/event.validator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Calendar, Clock, MapPin, FileText, Loader2, ArrowLeft, Sparkles, GraduationCap, Users, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { authUtils } from '@/utils/auth.utils';
import { applicationUtils } from '@/utils/application.utils';
import { Multiselect, type MultiselectOption } from '@/components/ui/multiselect';
import { useState, useEffect } from 'react';

interface Course {
	id: string;
	attributes: {
		name: string;
	};
}

interface ClassRoom {
	id: string;
	attributes: {
		name: string;
		course: {
			id: string;
			name: string;
		};
	};
}

export default function CriarEventoPage() {
	const router = useRouter();
	const [courses, setCourses] = useState<Course[]>([]);
	const [classRooms, setClassRooms] = useState<ClassRoom[]>([]);
	const [loadingCourses, setLoadingCourses] = useState(true);
	const [loadingClassRooms, setLoadingClassRooms] = useState(false);
	const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
	const [showValidationErrors, setShowValidationErrors] = useState(false);

	const form = useForm({
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
			// Mostrar erros de validação
			setShowValidationErrors(true);
			
			// Validar e coletar todos os erros
			const result = createEventSchema.safeParse(value);
			if (!result.success) {
				const errors = result.error.flatten().fieldErrors;
				const errorMessages: string[] = [];
				
				// Mapear erros para mensagens amigáveis
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

				// Mostrar toast com erros
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
				console.log('🚀 Iniciando criação de evento...', value);
				
				const token = authUtils.getToken();
				if (!token) {
					toast.error('Você precisa estar autenticado para criar um evento');
					router.push('/login');
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

				console.log('📦 Payload a ser enviado:', JSON.stringify(payload, null, 2));

				const baseUrl = applicationUtils.getBaseUrl();
				if (!baseUrl) {
					throw new Error('URL do servidor não configurada');
				}

				const url = `${baseUrl}/admin/events`;
				console.log('🌐 Fazendo requisição POST para:', url);

				const response = await fetch(url, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
					},
					body: JSON.stringify(payload),
				});

				console.log('📡 Resposta recebida:', response.status, response.statusText);

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					console.error('❌ Erro na resposta:', errorData);
					throw new Error(
						errorData.message || 
						errorData.error ||
						`Erro ao criar evento: ${response.status} ${response.statusText}`
					);
				}

				const responseData = await response.json();
				console.log('✅ Evento criado com sucesso!', responseData);

				toast.success('Evento criado com sucesso!');
				router.push('/');
			} catch (error) {
				console.error('❌ Erro ao criar evento:', error);
				toast.error(
					error instanceof Error 
						? error.message 
						: 'Erro ao criar evento. Tente novamente.'
				);
			}
		},
	});

	const isLoading = form.state.isSubmitting;

	// Buscar cursos ao carregar a página
	useEffect(() => {
		const fetchCourses = async () => {
			try {
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
					setCourses(data.data || []);
				}
			} catch (error) {
				console.error('Erro ao buscar cursos:', error);
				toast.error('Erro ao carregar cursos');
			} finally {
				setLoadingCourses(false);
			}
		};

		fetchCourses();
	}, []);

	// Buscar turmas quando cursos são selecionados
	useEffect(() => {
		const fetchClassRooms = async () => {
			if (selectedCourseIds.length === 0) {
				setClassRooms([]);
				form.setFieldValue('class_room_ids', []);
				return;
			}

			try {
				setLoadingClassRooms(true);
				const token = authUtils.getToken();
				if (!token) return;

				const baseUrl = applicationUtils.getBaseUrl();
				if (!baseUrl) return;

				// Construir query params para múltiplos course_ids
				const params = new URLSearchParams();
				selectedCourseIds.forEach((id: string) => {
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
					setClassRooms(fetchedClassRooms);
					
					// Remover turmas selecionadas que não pertencem mais aos cursos selecionados
					// Usar setTimeout para garantir que o estado do form está atualizado
					setTimeout(() => {
						const currentClassRoomIds = form.state.values.class_room_ids || [];
						const validClassRoomIds = currentClassRoomIds.filter((id: string) => 
							fetchedClassRooms.some((cr: ClassRoom) => cr.id === id)
						);
						
						if (validClassRoomIds.length !== currentClassRoomIds.length) {
							form.setFieldValue('class_room_ids', validClassRoomIds);
						}
					}, 0);
				}
			} catch (error) {
				console.error('Erro ao buscar turmas:', error);
				toast.error('Erro ao carregar turmas');
			} finally {
				setLoadingClassRooms(false);
			}
		};

		fetchClassRooms();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedCourseIds]);

	// Esconder erros quando a validação passar
	useEffect(() => {
		if (showValidationErrors) {
			const result = createEventSchema.safeParse(form.state.values);
			if (result.success) {
				setShowValidationErrors(false);
			}
		}
	}, [form.state.values, showValidationErrors]);

	return (
		<ProtectedRoute>
			<AuthenticatedLayout className="p-4 md:p-8 bg-linear-to-br from-background via-background to-secondary/20">
				{loadingCourses ? (
					<div className="container mx-auto max-w-2xl flex items-center justify-center min-h-[60vh]">
						<div className="flex flex-col items-center gap-4">
							<Loader2 className="h-8 w-8 animate-spin text-primary" />
							<p className="text-sm text-muted-foreground">Carregando formulário...</p>
						</div>
					</div>
				) : (
				<div className="container mx-auto max-w-2xl">
					{/* Header com botão de voltar - Redesign Moderno */}
					<div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
						<div className="flex items-start justify-between gap-4 mb-6">
							<div className="flex items-center gap-3 flex-1">
								<div className="p-3 rounded-lg bg-primary/10 backdrop-blur-sm animate-in zoom-in duration-500 delay-100">
									<Sparkles className="h-6 w-6 text-primary" />
								</div>
								<div className="flex-1 animate-in fade-in slide-in-from-left-4 duration-500 delay-200">
									<h1 className="text-4xl md:text-5xl font-bold text-foreground">
										Criar Evento
									</h1>
									<p className="text-base text-muted-foreground mt-2">
										Organize um novo evento e inspire sua comunidade
									</p>
								</div>
							</div>
							<Link href="/" className="animate-in fade-in slide-in-from-right-4 duration-500 delay-300">
							<Button
								variant="ghost"
								size="sm"
									className="hover:bg-secondary/50 transition-colors duration-200 shrink-0"
							>
								<ArrowLeft className="h-4 w-4 mr-2" />
								Voltar
							</Button>
						</Link>
						</div>
					</div>

					{/* Formulário - Redesign Moderno com Mais Espaçamento */}
					<div className="rounded-2xl border border-border/50 bg-card shadow-lg hover:shadow-xl transition-shadow overflow-hidden backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
						{/* Componente de Erros de Validação */}
						{(() => {
							if (!showValidationErrors) return null;
							
							const result = createEventSchema.safeParse(form.state.values);
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
										<div className="p-6 m-6 mb-0 rounded-lg bg-destructive/10 border border-destructive/30 animate-in fade-in slide-in-from-top-2">
											<div className="flex items-start gap-3">
												<div className="shrink-0 mt-0.5">
													<AlertCircle className="h-5 w-5 text-destructive" />
												</div>
												<div className="flex-1">
													<h3 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2">
														Erros de Validação
													</h3>
													<p className="text-xs text-destructive/80 mb-3">
														Por favor, corrija os seguintes campos antes de continuar:
													</p>
													<ul className="space-y-2">
														{errorList.map((error, index) => (
															<li 
																key={index} 
																className="flex items-start gap-2 text-sm text-destructive/90"
															>
																<span className="text-destructive mt-1.5 shrink-0">•</span>
																<span>
																	<span className="font-medium">{error.label}:</span>{' '}
																	<span className="text-destructive/80">{error.message}</span>
																</span>
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
						
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								console.log('📝 Form submit disparado');
								console.log('📊 Estado do form:', {
									isSubmitting: form.state.isSubmitting,
									isValid: form.state.isValid,
									errors: form.state.errors,
									values: form.state.values,
								});
								
								// Validar antes de submeter
								const result = createEventSchema.safeParse(form.state.values);
								if (!result.success) {
									setShowValidationErrors(true);
								} else {
									setShowValidationErrors(false);
								}
								
								form.handleSubmit().catch((error) => {
									console.error('❌ Erro no submit do formulário:', error);
								});
							}}
							className="p-8 md:p-10 space-y-8"
						>
							{/* Seção 1: Informações Básicas */}
							<div className="space-y-7">
								<div>
									<h2 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
										<FileText className="h-5 w-5 text-primary" />
										Informações do Evento
									</h2>
									<p className="text-sm text-muted-foreground">
										Dados essenciais para identificar seu evento
									</p>
								</div>

								<form.Field
									name="nome"
									children={(field) => (
										<Input
											label="Nome do Evento"
											type="text"
											placeholder="Ex: Workshop de Tecnologia Avançada"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											aria-invalid={field.state.meta.errors.length > 0}
											error={field.state.meta.errors.length > 0}
											errorMessage={field.state.meta.errors[0] || 'Erro de validação'}
											className="text-base pl-4"
										/>
									)}
								/>

								<form.Field
									name="descricao"
									children={(field) => (
										<div className="space-y-2">
											<label className="text-sm font-semibold text-foreground">
												Descrição Detalhada
											</label>
											<div className="relative">
											<textarea
													placeholder="Descreva o evento, objetivos, agenda, informações importantes e detalhes que os participantes precisam saber..."
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												aria-invalid={field.state.meta.errors.length > 0}
													rows={5}
													className="w-full rounded-lg border border-input bg-transparent px-4 py-3 text-base shadow-sm transition-all duration-200 outline-none placeholder:text-muted-foreground dark:bg-input/20 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-md hover:border-primary/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
											/>
											</div>
											{field.state.meta.errors.length > 0 && (
												<p className="text-sm text-destructive flex items-center gap-1">
													<span className="h-1.5 w-1.5 rounded-full bg-destructive" />
													{field.state.meta.errors[0] || 'Erro de validação'}
												</p>
											)}
										</div>
									)}
								/>
							</div>

							{/* Divisor Visual */}
							<div className="h-px bg-linear-to-r from-transparent via-border to-transparent" />

							{/* Seção 2: Data, Hora e Local */}
							<div className="space-y-7">
								<div>
									<h2 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
										<Calendar className="h-5 w-5 text-primary" />
										Agendamento e Localização
									</h2>
									<p className="text-sm text-muted-foreground">
										Quando e onde o evento acontecerá
									</p>
								</div>

								{/* Início do Evento */}
								<div>
									<h3 className="text-sm font-medium text-foreground mb-4">Início do Evento</h3>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<form.Field
										name="data"
										children={(field) => (
											<Input
													label="Data de Início"
												type="date"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												aria-invalid={field.state.meta.errors.length > 0}
													icon={<Calendar className="h-4 w-4 text-primary" />}
												iconPosition="left"
												error={field.state.meta.errors.length > 0}
												errorMessage={field.state.meta.errors[0] || 'Erro de validação'}
													className="text-base"
											/>
										)}
									/>

									<form.Field
										name="hora"
										children={(field) => (
											<Input
													label="Hora de Início"
													type="time"
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
													onBlur={field.handleBlur}
													aria-invalid={field.state.meta.errors.length > 0}
													icon={<Clock className="h-4 w-4 text-primary" />}
													iconPosition="left"
													error={field.state.meta.errors.length > 0}
													errorMessage={field.state.meta.errors[0] || 'Erro de validação'}
													className="text-base"
												/>
											)}
										/>
									</div>
								</div>

								{/* Término do Evento */}
								<div>
									<h3 className="text-sm font-medium text-foreground mb-4">Término do Evento</h3>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<form.Field
											name="dataFim"
											children={(field) => (
												<Input
													label="Data de Término"
													type="date"
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
													onBlur={field.handleBlur}
													aria-invalid={field.state.meta.errors.length > 0}
													icon={<Calendar className="h-4 w-4 text-primary" />}
													iconPosition="left"
													error={field.state.meta.errors.length > 0}
													errorMessage={field.state.meta.errors[0] || 'Erro de validação'}
													className="text-base"
												/>
											)}
										/>

										<form.Field
											name="horaFim"
											children={(field) => (
												<Input
													label="Hora de Término"
												type="time"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												aria-invalid={field.state.meta.errors.length > 0}
													icon={<Clock className="h-4 w-4 text-primary" />}
												iconPosition="left"
												error={field.state.meta.errors.length > 0}
												errorMessage={field.state.meta.errors[0] || 'Erro de validação'}
													className="text-base"
											/>
										)}
									/>
									</div>
								</div>

								<form.Field
									name="local"
									children={(field) => (
										<Input
											label="Local do Evento"
											type="text"
											placeholder="Ex: Auditório Principal - Bloco A, Sala 201"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											aria-invalid={field.state.meta.errors.length > 0}
											icon={<MapPin className="h-4 w-4 text-primary" />}
											iconPosition="left"
											error={field.state.meta.errors.length > 0}
											errorMessage={field.state.meta.errors[0] || 'Erro de validação'}
											className="text-base"
										/>
									)}
								/>

								<form.Field
									name="locationOptional"
									children={(field) => (
										<div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary/40 transition-colors duration-200">
											<div className="flex-1">
												<label className="text-sm font-semibold text-foreground block mb-1 cursor-pointer" onClick={() => field.handleChange(!field.state.value)}>
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
												aria-label="Localização opcional"
												onClick={() => field.handleChange(!field.state.value)}
												className={`
													relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
													${field.state.value 
														? 'bg-primary' 
														: 'bg-input'
													}
												`}
											>
												<span
													className={`
														inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200
														${field.state.value ? 'translate-x-6' : 'translate-x-1'}
													`}
												/>
											</button>
										</div>
									)}
								/>

								<form.Field
									name="face_auth"
									children={(field) => (
										<div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary/40 transition-colors duration-200">
											<div className="flex-1">
												<label className="text-sm font-semibold text-foreground block mb-1 cursor-pointer" onClick={() => field.handleChange(!field.state.value)}>
													Ativar reconhecimento fácial dos alunos
												</label>
												<p className="text-xs text-muted-foreground">
													Permite validação de presença através de reconhecimento facial
												</p>
											</div>
											<button
												type="button"
												role="switch"
												aria-checked={field.state.value}
												aria-label="Ativar reconhecimento fácial dos alunos"
												onClick={() => field.handleChange(!field.state.value)}
												className={`
													relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
													${field.state.value 
														? 'bg-primary' 
														: 'bg-input'
													}
												`}
											>
												<span
													className={`
														inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200
														${field.state.value ? 'translate-x-6' : 'translate-x-1'}
													`}
												/>
											</button>
										</div>
									)}
								/>
							</div>

							{/* Divisor Visual */}
							<div className="h-px bg-linear-to-r from-transparent via-border to-transparent" />

							{/* Seção 3: Cursos e Turmas */}
							<div className="space-y-7">
								<div>
									<h2 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
										<GraduationCap className="h-5 w-5 text-primary" />
										Cursos e Turmas
									</h2>
									<p className="text-sm text-muted-foreground">
										Selecione os cursos e turmas que participarão do evento
									</p>
								</div>

								<form.Field
									name="course_ids"
									children={(field) => {
										const courseOptions: MultiselectOption[] = courses.map(course => ({
											id: course.id,
											label: course.attributes.name,
										}));

										return (
											<Multiselect
												options={courseOptions}
												selectedIds={field.state.value}
												onChange={(selectedIds) => {
													field.handleChange(selectedIds);
													setSelectedCourseIds(selectedIds);
												}}
												label="Cursos"
												placeholder="Selecione os cursos"
												loading={loadingCourses}
												disabled={isLoading}
											/>
										);
									}}
								/>

								<form.Field
									name="class_room_ids"
									children={(field) => {
										const classRoomOptions: MultiselectOption[] = classRooms.map(classRoom => ({
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
													selectedCourseIds.length === 0
														? "Selecione cursos primeiro"
														: "Selecione as turmas"
												}
												loading={loadingClassRooms}
												disabled={isLoading || selectedCourseIds.length === 0}
											/>
										);
									}}
								/>
							</div>

							{/* Botões de Ação */}
							<div className="pt-6 flex gap-4">
								<Button
									type="button"
									variant="outline"
									onClick={() => router.back()}
									className="flex-1 h-11 text-base font-medium rounded-lg hover:bg-secondary/50 transition-all duration-200 border-border/50"
									disabled={isLoading}
								>
									Cancelar
								</Button>
								<Button
									type="submit"
									className="flex-1 h-11 text-base font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70"
									disabled={isLoading}
									loading={isLoading}
									loadingIcon={<Loader2 className="h-4 w-4 animate-spin" />}
								>
									{isLoading ? 'Criando Evento...' : 'Criar Evento'}
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

