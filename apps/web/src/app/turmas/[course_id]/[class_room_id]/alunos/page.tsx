"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthenticatedLayout from "@/components/authenticated-layout";
import { authUtils } from "@/utils/auth.utils";
import { applicationUtils } from "@/utils/application.utils";
import { toast } from "sonner";
import { 
	Loader2, 
	Users, 
	User,
	ArrowLeft,
	Mail,
	IdCard,
	Search,
	GraduationCap,
	BookOpen,
	AlertCircle,
	Plus,
	Edit,
	X,
	Sparkles,
	Trash2,
	Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from '@tanstack/react-form';
import { studentSchema, type StudentFormData } from '@/validators/student.validator';
import { cn } from "@/lib/utils";
import { LoadMoreButton } from "@/components/LoadMoreButton";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";

interface StudentAttributes {
	name: string;
	ra: string;
	class_room_id: string;
	email: string | null;
}

interface Student {
	id: string;
	type: string;
	attributes: StudentAttributes;
	relationships?: {
		class_room?: {
			meta: {
				included: boolean;
			};
		};
		participants?: {
			meta: {
				included: boolean;
			};
		};
	};
}

interface StudentsResponse {
	data: Student[];
	jsonapi: {
		version: string;
	};
}

export default function AlunosPage() {
	const params = useParams();
	const router = useRouter();
	const courseId = params?.course_id as string;
	const classRoomId = params?.class_room_id as string;

	const [students, setStudents] = useState<Student[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const perPage = 20;
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [editingStudent, setEditingStudent] = useState<Student | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showValidationErrors, setShowValidationErrors] = useState(false);
	const [studentsFormData, setStudentsFormData] = useState<Array<StudentFormData & { photos?: File[] }>>([
		{ name: '', ra: '', email: '', photos: [] }
	]);

	useEffect(() => {
		const fetchStudents = async () => {
			try {
				setLoading(true);
				setError(null);
				setCurrentPage(1);
				setHasMore(true);

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

				const response = await fetch(
					`${baseUrl}/admin/courses/${courseId}/class_rooms/${classRoomId}/students?per_page=${perPage}&page=1`,
					{
						method: 'GET',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${token}`,
						},
					}
				);

				if (!response.ok) {
					if (response.status === 404) {
						throw new Error('Turma não encontrada');
					}
					throw new Error(`Erro ao buscar alunos: ${response.status}`);
				}

				const data: StudentsResponse = await response.json();
				setStudents(data.data || []);
				setHasMore(data.data.length === perPage);
			} catch (error) {
				console.error('Erro ao buscar alunos:', error);
				const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar alunos';
				setError(errorMessage);
				toast.error(errorMessage);
			} finally {
				setLoading(false);
			}
		};

		if (courseId && classRoomId) {
			fetchStudents();
		}
	}, [courseId, classRoomId, router]);

	// Função para carregar mais alunos
	const handleLoadMore = async () => {
		if (loadingMore || !hasMore || !courseId || !classRoomId) return;

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
			const response = await fetch(
				`${baseUrl}/admin/courses/${courseId}/class_rooms/${classRoomId}/students?per_page=${perPage}&page=${nextPage}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
					},
				}
			);

			if (!response.ok) {
				throw new Error(`Erro ao buscar alunos: ${response.status}`);
			}

			const data: StudentsResponse = await response.json();
			setStudents(prev => [...prev, ...data.data]);
			setHasMore(data.data.length === perPage);
			setCurrentPage(nextPage);
		} catch (error) {
			console.error('Erro ao carregar mais alunos:', error);
			toast.error(
				error instanceof Error 
					? error.message 
					: 'Erro ao carregar mais alunos'
			);
		} finally {
			setLoadingMore(false);
		}
	};

	// Filtrar alunos por termo de busca
	const filteredStudents = students.filter((student) =>
		student.attributes.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
		student.attributes.ra.toLowerCase().includes(searchTerm.toLowerCase()) ||
		(student.attributes.email && student.attributes.email.toLowerCase().includes(searchTerm.toLowerCase()))
	);

	// Funções para gerenciar formulário de criação (múltiplos estudantes)
	const handleAddStudentForm = () => {
		setStudentsFormData([...studentsFormData, { name: '', ra: '', email: '', photos: [] }]);
	};

	const handleRemoveStudentForm = (index: number) => {
		if (studentsFormData.length > 1) {
			setStudentsFormData(studentsFormData.filter((_, i) => i !== index));
		}
	};

	const handleUpdateStudentForm = (index: number, field: keyof StudentFormData, value: string) => {
		const updated = [...studentsFormData];
		updated[index] = { ...updated[index], [field]: value };
		setStudentsFormData(updated);
	};

	const handleAddPhoto = (studentIndex: number, files: FileList | null) => {
		if (!files) return;
		
		const updated = [...studentsFormData];
		const currentPhotos = updated[studentIndex].photos || [];
		const newPhotos = Array.from(files);
		
		// Limitar a 10 fotos no total
		const totalPhotos = currentPhotos.length + newPhotos.length;
		if (totalPhotos > 10) {
			toast.error('Máximo de 10 fotos por aluno');
			return;
		}

		// Validar que são imagens
		const validPhotos = newPhotos.filter(file => file.type.startsWith('image/'));
		if (validPhotos.length !== newPhotos.length) {
			toast.error('Apenas arquivos de imagem são permitidos');
		}

		updated[studentIndex] = {
			...updated[studentIndex],
			photos: [...currentPhotos, ...validPhotos].slice(0, 10)
		};
		setStudentsFormData(updated);
	};

	const handleRemovePhoto = (studentIndex: number, photoIndex: number) => {
		const updated = [...studentsFormData];
		const currentPhotos = updated[studentIndex].photos || [];
		updated[studentIndex] = {
			...updated[studentIndex],
			photos: currentPhotos.filter((_, i) => i !== photoIndex)
		};
		setStudentsFormData(updated);
	};

	// Função para criar estudantes
	const handleCreateStudents = async () => {
		// Validação
		const errors: string[] = [];
		studentsFormData.forEach((student, index) => {
			const result = studentSchema.safeParse({
				name: student.name,
				ra: student.ra,
				email: student.email || null,
			});
			
			if (!result.success) {
				const fieldErrors = result.error.flatten().fieldErrors;
				Object.entries(fieldErrors).forEach(([field, messages]) => {
					if (messages && messages.length > 0) {
						errors.push(`Aluno ${index + 1} - ${field === 'name' ? 'Nome' : field === 'ra' ? 'RA' : 'Email'}: ${messages[0]}`);
					}
				});
			}

			// Validar fotos (mínimo 3, máximo 10)
			const photoCount = student.photos?.length || 0;
			if (photoCount < 3) {
				errors.push(`Aluno ${index + 1}: Mínimo de 3 fotos é obrigatório`);
			}
		});

		if (errors.length > 0) {
			toast.error(`Erros de validação:\n${errors.join('\n')}`, { duration: 6000 });
			setShowValidationErrors(true);
			return;
		}

		try {
			setIsSubmitting(true);
			const token = authUtils.getToken();
			if (!token) {
				toast.error('Você precisa estar autenticado');
				return;
			}

			const baseUrl = applicationUtils.getBaseUrl();
			if (!baseUrl) {
				throw new Error('URL do servidor não configurada');
			}

			// Criar FormData para enviar dados e fotos
			const formData = new FormData();

			// Adicionar dados dos estudantes no formato JSON-API
			const studentsData = studentsFormData.map((student, index) => ({
				type: "students",
				attributes: {
					name: student.name.trim(),
					ra: student.ra.trim(),
					email: student.email?.trim() || null,
				}
			}));

			formData.append('data', JSON.stringify(studentsData));

			// Adicionar todas as fotos de todos os estudantes no parâmetro files[]
			// Usando files[] para indicar que é um array de arquivos
			studentsFormData.forEach((student, studentIndex) => {
				if (student.photos && student.photos.length > 0) {
					student.photos.forEach((photo, photoIndex) => {
						formData.append('files[]', photo, `student_${studentIndex}_photo_${photoIndex}.${photo.name.split('.').pop()}`);
					});
				}
			});

			const response = await fetch(
				`${baseUrl}/admin/courses/${courseId}/class_rooms/${classRoomId}/students`,
				{
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${token}`,
						// Não definir Content-Type - o navegador vai definir automaticamente com o boundary correto
					},
					body: formData,
				}
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.message || 
					errorData.error ||
					`Erro ao criar alunos: ${response.status} ${response.statusText}`
				);
			}

			toast.success(`${studentsFormData.length} ${studentsFormData.length === 1 ? 'aluno criado' : 'alunos criados'} com sucesso!`);
			setShowCreateModal(false);
			setStudentsFormData([{ name: '', ra: '', email: '', photos: [] }]);
			
			// Recarregar alunos - resetar página e buscar novamente
			setCurrentPage(1);
			setHasMore(true);
			const refreshResponse = await fetch(
				`${baseUrl}/admin/courses/${courseId}/class_rooms/${classRoomId}/students?per_page=${perPage}&page=1`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
					},
				}
			);

			if (refreshResponse.ok) {
				const refreshData: StudentsResponse = await refreshResponse.json();
				setStudents(refreshData.data || []);
				setHasMore(refreshData.data.length === perPage);
			}
		} catch (error) {
			console.error('Erro ao criar alunos:', error);
			toast.error(
				error instanceof Error 
					? error.message 
					: 'Erro ao criar alunos. Tente novamente.'
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Form de edição
	const editForm = useForm({
		defaultValues: {
			name: '',
			ra: '',
			email: '',
		} as StudentFormData,
		validators: {
			onChange: ({ value }) => {
				const result = studentSchema.safeParse(value);
				if (result.success) return undefined;
				return result.error.flatten().fieldErrors.name?.[0] ||
					result.error.flatten().fieldErrors.ra?.[0] ||
					result.error.flatten().fieldErrors.email?.[0] ||
					'Erro de validação';
			},
		},
		onSubmitInvalid: ({ value }) => {
			setShowValidationErrors(true);
			const result = studentSchema.safeParse(value);
			if (!result.success) {
				const errors = result.error.flatten().fieldErrors;
				const errorMessages: string[] = [];
				const fieldLabels: Record<string, string> = {
					name: 'Nome',
					ra: 'RA',
					email: 'Email',
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
			if (!editingStudent) {
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
						type: "students",
						attributes: {
							name: value.name.trim(),
							ra: value.ra.trim(),
							email: value.email?.trim() || null,
						}
					}
				};

				const baseUrl = applicationUtils.getBaseUrl();
				if (!baseUrl) {
					throw new Error('URL do servidor não configurada');
				}

				const response = await fetch(
					`${baseUrl}/admin/courses/${courseId}/class_rooms/${classRoomId}/students/${editingStudent.id}`,
					{
						method: 'PATCH',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${token}`,
						},
						body: JSON.stringify(payload),
					}
				);

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					throw new Error(
						errorData.message || 
						errorData.error ||
						`Erro ao atualizar aluno: ${response.status} ${response.statusText}`
					);
				}

				toast.success('Aluno atualizado com sucesso!');
				setShowEditModal(false);
				setEditingStudent(null);
				
				// Recarregar alunos
				setCurrentPage(1);
				const refreshResponse = await fetch(
					`${baseUrl}/admin/courses/${courseId}/class_rooms/${classRoomId}/students?per_page=${perPage}&page=1`,
					{
						method: 'GET',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${token}`,
						},
					}
				);

				if (refreshResponse.ok) {
					const refreshData: StudentsResponse = await refreshResponse.json();
					setStudents(refreshData.data || []);
					setHasMore(refreshData.data.length === perPage);
				}
			} catch (error) {
				console.error('Erro ao atualizar aluno:', error);
				toast.error(
					error instanceof Error 
						? error.message 
						: 'Erro ao atualizar aluno. Tente novamente.'
				);
			} finally {
				setIsSubmitting(false);
			}
		},
	});

	// Função para abrir modal de criação
	const handleOpenCreateModal = () => {
		setStudentsFormData([{ name: '', ra: '', email: '', photos: [] }]);
		setShowCreateModal(true);
		setShowValidationErrors(false);
	};

	// Função para abrir modal de edição
	const handleOpenEditModal = (student: Student) => {
		editForm.setFieldValue('name', student.attributes.name);
		editForm.setFieldValue('ra', student.attributes.ra);
		editForm.setFieldValue('email', student.attributes.email || '');
		setEditingStudent(student);
		setShowEditModal(true);
		setShowValidationErrors(false);
	};

	// Função para abrir modal de deletar aluno
	const handleDeleteStudent = (studentId: string) => {
		setStudentToDelete(studentId);
		setShowDeleteModal(true);
	};

	// Função para confirmar deletar aluno
	const confirmDeleteStudent = async () => {
		if (!studentToDelete) return;

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

			const response = await fetch(
				`${baseUrl}/admin/courses/${courseId}/class_rooms/${classRoomId}/students/${studentToDelete}`,
				{
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
					},
				}
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.message || 
					errorData.error ||
					`Erro ao deletar aluno: ${response.status} ${response.statusText}`
				);
			}

			toast.success('Aluno deletado com sucesso!');
			
			// Remover aluno da lista
			setStudents(prev => prev.filter(s => s.id !== studentToDelete));
			setShowDeleteModal(false);
			setStudentToDelete(null);
		} catch (error) {
			console.error('Erro ao deletar aluno:', error);
			toast.error(
				error instanceof Error 
					? error.message 
					: 'Erro ao deletar aluno. Tente novamente.'
			);
		} finally {
			setIsDeleting(false);
		}
	};

	const studentToDeleteData = students.find(s => s.id === studentToDelete);

	if (loading) {
		return (
			<ProtectedRoute>
				<AuthenticatedLayout className="p-0">
					<div className="flex items-center justify-center min-h-screen">
						<div className="flex flex-col items-center gap-4">
							<Loader2 className="h-10 w-10 animate-spin text-primary" />
							<p className="text-sm text-muted-foreground font-medium">
								Carregando alunos...
							</p>
						</div>
					</div>
				</AuthenticatedLayout>
			</ProtectedRoute>
		);
	}

	if (error) {
		return (
			<ProtectedRoute>
				<AuthenticatedLayout className="p-0">
					<div className="container mx-auto max-w-7xl px-6 py-12">
						<div className="flex flex-col items-center justify-center min-h-[400px] text-center">
							<div className="p-6 rounded-full bg-destructive/10 mb-4">
								<AlertCircle className="h-12 w-12 text-destructive" />
							</div>
							<h3 className="text-xl font-semibold text-foreground mb-2">
								{error}
							</h3>
							<p className="text-sm text-muted-foreground max-w-md mb-6">
								Não foi possível carregar os alunos. Tente novamente mais tarde.
							</p>
							<Button
								variant="outline"
								onClick={() => router.push(`/turmas/${courseId}/${classRoomId}` as any)}
							>
								<ArrowLeft className="h-4 w-4 mr-2" />
								Voltar para Turma
							</Button>
						</div>
					</div>
				</AuthenticatedLayout>
			</ProtectedRoute>
		);
	}

	return (
		<ProtectedRoute>
			<AuthenticatedLayout className="p-0">
				{/* Header com gradiente */}
				<section className="relative w-full overflow-hidden bg-linear-to-r from-[#0288D1] via-[#00ACC1] to-[#4DB6AC] shadow-xl">
					<div className="absolute inset-0 bg-linear-to-r from-black/5 to-transparent pointer-events-none" />
					
					<div className="container mx-auto px-6 relative z-10">
						<div className="flex flex-col gap-6 min-h-[200px] md:min-h-[240px] py-8 md:py-12">
							<Button
								variant="ghost"
								onClick={() => router.push(`/turmas/${courseId}/${classRoomId}` as any)}
								className="w-fit text-white/90 hover:text-white hover:bg-white/10 mb-2"
							>
								<ArrowLeft className="h-4 w-4 mr-2" />
								Voltar
							</Button>
							
							<div className="flex flex-col items-start gap-6">
								<div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm animate-in fade-in zoom-in duration-500">
									<User className="h-10 w-10 md:h-12 md:w-12 text-white" />
								</div>
								<div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
									<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
										Alunos
									</h1>
									<p className="text-base md:text-lg text-white/90">
										{students.length} {students.length === 1 ? 'aluno cadastrado' : 'alunos cadastrados'}
									</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Conteúdo Principal */}
				<div className="container mx-auto max-w-7xl px-6 py-8 md:py-12">
					{/* Barra de Busca */}
					<div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500 delay-300">
						<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
							<Input
								type="text"
								placeholder="Buscar alunos por nome, RA ou email..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								icon={<Search className="h-4 w-4 text-primary" />}
								iconPosition="left"
								className="max-w-md w-full sm:w-auto"
							/>
							{searchTerm && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setSearchTerm("")}
									className="text-muted-foreground hover:text-foreground"
								>
									Limpar busca
								</Button>
							)}
						</div>
						<Button 
							onClick={handleOpenCreateModal}
							className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
						>
							<Plus className="h-4 w-4 mr-2" />
							Criar Aluno(s)
						</Button>
					</div>

					{/* Loading State */}
					{loading ? (
						<div className="flex items-center justify-center min-h-[400px]">
							<div className="flex flex-col items-center gap-4">
								<Loader2 className="h-10 w-10 animate-spin text-primary" />
								<p className="text-sm text-muted-foreground font-medium">
									Carregando alunos...
								</p>
							</div>
						</div>
					) : filteredStudents.length === 0 ? (
						<div className="flex flex-col items-center justify-center min-h-[400px] text-center">
							<div className="p-6 rounded-full bg-muted/50 mb-4">
								<User className="h-12 w-12 text-muted-foreground" />
							</div>
							<h3 className="text-xl font-semibold text-foreground mb-2">
								{searchTerm ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
							</h3>
							<p className="text-sm text-muted-foreground max-w-md">
								{searchTerm
									? `Não encontramos alunos com o termo "${searchTerm}". Tente buscar com outro termo.`
									: 'Não há alunos cadastrados nesta turma.'}
							</p>
						</div>
					) : (
						<>
							{/* Estatísticas */}
							{searchTerm && (
								<div className="mb-6 flex items-center gap-4 text-sm text-muted-foreground animate-in fade-in slide-in-from-top-4 duration-500 delay-400">
									<span>
										{filteredStudents.length} {filteredStudents.length === 1 ? 'aluno encontrado' : 'alunos encontrados'}
									</span>
									<span className="text-primary">
										Filtrando por: "{searchTerm}"
									</span>
								</div>
							)}

							{/* Grid de Alunos */}
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{filteredStudents.map((student, index) => (
									<div
										key={student.id}
										onClick={() => router.push(`/alunos/${courseId}/${classRoomId}/${student.id}` as any)}
										className={cn(
											"group relative rounded-xl border border-border/50 bg-card shadow-sm",
											"hover:shadow-xl hover:shadow-primary/10 transition-all duration-300",
											"hover:-translate-y-1 hover:border-primary/30",
											"overflow-hidden cursor-pointer",
											"animate-in fade-in slide-in-from-bottom-4",
											"flex flex-col"
										)}
										style={{
											animationDelay: `${index * 100}ms`,
										}}
										role="button"
										tabIndex={0}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault();
												router.push(`/alunos/${courseId}/${classRoomId}/${student.id}` as any);
											}
										}}
										aria-label={`Ver detalhes do aluno ${student.attributes.name}`}
									>
										{/* Botões de Ação */}
										<div className="absolute top-3 right-3 z-10 flex items-center gap-1">
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
												onClick={(e) => {
													e.stopPropagation();
													handleOpenEditModal(student);
												}}
												aria-label={`Editar aluno ${student.attributes.name}`}
											>
												<Edit className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
												onClick={(e) => {
													e.stopPropagation();
													handleDeleteStudent(student.id);
												}}
												aria-label={`Deletar aluno ${student.attributes.name}`}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
										<div className="absolute inset-0 bg-linear-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/3 group-hover:to-primary/5 transition-all duration-300 pointer-events-none" />
										
										<div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary via-primary/50 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

										{/* Header com gradiente */}
										<div className="relative w-full h-24 overflow-hidden bg-linear-to-br from-primary/20 via-primary/10 to-primary/5">
											<div className="absolute inset-0 bg-linear-to-t from-card/60 via-card/20 to-transparent" />
											<div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
											
											{/* Ícone do aluno */}
											<div className="absolute top-4 left-4 p-3 rounded-xl bg-primary/20 backdrop-blur-sm group-hover:bg-primary/30 group-hover:scale-110 transition-all duration-300">
												<User className="h-6 w-6 text-primary" />
											</div>
										</div>

										<div className="relative p-6 space-y-4 flex-1">
											<div className="space-y-2">
												<h3 className="text-lg font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-300">
													{student.attributes.name}
												</h3>
											</div>

											<div className="h-px bg-border group-hover:bg-primary/30 transition-colors duration-300" />

											<div className="space-y-3">
												{/* RA */}
												<div className="flex items-start gap-3">
													<div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300 shrink-0">
														<IdCard className="h-4 w-4 text-primary" />
													</div>
													<div className="flex-1 min-w-0">
														<p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
															RA
														</p>
														<p className="text-sm font-semibold text-foreground">
															{student.attributes.ra}
														</p>
													</div>
												</div>

												{/* Email */}
												{student.attributes.email && (
													<div className="flex items-start gap-3">
														<div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300 shrink-0">
															<Mail className="h-4 w-4 text-primary" />
														</div>
														<div className="flex-1 min-w-0">
															<p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
																Email
															</p>
															<p className="text-sm font-semibold text-foreground line-clamp-2 break-all">
																{student.attributes.email}
															</p>
														</div>
													</div>
												)}
											</div>
										</div>
									</div>
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

				{/* Modal de Criação de Alunos */}
				{showCreateModal && (
					<div
						className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
						onClick={() => !isSubmitting && setShowCreateModal(false)}
					>
						<div
							className="relative bg-card rounded-2xl border border-border/50 shadow-2xl p-6 md:p-8 max-w-4xl w-full my-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
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
										Criar Aluno(s)
									</h2>
								</div>
								<p className="text-sm text-muted-foreground">
									Adicione um ou mais alunos à turma
								</p>
							</div>

							{showValidationErrors && (() => {
								const errors: string[] = [];
								studentsFormData.forEach((student, index) => {
									const result = studentSchema.safeParse({
										name: student.name,
										ra: student.ra,
										email: student.email || null,
									});
									if (!result.success) {
										const fieldErrors = result.error.flatten().fieldErrors;
										Object.entries(fieldErrors).forEach(([field, messages]) => {
											if (messages && messages.length > 0) {
												errors.push(`Aluno ${index + 1} - ${field === 'name' ? 'Nome' : field === 'ra' ? 'RA' : 'Email'}: ${messages[0]}`);
											}
										});
									}
									const photoCount = student.photos?.length || 0;
									if (photoCount < 3) {
										errors.push(`Aluno ${index + 1}: Mínimo de 3 fotos é obrigatório`);
									}
								});
								if (errors.length > 0) {
									return (
										<div className="p-4 mb-6 rounded-lg bg-destructive/10 border border-destructive/30">
											<div className="flex items-start gap-3">
												<AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
												<div className="flex-1">
													<h3 className="text-sm font-semibold text-destructive mb-2">
														Erros de Validação
													</h3>
													<ul className="space-y-1">
														{errors.map((error, index) => (
															<li key={index} className="text-sm text-destructive/90">
																{error}
															</li>
														))}
													</ul>
												</div>
											</div>
										</div>
									);
								}
								return null;
							})()}

							<div className="space-y-6 mb-6">
								{studentsFormData.map((student, index) => (
									<div
										key={index}
										className="p-4 rounded-lg border border-border/50 bg-secondary/30 space-y-4"
									>
										<div className="flex items-center justify-between mb-3">
											<span className="text-sm font-semibold text-foreground">
												Aluno {index + 1}
											</span>
											{studentsFormData.length > 1 && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleRemoveStudentForm(index)}
													disabled={isSubmitting}
													className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											)}
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<Input
												label="Nome do Aluno"
												type="text"
												placeholder="Ex: João Silva"
												value={student.name}
												onChange={(e) => handleUpdateStudentForm(index, 'name', e.target.value)}
												disabled={isSubmitting}
												icon={<User className="h-4 w-4 text-primary" />}
												iconPosition="left"
											/>

											<Input
												label="RA (Registro Acadêmico)"
												type="text"
												placeholder="Ex: 241403-1"
												value={student.ra}
												onChange={(e) => handleUpdateStudentForm(index, 'ra', e.target.value)}
												disabled={isSubmitting}
												icon={<IdCard className="h-4 w-4 text-primary" />}
												iconPosition="left"
											/>
										</div>

										<Input
											label="Email (Opcional)"
											type="email"
											placeholder="Ex: aluno@email.com"
											value={student.email || ''}
											onChange={(e) => handleUpdateStudentForm(index, 'email', e.target.value)}
											disabled={isSubmitting}
											icon={<Mail className="h-4 w-4 text-primary" />}
											iconPosition="left"
										/>

										{/* Upload de Fotos */}
										<div className="space-y-2">
											<label className="text-sm font-medium text-foreground">
												Fotos do Aluno (Mínimo 3, Máximo 10)
											</label>
											<div className="flex items-center gap-2">
												<label className="flex-1">
													<input
														type="file"
														accept="image/*"
														multiple
														onChange={(e) => handleAddPhoto(index, e.target.files)}
														disabled={isSubmitting}
														className="hidden"
													/>
													<div className="flex items-center justify-center gap-2 p-3 rounded-lg border border-border/50 bg-card hover:bg-secondary/50 cursor-pointer transition-colors">
														<Upload className="h-4 w-4 text-primary" />
														<span className="text-sm text-muted-foreground">
															Adicionar Fotos
														</span>
													</div>
												</label>
											</div>
											
											{student.photos && student.photos.length > 0 && (
												<div className="grid grid-cols-5 gap-2 mt-2">
													{student.photos.map((photo, photoIndex) => (
														<div key={photoIndex} className="relative group">
															<img
																src={URL.createObjectURL(photo)}
																alt={`Foto ${photoIndex + 1}`}
																className="w-full h-20 object-cover rounded-lg border border-border/50"
															/>
															<button
																type="button"
																onClick={() => handleRemovePhoto(index, photoIndex)}
																disabled={isSubmitting}
																className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
															>
																<X className="h-3 w-3" />
															</button>
														</div>
													))}
												</div>
											)}
											<p className="text-xs text-muted-foreground">
												{student.photos?.length || 0} / 10 fotos adicionadas
												{((student.photos?.length || 0) < 3) && (
													<span className="text-destructive ml-2">
														(Mínimo de 3 fotos necessário)
													</span>
												)}
											</p>
										</div>
									</div>
								))}
							</div>

							<div className="flex items-center justify-between mb-6 pt-4 border-t border-border/50">
								<Button
									variant="outline"
									onClick={handleAddStudentForm}
									disabled={isSubmitting}
									className="flex items-center gap-2"
								>
									<Plus className="h-4 w-4" />
									Adicionar Aluno
								</Button>
								<p className="text-xs text-muted-foreground">
									{studentsFormData.length} {studentsFormData.length === 1 ? 'aluno' : 'alunos'}
								</p>
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
									type="button"
									onClick={handleCreateStudents}
									disabled={isSubmitting}
									className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
									loading={isSubmitting}
									loadingIcon={<Loader2 className="h-4 w-4 animate-spin" />}
								>
									{isSubmitting ? 'Criando...' : `Criar ${studentsFormData.length} ${studentsFormData.length === 1 ? 'Aluno' : 'Alunos'}`}
								</Button>
							</div>
						</div>
					</div>
				)}

				{/* Modal de Edição de Aluno */}
				{showEditModal && editingStudent && (
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
										Editar Aluno
									</h2>
								</div>
								<p className="text-sm text-muted-foreground">
									Atualize as informações do aluno
								</p>
							</div>

							{showValidationErrors && (() => {
								const result = studentSchema.safeParse(editForm.state.values);
								if (!result.success) {
									const errors = result.error.flatten().fieldErrors;
									const errorList: Array<{ field: string; message: string; label: string }> = [];
									const fieldLabels: Record<string, string> = {
										name: 'Nome',
										ra: 'RA',
										email: 'Email',
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
									const result = studentSchema.safeParse(editForm.state.values);
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
									<editForm.Field
										name="name"
										children={(field) => (
											<Input
												label="Nome do Aluno"
												type="text"
												placeholder="Ex: João Silva"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												error={field.state.meta.errors.length > 0}
												errorMessage={field.state.meta.errors[0]}
												disabled={isSubmitting}
												icon={<User className="h-4 w-4 text-primary" />}
												iconPosition="left"
											/>
										)}
									/>

									<editForm.Field
										name="ra"
										children={(field) => (
											<Input
												label="RA (Registro Acadêmico)"
												type="text"
												placeholder="Ex: 241403-1"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												error={field.state.meta.errors.length > 0}
												errorMessage={field.state.meta.errors[0]}
												disabled={isSubmitting}
												icon={<IdCard className="h-4 w-4 text-primary" />}
												iconPosition="left"
											/>
										)}
									/>

									<editForm.Field
										name="email"
										children={(field) => (
											<Input
												label="Email (Opcional)"
												type="email"
												placeholder="Ex: aluno@email.com"
												value={field.state.value || ''}
												onChange={(e) => field.handleChange(e.target.value)}
												onBlur={field.handleBlur}
												error={field.state.meta.errors.length > 0}
												errorMessage={field.state.meta.errors[0]}
												disabled={isSubmitting}
												icon={<Mail className="h-4 w-4 text-primary" />}
												iconPosition="left"
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
						setStudentToDelete(null);
					}}
					onConfirm={confirmDeleteStudent}
					title="Confirmar Exclusão"
					message={studentToDeleteData ? `Tem certeza que deseja deletar o aluno "${studentToDeleteData.attributes.name}"?` : 'Tem certeza que deseja deletar este aluno?'}
					confirmText="Deletar Aluno"
					isLoading={isDeleting}
				/>
			</AuthenticatedLayout>
		</ProtectedRoute>
	);
}

