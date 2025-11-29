"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthenticatedLayout from "@/components/authenticated-layout";
import { authUtils } from "@/utils/auth.utils";
import { applicationUtils } from "@/utils/application.utils";
import { toast } from "sonner";
import { 
	GraduationCap, 
	BookOpen, 
	Users, 
	ArrowLeft, 
	Loader2,
	XCircle,
	Info,
	Calendar,
	Edit,
	X,
	AlertCircle,
	Sparkles,
	Trash2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from '@tanstack/react-form';
import { editCourseSchema, type EditCourseFormData } from '@/validators/course.validator';
import Image from "next/image";
import CardBannerImage from "@/assets/images/home/card_banner.png";

interface CourseAttributes {
	id: string;
	name: string;
	periods: number;
}

interface Course {
	id: string;
	type: string;
	attributes: CourseAttributes;
	relationships?: {
		class_rooms?: {
			data: Array<{ type: string; id: string }>;
		};
	};
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

interface CourseResponse {
	data: Course;
	included?: ClassRoom[];
	jsonapi: {
		version: string;
	};
}

export default function CourseDetailPage() {
	const params = useParams();
	const router = useRouter();
	const courseId = params?.id as string;

	const [course, setCourse] = useState<Course | null>(null);
	const [classRooms, setClassRooms] = useState<ClassRoom[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showEditModal, setShowEditModal] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [showEditValidationErrors, setShowEditValidationErrors] = useState(false);

	useEffect(() => {
		const fetchCourse = async () => {
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

				const url = `${baseUrl}/admin/courses/${courseId}?include=class_rooms`;
				
				const response = await fetch(url, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
					},
				});

				if (!response.ok) {
					if (response.status === 404) {
						throw new Error('Curso não encontrado');
					}
					throw new Error(`Erro ao buscar curso: ${response.status}`);
				}

				const data: CourseResponse = await response.json();
				setCourse(data.data);

				// Separar turmas do included
				const fetchedClassRooms: ClassRoom[] = [];
				data.included?.forEach((item) => {
					if (item.type === 'class_rooms') {
						fetchedClassRooms.push(item as ClassRoom);
					}
				});
				setClassRooms(fetchedClassRooms);
			} catch (err) {
				console.error('Erro ao buscar curso:', err);
				setError(err instanceof Error ? err.message : 'Erro ao carregar curso');
				toast.error(err instanceof Error ? err.message : 'Erro ao carregar curso');
			} finally {
				setLoading(false);
			}
		};

		if (courseId) {
			fetchCourse();
		}
	}, [courseId, router]);

	// Form de edição
	const editForm = useForm({
		defaultValues: {
			name: '',
			periods: 1,
		} as EditCourseFormData,
		validators: {
			onChange: ({ value }) => {
				const result = editCourseSchema.safeParse(value);
				if (result.success) return undefined;
				return result.error.flatten().fieldErrors.name?.[0] ||
					result.error.flatten().fieldErrors.periods?.[0] ||
					'Erro de validação';
			},
		},
		onSubmitInvalid: ({ value }) => {
			setShowEditValidationErrors(true);
			const result = editCourseSchema.safeParse(value);
			if (!result.success) {
				const errors = result.error.flatten().fieldErrors;
				const errorMessages: string[] = [];
				const fieldLabels: Record<string, string> = {
					name: 'Nome do Curso',
					periods: 'Períodos',
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

				// Montar o payload no formato JSON:API
				const payload = {
					data: {
						type: "course",
						attributes: {
							name: value.name,
							periods: value.periods,
						}
					}
				};

				const baseUrl = applicationUtils.getBaseUrl();
				if (!baseUrl) {
					throw new Error('URL do servidor não configurada');
				}

				const url = `${baseUrl}/admin/courses/${courseId}`;
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
						`Erro ao atualizar curso: ${response.status} ${response.statusText}`
					);
				}

				toast.success('Curso atualizado com sucesso!');
				setShowEditModal(false);
				
				// Recarregar os dados do curso
				const refreshResponse = await fetch(`${baseUrl}/admin/courses/${courseId}?include=class_rooms`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
					},
				});

				if (refreshResponse.ok) {
					const refreshData: CourseResponse = await refreshResponse.json();
					setCourse(refreshData.data);
					
					// Atualizar turmas
					const fetchedClassRooms: ClassRoom[] = [];
					refreshData.included?.forEach((item) => {
						if (item.type === 'class_rooms') {
							fetchedClassRooms.push(item as ClassRoom);
						}
					});
					setClassRooms(fetchedClassRooms);
				}
			} catch (error) {
				console.error('Erro ao atualizar curso:', error);
				toast.error(
					error instanceof Error 
						? error.message 
						: 'Erro ao atualizar curso. Tente novamente.'
				);
			} finally {
				setIsEditing(false);
			}
		},
	});

	// Função para abrir modal de edição e preencher dados
	const handleOpenEditModal = () => {
		if (!course) return;
		
		// Preencher form com dados do curso
		editForm.setFieldValue('name', course.attributes.name);
		editForm.setFieldValue('periods', course.attributes.periods);
		
		setShowEditModal(true);
		setShowEditValidationErrors(false);
	};

	// Função para deletar curso
	const handleDeleteCourse = async () => {
		if (!course) return;

		const courseName = course.attributes.name;

		if (!confirm(`Tem certeza que deseja deletar o curso "${courseName}"?\n\nEsta ação não pode ser desfeita e todas as turmas relacionadas também serão afetadas.`)) {
			return;
		}

		try {
			const token = authUtils.getToken();
			if (!token) {
				toast.error('Você precisa estar autenticado');
				return;
			}

			const baseUrl = applicationUtils.getBaseUrl();
			if (!baseUrl) {
				throw new Error('URL do servidor não configurada');
			}

			const response = await fetch(`${baseUrl}/admin/courses/${courseId}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.message || 
					errorData.error ||
					`Erro ao deletar curso: ${response.status} ${response.statusText}`
				);
			}

			toast.success('Curso deletado com sucesso!');
			router.push('/cursos');
		} catch (error) {
			console.error('Erro ao deletar curso:', error);
			toast.error(
				error instanceof Error 
					? error.message 
					: 'Erro ao deletar curso. Tente novamente.'
			);
		}
	};

	if (loading) {
		return (
			<ProtectedRoute>
				<AuthenticatedLayout className="p-4 md:p-8">
					<div className="container mx-auto max-w-6xl flex items-center justify-center min-h-[60vh]">
						<div className="flex flex-col items-center gap-4">
							<Loader2 className="h-10 w-10 animate-spin text-primary" />
							<p className="text-sm text-muted-foreground font-medium">Carregando curso...</p>
						</div>
					</div>
				</AuthenticatedLayout>
			</ProtectedRoute>
		);
	}

	if (error || !course) {
		return (
			<ProtectedRoute>
				<AuthenticatedLayout className="p-4 md:p-8">
					<div className="container mx-auto max-w-6xl">
						<Link href="/cursos" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
							<ArrowLeft className="h-4 w-4" />
							Voltar para Cursos
						</Link>
						<div className="rounded-xl border border-destructive/50 bg-destructive/10 p-12 text-center">
							<XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
							<h2 className="text-2xl font-bold text-foreground mb-2">
								Erro ao carregar curso
							</h2>
							<p className="text-muted-foreground mb-6">
								{error || 'Curso não encontrado'}
							</p>
							<Button onClick={() => router.push('/cursos')}>
								Voltar para Cursos
							</Button>
						</div>
					</div>
				</AuthenticatedLayout>
			</ProtectedRoute>
		);
	}

	// Filtrar turmas que pertencem a este curso
	const courseClassRooms = classRooms.filter(
		(cr) => cr.attributes.course.id === course.id
	);

	return (
		<ProtectedRoute>
			<AuthenticatedLayout className="p-0">
				{/* Header com Banner */}
				<div className="relative w-full h-64 md:h-80 overflow-hidden bg-linear-to-r from-[#0288D1] via-[#00ACC1] to-[#4DB6AC]">
					<Image
						src={CardBannerImage}
						alt={course.attributes.name}
						fill
						className="object-cover opacity-40"
						priority
					/>
					<div className="absolute inset-0 bg-linear-to-t from-background via-background/50 to-transparent" />
					
					<div className="relative container mx-auto px-6 py-8">
						<Link href="/cursos" className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-6 backdrop-blur-sm bg-white/10 px-4 py-2 rounded-lg">
							<ArrowLeft className="h-4 w-4" />
							Voltar para Cursos
						</Link>
						
						<div className="max-w-4xl">
							<div className="flex items-center gap-4 mb-4">
								<div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm">
									<GraduationCap className="h-8 w-8 md:h-10 md:w-10 text-white" />
								</div>
								<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
									{course.attributes.name}
								</h1>
							</div>
						</div>
					</div>
				</div>

				{/* Conteúdo Principal */}
				<div className="container mx-auto max-w-6xl px-6 py-8 md:py-12">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						{/* Coluna Principal */}
						<div className="lg:col-span-2 space-y-6">
							{/* Informações do Curso */}
							<div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
								<h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
									<Info className="h-5 w-5 text-primary" />
									Informações do Curso
								</h2>
								
								<div className="space-y-6">
									{/* Nome do Curso */}
									<div className="flex items-start gap-4">
										<div className="p-3 rounded-lg bg-primary/10 shrink-0">
											<GraduationCap className="h-5 w-5 text-primary" />
										</div>
										<div className="flex-1">
											<p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
												Nome do Curso
											</p>
											<p className="text-base font-semibold text-foreground">
												{course.attributes.name}
											</p>
										</div>
									</div>

									{/* Períodos */}
									<div className="flex items-start gap-4">
										<div className="p-3 rounded-lg bg-primary/10 shrink-0">
											<BookOpen className="h-5 w-5 text-primary" />
										</div>
										<div className="flex-1">
											<p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
												Total de Períodos
											</p>
											<p className="text-base font-semibold text-foreground">
												{course.attributes.periods} {course.attributes.periods === 1 ? 'período' : 'períodos'}
											</p>
										</div>
									</div>
								</div>
							</div>

							{/* Lista de Turmas */}
							<div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
								<div className="mb-6">
									<div className="flex items-center justify-between mb-4">
										<h2 className="text-xl font-bold text-foreground flex items-center gap-2">
											<div className="p-2 rounded-lg bg-primary/10">
												<Users className="h-5 w-5 text-primary" />
											</div>
											Turmas
										</h2>
										<div className="flex items-center gap-3">
											{courseClassRooms.length > 0 && (
												<div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
													<span className="text-sm font-semibold text-primary">
														{courseClassRooms.length}
													</span>
													<span className="text-xs text-muted-foreground">
														{courseClassRooms.length === 1 ? 'turma' : 'turmas'}
													</span>
												</div>
											)}
											<Button
												variant="outline"
												size="sm"
												onClick={() => router.push(`/turmas?course_id=${courseId}` as any)}
												className="flex items-center gap-2"
											>
												<Users className="h-4 w-4" />
												Ver Todas as Turmas
											</Button>
										</div>
									</div>
								</div>

								{courseClassRooms.length === 0 ? (
									<div className="text-center py-12">
										<Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
										<p className="text-sm text-muted-foreground">
											Nenhuma turma cadastrada para este curso
										</p>
									</div>
								) : (
									<div className="space-y-4">
										{courseClassRooms.map((classRoom) => (
											<div
												key={classRoom.id}
												onClick={() => router.push(`/turmas/${courseId}/${classRoom.id}` as any)}
												className="group relative rounded-xl border border-border/50 bg-card hover:bg-secondary/50 hover:border-primary/30 hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer"
												role="button"
												tabIndex={0}
												onKeyDown={(e) => {
													if (e.key === 'Enter' || e.key === ' ') {
														e.preventDefault();
														router.push(`/turmas/${courseId}/${classRoom.id}` as any);
													}
												}}
												aria-label={`Ver detalhes da turma ${classRoom.attributes.name}`}
											>
												{/* Barra lateral de destaque */}
												<div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/30 group-hover:bg-primary transition-colors duration-300" />
												
												<div className="p-5">
													<div className="flex items-start gap-4">
														{/* Ícone da Turma */}
														<div className="relative shrink-0 p-4 rounded-xl bg-primary/20 group-hover:bg-primary/30 group-hover:scale-105 transition-all duration-300">
															<Users className="h-6 w-6 text-primary" />
														</div>

														{/* Informações da Turma */}
														<div className="flex-1 min-w-0">
															<div className="flex items-start justify-between gap-4 mb-3">
																<div className="flex-1 min-w-0">
																	<h3 className="text-base font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">
																		{classRoom.attributes.name}
																	</h3>
																	<div className="flex items-center gap-3 flex-wrap">
																		<div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
																			<Calendar className="h-3.5 w-3.5" />
																			<span className="font-semibold">Período:</span>
																			<span>{classRoom.attributes.period}º</span>
																		</div>
																	</div>
																</div>
															</div>
														</div>
													</div>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>

						{/* Sidebar */}
						<div className="lg:col-span-1">
							<div className="sticky top-8 space-y-6">
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
											Editar Curso
										</Button>
										<Button 
											variant="outline" 
											className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
											onClick={handleDeleteCourse}
											disabled={isEditing}
										>
											<Trash2 className="h-4 w-4 mr-2" />
											Deletar Curso
										</Button>
									</div>
								</div>

								{/* Card de Status */}
								<div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
									<h3 className="text-lg font-semibold text-foreground mb-4">
										Resumo do Curso
									</h3>
									<div className="space-y-3">
										<div className="flex items-center gap-3">
											<GraduationCap className="h-5 w-5 text-primary" />
											<span className="text-sm text-foreground">
												{course.attributes.periods} {course.attributes.periods === 1 ? 'período' : 'períodos'}
											</span>
										</div>
										<div className="flex items-center gap-3">
											<Users className="h-5 w-5 text-primary" />
											<span className="text-sm text-foreground">
												{courseClassRooms.length} {courseClassRooms.length === 1 ? 'turma cadastrada' : 'turmas cadastradas'}
											</span>
										</div>
									</div>
								</div>

								{/* Card de Estatísticas */}
								{courseClassRooms.length > 0 && (
									<div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
										<h3 className="text-lg font-semibold text-foreground mb-4">
											Distribuição por Período
										</h3>
										<div className="space-y-3">
											{Array.from({ length: course.attributes.periods }, (_, i) => i + 1).map((period) => {
												const turmasNoPeriodo = courseClassRooms.filter(
													(cr) => cr.attributes.period === period
												);
												return (
													<div key={period} className="flex items-center justify-between">
														<span className="text-sm text-foreground">
															{period}º período
														</span>
														<span className="text-sm font-semibold text-primary">
															{turmasNoPeriodo.length} {turmasNoPeriodo.length === 1 ? 'turma' : 'turmas'}
														</span>
													</div>
												);
											})}
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Modal de Edição de Curso */}
				{showEditModal && (
					<div
						className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
						onClick={() => !isEditing && setShowEditModal(false)}
					>
						<div
							className="relative bg-card rounded-2xl border border-border/50 shadow-2xl p-6 md:p-8 max-w-2xl w-full my-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
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
										Editar Curso
									</h2>
								</div>
								<p className="text-sm text-muted-foreground">
									Atualize as informações do curso
								</p>
							</div>

							{/* Erros de Validação */}
							{showEditValidationErrors && (() => {
								const result = editCourseSchema.safeParse(editForm.state.values);
								if (!result.success) {
									const errors = result.error.flatten().fieldErrors;
									const errorList: Array<{ field: string; message: string; label: string }> = [];
									const fieldLabels: Record<string, string> = {
										name: 'Nome do Curso',
										periods: 'Períodos',
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
									const result = editCourseSchema.safeParse(editForm.state.values);
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
								{/* Informações do Curso */}
								<div className="space-y-4">
									<div>
										<h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
											<GraduationCap className="h-5 w-5 text-primary" />
											Informações do Curso
										</h3>
									</div>

									<editForm.Field
										name="name"
										children={(field) => (
											<Input
												label="Nome do Curso"
												type="text"
												placeholder="Ex: Análise e Desenvolvimento de Sistemas"
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
										name="periods"
										children={(field) => (
											<Input
												label="Número de Períodos"
												type="number"
												placeholder="Ex: 6"
												value={field.state.value.toString()}
												onChange={(e) => {
													const value = parseInt(e.target.value, 10);
													if (!isNaN(value)) {
														field.handleChange(value);
													} else if (e.target.value === '') {
														field.handleChange(1);
													}
												}}
												onBlur={field.handleBlur}
												error={field.state.meta.errors.length > 0}
												errorMessage={field.state.meta.errors[0]}
												disabled={isEditing}
												min={1}
												max={20}
											/>
										)}
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

