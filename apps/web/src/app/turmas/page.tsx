"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthenticatedLayout from "@/components/authenticated-layout";
import { authUtils } from "@/utils/auth.utils";
import { applicationUtils } from "@/utils/application.utils";
import { toast } from "sonner";
import { Loader2, Users, Search, GraduationCap, BookOpen, Plus, Edit, Trash2, X, AlertCircle, Sparkles } from "lucide-react";
import { ClassRoomCard } from "@/components/ClassRoomCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from '@tanstack/react-form';
import { createClassRoomSchema, type CreateClassRoomFormData } from '@/validators/classroom.validator';
import { cn } from "@/lib/utils";
import { LoadMoreButton } from "@/components/LoadMoreButton";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";

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

interface ClassRoomsResponse {
	data: ClassRoom[];
	jsonapi: {
		version: string;
	};
}

interface CoursesResponse {
	data: Course[];
	jsonapi: {
		version: string;
	};
}

export default function TurmasPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [courses, setCourses] = useState<Course[]>([]);
	const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
	const [classRooms, setClassRooms] = useState<ClassRoom[]>([]);
	const [loadingCourses, setLoadingCourses] = useState(true);
	const [loadingClassRooms, setLoadingClassRooms] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const perPage = 20;
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [editingClassRoom, setEditingClassRoom] = useState<ClassRoom | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showValidationErrors, setShowValidationErrors] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [classRoomToDelete, setClassRoomToDelete] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// Buscar cursos ao carregar
	useEffect(() => {
		const fetchCourses = async () => {
			try {
				setLoadingCourses(true);
				const token = authUtils.getToken();
				if (!token) {
					toast.error('Você precisa estar autenticado');
					return;
				}

				const baseUrl = applicationUtils.getBaseUrl();
				if (!baseUrl) {
					throw new Error('URL do servidor não configurada');
				}

				const response = await fetch(`${baseUrl}/admin/courses`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
					},
				});

				if (!response.ok) {
					throw new Error(`Erro ao buscar cursos: ${response.status}`);
				}

				const data: CoursesResponse = await response.json();
				setCourses(data.data || []);
			} catch (error) {
				console.error('Erro ao buscar cursos:', error);
				toast.error(
					error instanceof Error 
						? error.message 
						: 'Erro ao carregar cursos'
				);
			} finally {
				setLoadingCourses(false);
			}
		};

		fetchCourses();
	}, []);

	// Selecionar curso automaticamente se houver parâmetro na URL
	useEffect(() => {
		const courseIdFromUrl = searchParams.get('course_id');
		if (courseIdFromUrl && courses.length > 0) {
			// Verificar se o curso existe na lista
			const courseExists = courses.some(c => c.id === courseIdFromUrl);
			if (courseExists) {
				setSelectedCourseId(courseIdFromUrl);
			}
		}
	}, [searchParams, courses]);

	// Buscar turmas quando um curso é selecionado
	useEffect(() => {
		const fetchClassRooms = async () => {
			if (!selectedCourseId) {
				setClassRooms([]);
				setCurrentPage(1);
				setHasMore(true);
				return;
			}

			try {
				setLoadingClassRooms(true);
				setCurrentPage(1);
				setHasMore(true);
				const token = authUtils.getToken();
				if (!token) {
					toast.error('Você precisa estar autenticado');
					return;
				}

				const baseUrl = applicationUtils.getBaseUrl();
				if (!baseUrl) {
					throw new Error('URL do servidor não configurada');
				}

				const response = await fetch(`${baseUrl}/admin/courses/${selectedCourseId}/class_rooms?per_page=${perPage}&page=1`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
					},
				});

				if (!response.ok) {
					throw new Error(`Erro ao buscar turmas: ${response.status}`);
				}

				const data: ClassRoomsResponse = await response.json();
				setClassRooms(data.data || []);
				setHasMore(data.data.length === perPage);
			} catch (error) {
				console.error('Erro ao buscar turmas:', error);
				toast.error(
					error instanceof Error 
						? error.message 
						: 'Erro ao carregar turmas'
				);
				setClassRooms([]);
			} finally {
				setLoadingClassRooms(false);
			}
		};

		fetchClassRooms();
	}, [selectedCourseId]);

	// Função para carregar mais turmas
	const handleLoadMore = async () => {
		if (loadingMore || !hasMore || !selectedCourseId) return;

		try {
			setLoadingMore(true);
			const token = authUtils.getToken();
			if (!token) {
				toast.error('Você precisa estar autenticado');
				return;
			}

			const baseUrl = applicationUtils.getBaseUrl();
			if (!baseUrl) {
				throw new Error('URL do servidor não configurada');
			}

			const nextPage = currentPage + 1;
			const response = await fetch(`${baseUrl}/admin/courses/${selectedCourseId}/class_rooms?per_page=${perPage}&page=${nextPage}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error(`Erro ao buscar turmas: ${response.status}`);
			}

			const data: ClassRoomsResponse = await response.json();
			setClassRooms(prev => [...prev, ...data.data]);
			setHasMore(data.data.length === perPage);
			setCurrentPage(nextPage);
		} catch (error) {
			console.error('Erro ao carregar mais turmas:', error);
			toast.error(
				error instanceof Error 
					? error.message 
					: 'Erro ao carregar mais turmas'
			);
		} finally {
			setLoadingMore(false);
		}
	};

	// Filtrar turmas por termo de busca
	const filteredClassRooms = classRooms.filter((classRoom) =>
		classRoom.attributes.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		classRoom.attributes.course.name.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const selectedCourse = courses.find(c => c.id === selectedCourseId);

	// Form de criação
	const createForm = useForm({
		defaultValues: {
			name: '',
			period: 1,
		} as CreateClassRoomFormData,
		validators: {
			onChange: ({ value }) => {
				const result = createClassRoomSchema.safeParse(value);
				if (result.success) return undefined;
				return result.error.flatten().fieldErrors.name?.[0] ||
					result.error.flatten().fieldErrors.period?.[0] ||
					'Erro de validação';
			},
		},
		onSubmitInvalid: ({ value }) => {
			setShowValidationErrors(true);
			const result = createClassRoomSchema.safeParse(value);
			if (!result.success) {
				const errors = result.error.flatten().fieldErrors;
				const errorMessages: string[] = [];
				const fieldLabels: Record<string, string> = {
					name: 'Nome da Turma',
					period: 'Período',
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
			if (!selectedCourseId) {
				toast.error('Selecione um curso primeiro');
				return;
			}

			try {
				setIsSubmitting(true);
				const token = authUtils.getToken();
				if (!token) {
					toast.error('Você precisa estar autenticado');
					return;
				}

				const payload = {
					data: {
						type: "class_room",
						attributes: {
							name: value.name,
							period: value.period,
						}
					}
				};

				const baseUrl = applicationUtils.getBaseUrl();
				if (!baseUrl) {
					throw new Error('URL do servidor não configurada');
				}

				const url = `${baseUrl}/admin/courses/${selectedCourseId}/class_rooms`;
				const response = await fetch(url, {
					method: 'POST',
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
						`Erro ao criar turma: ${response.status} ${response.statusText}`
					);
				}

				toast.success('Turma criada com sucesso!');
				setShowCreateModal(false);
				createForm.reset();
				
				// Recarregar turmas
				setCurrentPage(1);
				const refreshResponse = await fetch(`${baseUrl}/admin/courses/${selectedCourseId}/class_rooms?per_page=${perPage}&page=1`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
					},
				});

				if (refreshResponse.ok) {
					const refreshData: ClassRoomsResponse = await refreshResponse.json();
					setClassRooms(refreshData.data || []);
					setHasMore(refreshData.data.length === perPage);
				}
			} catch (error) {
				console.error('Erro ao criar turma:', error);
				toast.error(
					error instanceof Error 
						? error.message 
						: 'Erro ao criar turma. Tente novamente.'
				);
			} finally {
				setIsSubmitting(false);
			}
		},
	});

	// Form de edição
	const editForm = useForm({
		defaultValues: {
			name: '',
			period: 1,
		} as CreateClassRoomFormData,
		validators: {
			onChange: ({ value }) => {
				const result = createClassRoomSchema.safeParse(value);
				if (result.success) return undefined;
				return result.error.flatten().fieldErrors.name?.[0] ||
					result.error.flatten().fieldErrors.period?.[0] ||
					'Erro de validação';
			},
		},
		onSubmitInvalid: ({ value }) => {
			setShowValidationErrors(true);
			const result = createClassRoomSchema.safeParse(value);
			if (!result.success) {
				const errors = result.error.flatten().fieldErrors;
				const errorMessages: string[] = [];
				const fieldLabels: Record<string, string> = {
					name: 'Nome da Turma',
					period: 'Período',
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
			if (!selectedCourseId || !editingClassRoom) {
				toast.error('Dados inválidos');
				return;
			}

			try {
				setIsSubmitting(true);
				const token = authUtils.getToken();
				if (!token) {
					toast.error('Você precisa estar autenticado');
					return;
				}

				const payload = {
					data: {
						type: "class_room",
						attributes: {
							name: value.name,
							period: value.period,
						}
					}
				};

				const baseUrl = applicationUtils.getBaseUrl();
				if (!baseUrl) {
					throw new Error('URL do servidor não configurada');
				}

				const url = `${baseUrl}/admin/courses/${selectedCourseId}/class_rooms/${editingClassRoom.id}`;
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
						`Erro ao atualizar turma: ${response.status} ${response.statusText}`
					);
				}

				toast.success('Turma atualizada com sucesso!');
				setShowEditModal(false);
				setEditingClassRoom(null);
				
				// Recarregar turmas
				setCurrentPage(1);
				const refreshResponse = await fetch(`${baseUrl}/admin/courses/${selectedCourseId}/class_rooms?per_page=${perPage}&page=1`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
					},
				});

				if (refreshResponse.ok) {
					const refreshData: ClassRoomsResponse = await refreshResponse.json();
					setClassRooms(refreshData.data || []);
					setHasMore(refreshData.data.length === perPage);
				}
			} catch (error) {
				console.error('Erro ao atualizar turma:', error);
				toast.error(
					error instanceof Error 
						? error.message 
						: 'Erro ao atualizar turma. Tente novamente.'
				);
			} finally {
				setIsSubmitting(false);
			}
		},
	});

	// Função para abrir modal de criação
	const handleOpenCreateModal = () => {
		if (!selectedCourseId) {
			toast.error('Selecione um curso primeiro');
			return;
		}
		createForm.reset();
		setShowCreateModal(true);
		setShowValidationErrors(false);
	};

	// Função para abrir modal de edição
	const handleOpenEditModal = (classRoom: ClassRoom) => {
		editForm.setFieldValue('name', classRoom.attributes.name);
		editForm.setFieldValue('period', classRoom.attributes.period);
		setEditingClassRoom(classRoom);
		setShowEditModal(true);
		setShowValidationErrors(false);
	};

	// Função para abrir modal de deletar turma
	const handleDeleteClassRoom = (classRoomId: string) => {
		setClassRoomToDelete(classRoomId);
		setShowDeleteModal(true);
	};

	// Função para confirmar deletar turma
	const confirmDeleteClassRoom = async () => {
		if (!classRoomToDelete || !selectedCourseId) {
			toast.error('Dados inválidos');
			return;
		}

		try {
			setIsDeleting(true);
			const token = authUtils.getToken();
			if (!token) {
				toast.error('Você precisa estar autenticado');
				return;
			}

			const baseUrl = applicationUtils.getBaseUrl();
			if (!baseUrl) {
				throw new Error('URL do servidor não configurada');
			}

			const response = await fetch(`${baseUrl}/admin/courses/${selectedCourseId}/class_rooms/${classRoomToDelete}`, {
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
					`Erro ao deletar turma: ${response.status} ${response.statusText}`
				);
			}

			toast.success('Turma deletada com sucesso!');
			
			// Remover turma da lista
			setClassRooms(prev => prev.filter(cr => cr.id !== classRoomToDelete));
			setShowDeleteModal(false);
			setClassRoomToDelete(null);
		} catch (error) {
			console.error('Erro ao deletar turma:', error);
			toast.error(
				error instanceof Error 
					? error.message 
					: 'Erro ao deletar turma. Tente novamente.'
			);
		} finally {
			setIsDeleting(false);
		}
	};

	const classRoomToDeleteData = classRooms.find(cr => cr.id === classRoomToDelete);

	return (
		<ProtectedRoute>
			<AuthenticatedLayout className="p-0">
				{/* Header com gradiente */}
				<section className="relative w-full overflow-hidden bg-linear-to-r from-[#0288D1] via-[#00ACC1] to-[#4DB6AC] shadow-xl">
					<div className="absolute inset-0 bg-linear-to-r from-black/5 to-transparent pointer-events-none" />
					
					<div className="container mx-auto px-6 relative z-10">
						<div className="flex flex-col items-center justify-center gap-6 min-h-[200px] md:min-h-[240px] py-8 md:py-12 text-center">
							<div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm animate-in fade-in zoom-in duration-500">
								<Users className="h-10 w-10 md:h-12 md:w-12 text-white" />
							</div>
							<div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
								<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
									Turmas
								</h1>
								<p className="text-base md:text-lg text-white/90 max-w-2xl">
									Visualize as turmas cadastradas por curso
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* Conteúdo Principal */}
				<div className="container mx-auto max-w-7xl px-6 py-8 md:py-12">
					{/* Seletor de Curso */}
					<div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500 delay-300">
						<div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
							<div className="flex items-center gap-3 mb-4">
								<GraduationCap className="h-5 w-5 text-primary" />
								<h2 className="text-lg font-semibold text-foreground">
									Selecione um Curso
								</h2>
							</div>
							{loadingCourses ? (
								<div className="flex items-center gap-3">
									<Loader2 className="h-4 w-4 animate-spin text-primary" />
									<p className="text-sm text-muted-foreground">Carregando cursos...</p>
								</div>
							) : courses.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									Nenhum curso cadastrado. Crie um curso primeiro para visualizar turmas.
								</p>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{courses.map((course) => (
										<button
											key={course.id}
											onClick={() => setSelectedCourseId(course.id)}
											className={cn(
												"p-4 rounded-lg border transition-all duration-200 text-left",
												selectedCourseId === course.id
													? "border-primary bg-primary/10 shadow-md"
													: "border-border/50 bg-card hover:bg-secondary/50 hover:border-primary/30"
											)}
										>
											<div className="flex items-start gap-3">
												<div className={cn(
													"p-2 rounded-lg shrink-0 transition-colors",
													selectedCourseId === course.id
														? "bg-primary/20"
														: "bg-primary/10"
												)}>
													<GraduationCap className={cn(
														"h-5 w-5 transition-colors",
														selectedCourseId === course.id
															? "text-primary"
															: "text-primary/70"
													)} />
												</div>
												<div className="flex-1 min-w-0">
													<h3 className={cn(
														"font-semibold mb-1 transition-colors",
														selectedCourseId === course.id
															? "text-primary"
															: "text-foreground"
													)}>
														{course.attributes.name}
													</h3>
													<p className="text-xs text-muted-foreground">
														{course.attributes.periods} {course.attributes.periods === 1 ? 'período' : 'períodos'}
													</p>
												</div>
												{selectedCourseId === course.id && (
													<div className="shrink-0">
														<div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
															<div className="h-2 w-2 rounded-full bg-primary-foreground" />
														</div>
													</div>
												)}
											</div>
										</button>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Listagem de Turmas */}
					{selectedCourseId && (
						<div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
							{/* Barra de Busca e Botão de Criar */}
							<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
								<div className="flex items-center gap-3">
									<BookOpen className="h-5 w-5 text-primary" />
									<div>
										<h2 className="text-lg font-semibold text-foreground">
											Turmas de {selectedCourse?.attributes.name}
										</h2>
										<p className="text-sm text-muted-foreground">
											{loadingClassRooms 
												? 'Carregando...' 
												: `${classRooms.length} ${classRooms.length === 1 ? 'turma encontrada' : 'turmas encontradas'}`
											}
										</p>
									</div>
								</div>
								<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
									<Input
										type="text"
										placeholder="Buscar turmas..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										icon={<Search className="h-4 w-4 text-primary" />}
										iconPosition="left"
										className="max-w-md w-full sm:w-auto"
									/>
									<Button 
										onClick={handleOpenCreateModal}
										className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
									>
										<Plus className="h-4 w-4 mr-2" />
										Criar Turma
									</Button>
								</div>
							</div>

							{/* Loading State */}
							{loadingClassRooms ? (
								<div className="flex items-center justify-center min-h-[400px]">
									<div className="flex flex-col items-center gap-4">
										<Loader2 className="h-10 w-10 animate-spin text-primary" />
										<p className="text-sm text-muted-foreground font-medium">
											Carregando turmas...
										</p>
									</div>
								</div>
							) : filteredClassRooms.length === 0 ? (
								<div className="flex flex-col items-center justify-center min-h-[400px] text-center">
									<div className="p-6 rounded-full bg-muted/50 mb-4">
										<Users className="h-12 w-12 text-muted-foreground" />
									</div>
									<h3 className="text-xl font-semibold text-foreground mb-2">
										{searchTerm ? 'Nenhuma turma encontrada' : 'Nenhuma turma cadastrada'}
									</h3>
									<p className="text-sm text-muted-foreground max-w-md">
										{searchTerm
											? `Não encontramos turmas com o termo "${searchTerm}". Tente buscar com outro termo.`
											: `Não há turmas cadastradas para o curso "${selectedCourse?.attributes.name}".`}
									</p>
								</div>
							) : (
								<>
									{/* Estatísticas */}
									{searchTerm && (
										<div className="flex items-center gap-4 text-sm text-muted-foreground">
											<span>
												{filteredClassRooms.length} {filteredClassRooms.length === 1 ? 'turma encontrada' : 'turmas encontradas'}
											</span>
											<span className="text-primary">
												Filtrando por: "{searchTerm}"
											</span>
										</div>
									)}

									{/* Grid de Turmas */}
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
										{filteredClassRooms.map((classRoom, index) => (
											<ClassRoomCard
												key={classRoom.id}
												classRoom={classRoom}
												index={index}
												onEdit={handleOpenEditModal}
												onDelete={handleDeleteClassRoom}
											/>
										))}
									</div>

									{/* Botão Carregar Mais */}
									{!searchTerm && (
										<LoadMoreButton
											onClick={handleLoadMore}
											loading={loadingMore}
											hasMore={hasMore}
										/>
									)}
								</>
							)}
						</div>
					)}

					{/* Estado inicial - sem curso selecionado */}
					{!selectedCourseId && !loadingCourses && (
						<div className="flex flex-col items-center justify-center min-h-[400px] text-center">
							<div className="p-6 rounded-full bg-muted/50 mb-4">
								<BookOpen className="h-12 w-12 text-muted-foreground" />
							</div>
							<h3 className="text-xl font-semibold text-foreground mb-2">
								Selecione um Curso
							</h3>
							<p className="text-sm text-muted-foreground max-w-md">
								Escolha um curso acima para visualizar suas turmas cadastradas.
							</p>
						</div>
					)}
				</div>

				{/* Modal de Criação de Turma */}
				{showCreateModal && selectedCourseId && (
					<div
						className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
						onClick={() => !isSubmitting && setShowCreateModal(false)}
					>
						<div
							className="relative bg-card rounded-2xl border border-border/50 shadow-2xl p-6 md:p-8 max-w-2xl w-full my-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
							onClick={(e) => e.stopPropagation()}
						>
							<button
								onClick={() => !isSubmitting && setShowCreateModal(false)}
								disabled={isSubmitting}
								className="absolute top-4 right-4 p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
								aria-label="Fechar modal"
							>
								<X className="h-5 w-5" />
							</button>

							<div className="mb-6">
								<div className="flex items-center gap-3 mb-2">
									<div className="p-2 rounded-lg bg-primary/10">
										<Sparkles className="h-5 w-5 text-primary" />
									</div>
									<h2 className="text-2xl font-bold text-foreground">
										Criar Turma
									</h2>
								</div>
								<p className="text-sm text-muted-foreground">
									Adicione uma nova turma ao curso {selectedCourse?.attributes.name}
								</p>
							</div>

							{showValidationErrors && (() => {
								const result = createClassRoomSchema.safeParse(createForm.state.values);
								if (!result.success) {
									const errors = result.error.flatten().fieldErrors;
									const errorList: Array<{ field: string; message: string; label: string }> = [];
									const fieldLabels: Record<string, string> = {
										name: 'Nome da Turma',
										period: 'Período',
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

							<form
								onSubmit={(e) => {
									e.preventDefault();
									e.stopPropagation();
									const result = createClassRoomSchema.safeParse(createForm.state.values);
									if (!result.success) {
										setShowValidationErrors(true);
									} else {
										setShowValidationErrors(false);
									}
									createForm.handleSubmit().catch((error) => {
										console.error('Erro no submit do formulário:', error);
									});
								}}
								className="space-y-6"
							>
								<div className="space-y-4">
									<div>
										<h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
											<Users className="h-5 w-5 text-primary" />
											Informações da Turma
										</h3>
									</div>

									<createForm.Field
										name="name"
										children={(field) => (
											<Input
												label="Nome da Turma"
												type="text"
												placeholder="Ex: Turma A"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												error={field.state.meta.errors.length > 0}
												errorMessage={field.state.meta.errors[0]}
												disabled={isSubmitting}
												icon={<Users className="h-4 w-4 text-primary" />}
												iconPosition="left"
											/>
										)}
									/>

									<createForm.Field
										name="period"
										children={(field) => (
											<Input
												label="Período"
												type="number"
												placeholder="Ex: 1"
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
												disabled={isSubmitting}
												icon={<BookOpen className="h-4 w-4 text-primary" />}
												iconPosition="left"
												min={1}
												max={selectedCourse?.attributes.periods || 20}
											/>
										)}
									/>
								</div>

								<div className="flex gap-4 pt-4 border-t border-border/50">
									<Button
										type="button"
										variant="outline"
										onClick={() => setShowCreateModal(false)}
										disabled={isSubmitting}
										className="flex-1"
									>
										Cancelar
									</Button>
									<Button
										type="submit"
										disabled={isSubmitting}
										className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
										loading={isSubmitting}
										loadingIcon={<Loader2 className="h-4 w-4 animate-spin" />}
									>
										{isSubmitting ? 'Criando...' : 'Criar Turma'}
									</Button>
								</div>
							</form>
						</div>
					</div>
				)}

				{/* Modal de Edição de Turma */}
				{showEditModal && editingClassRoom && selectedCourseId && (
					<div
						className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
						onClick={() => !isSubmitting && setShowEditModal(false)}
					>
						<div
							className="relative bg-card rounded-2xl border border-border/50 shadow-2xl p-6 md:p-8 max-w-2xl w-full my-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
							onClick={(e) => e.stopPropagation()}
						>
							<button
								onClick={() => !isSubmitting && setShowEditModal(false)}
								disabled={isSubmitting}
								className="absolute top-4 right-4 p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
								aria-label="Fechar modal"
							>
								<X className="h-5 w-5" />
							</button>

							<div className="mb-6">
								<div className="flex items-center gap-3 mb-2">
									<div className="p-2 rounded-lg bg-primary/10">
										<Sparkles className="h-5 w-5 text-primary" />
									</div>
									<h2 className="text-2xl font-bold text-foreground">
										Editar Turma
									</h2>
								</div>
								<p className="text-sm text-muted-foreground">
									Atualize as informações da turma
								</p>
							</div>

							{showValidationErrors && (() => {
								const result = createClassRoomSchema.safeParse(editForm.state.values);
								if (!result.success) {
									const errors = result.error.flatten().fieldErrors;
									const errorList: Array<{ field: string; message: string; label: string }> = [];
									const fieldLabels: Record<string, string> = {
										name: 'Nome da Turma',
										period: 'Período',
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

							<form
								onSubmit={(e) => {
									e.preventDefault();
									e.stopPropagation();
									const result = createClassRoomSchema.safeParse(editForm.state.values);
									if (!result.success) {
										setShowValidationErrors(true);
									} else {
										setShowValidationErrors(false);
									}
									editForm.handleSubmit().catch((error) => {
										console.error('Erro no submit do formulário:', error);
									});
								}}
								className="space-y-6"
							>
								<div className="space-y-4">
									<div>
										<h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
											<Users className="h-5 w-5 text-primary" />
											Informações da Turma
										</h3>
									</div>

									<editForm.Field
										name="name"
										children={(field) => (
											<Input
												label="Nome da Turma"
												type="text"
												placeholder="Ex: Turma A"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												error={field.state.meta.errors.length > 0}
												errorMessage={field.state.meta.errors[0]}
												disabled={isSubmitting}
												icon={<Users className="h-4 w-4 text-primary" />}
												iconPosition="left"
											/>
										)}
									/>

									<editForm.Field
										name="period"
										children={(field) => (
											<Input
												label="Período"
												type="number"
												placeholder="Ex: 1"
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
												disabled={isSubmitting}
												icon={<BookOpen className="h-4 w-4 text-primary" />}
												iconPosition="left"
												min={1}
												max={selectedCourse?.attributes.periods || 20}
											/>
										)}
									/>
								</div>

								<div className="flex gap-4 pt-4 border-t border-border/50">
									<Button
										type="button"
										variant="outline"
										onClick={() => setShowEditModal(false)}
										disabled={isSubmitting}
										className="flex-1"
									>
										Cancelar
									</Button>
									<Button
										type="submit"
										disabled={isSubmitting}
										className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
										loading={isSubmitting}
										loadingIcon={<Loader2 className="h-4 w-4 animate-spin" />}
									>
										{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
									</Button>
								</div>
							</form>
						</div>
					</div>
				)}

				{/* Modal de Confirmação de Exclusão */}
				<ConfirmDeleteModal
					isOpen={showDeleteModal}
					onClose={() => {
						setShowDeleteModal(false);
						setClassRoomToDelete(null);
					}}
					onConfirm={confirmDeleteClassRoom}
					title="Confirmar Exclusão"
					message={classRoomToDeleteData ? `Tem certeza que deseja deletar a turma "${classRoomToDeleteData.attributes.name}"?` : 'Tem certeza que deseja deletar esta turma?'}
					confirmText="Deletar Turma"
					isLoading={isDeleting}
				/>
			</AuthenticatedLayout>
		</ProtectedRoute>
	);
}
