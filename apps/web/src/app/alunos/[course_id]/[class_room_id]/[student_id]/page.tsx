"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthenticatedLayout from "@/components/authenticated-layout";
import { authUtils } from "@/utils/auth.utils";
import { applicationUtils } from "@/utils/application.utils";
import { toast } from "sonner";
import { 
	Loader2, 
	User,
	ArrowLeft,
	Mail,
	IdCard,
	AlertCircle,
	GraduationCap,
	BookOpen,
	Users,
	Image as ImageIcon,
	X,
	ChevronLeft,
	ChevronRight,
	Trash2,
	Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
	relationships?: {
		course?: {
			meta: {
				included: boolean;
			};
		};
		students?: {
			meta: {
				included: boolean;
			};
		};
		events?: {
			meta: {
				included: boolean;
			};
		};
	};
}

interface EmbeddingImage {
	id: string;
	image_url: string;
}

interface StudentAttributes {
	name: string;
	ra: string;
	class_room_id: string;
	email: string | null;
	embedding_images?: EmbeddingImage[];
}

interface Student {
	id: string;
	type: string;
	attributes: StudentAttributes;
	relationships?: {
		class_room?: {
			data: {
				type: string;
				id: string;
			};
		};
		participants?: {
			meta: {
				included: boolean;
			};
		};
	};
}

interface StudentResponse {
	data: Student;
	included?: Array<ClassRoom | Course>;
	jsonapi: {
		version: string;
	};
}

export default function StudentDetailPage() {
	const params = useParams();
	const router = useRouter();
	const courseId = params?.course_id as string;
	const classRoomId = params?.class_room_id as string;
	const studentId = params?.student_id as string;

	const [student, setStudent] = useState<Student | null>(null);
	const [classRoom, setClassRoom] = useState<ClassRoom | null>(null);
	const [course, setCourse] = useState<Course | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
	const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [embeddingToDelete, setEmbeddingToDelete] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const fetchStudent = async () => {
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

				const response = await fetch(
					`${baseUrl}/admin/courses/${courseId}/class_rooms/${classRoomId}/students/${studentId}?include=class_room,course`,
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
						throw new Error('Aluno não encontrado');
					}
					throw new Error(`Erro ao buscar aluno: ${response.status}`);
				}

				const data: StudentResponse = await response.json();
				setStudent(data.data);

				// Separar turma e curso do included
				const fetchedClassRoom: ClassRoom[] = [];
				const fetchedCourse: Course[] = [];

				data.included?.forEach((item) => {
					if (item.type === 'class_rooms') {
						fetchedClassRoom.push(item as ClassRoom);
						// O curso pode estar dentro dos atributos da turma
						if ((item as ClassRoom).attributes.course) {
							const courseFromClassRoom = (item as ClassRoom).attributes.course;
							fetchedCourse.push({
								id: courseFromClassRoom.id,
								type: 'course',
								attributes: {
									id: courseFromClassRoom.id,
									name: courseFromClassRoom.name,
									periods: courseFromClassRoom.periods,
								},
							});
						}
					} else if (item.type === 'course') {
						fetchedCourse.push(item as Course);
					}
				});

				if (fetchedClassRoom.length > 0) {
					setClassRoom(fetchedClassRoom[0]);
				}

				if (fetchedCourse.length > 0) {
					setCourse(fetchedCourse[0]);
				} else if (fetchedClassRoom.length > 0 && fetchedClassRoom[0].attributes.course) {
					// Se não encontrou curso no included, mas tem na turma, usar da turma
					const courseFromClassRoom = fetchedClassRoom[0].attributes.course;
					setCourse({
						id: courseFromClassRoom.id,
						type: 'course',
						attributes: {
							id: courseFromClassRoom.id,
							name: courseFromClassRoom.name,
							periods: courseFromClassRoom.periods,
						},
					});
				}
			} catch (error) {
				console.error('Erro ao buscar aluno:', error);
				const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar aluno';
				setError(errorMessage);
				toast.error(errorMessage);
			} finally {
				setLoading(false);
			}
		};

		if (courseId && classRoomId && studentId) {
			fetchStudent();
		}
	}, [courseId, classRoomId, studentId, router]);

	// Fechar modal com ESC e navegação com setas
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (selectedImageIndex !== null && student?.attributes.embedding_images) {
				if (e.key === 'Escape') {
					setSelectedImageIndex(null);
				} else if (e.key === 'ArrowLeft') {
					const prevIndex = selectedImageIndex > 0 
						? selectedImageIndex - 1 
						: student.attributes.embedding_images.length - 1;
					setSelectedImageIndex(prevIndex);
				} else if (e.key === 'ArrowRight') {
					const nextIndex = selectedImageIndex < student.attributes.embedding_images.length - 1
						? selectedImageIndex + 1
						: 0;
					setSelectedImageIndex(nextIndex);
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [selectedImageIndex, student]);

	const handleImageClick = (index: number) => {
		setSelectedImageIndex(index);
	};

	const handleCloseModal = () => {
		setSelectedImageIndex(null);
	};

	const handlePreviousImage = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (selectedImageIndex !== null && student?.attributes.embedding_images) {
			const prevIndex = selectedImageIndex > 0 
				? selectedImageIndex - 1 
				: student.attributes.embedding_images.length - 1;
			setSelectedImageIndex(prevIndex);
		}
	};

	const handleNextImage = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (selectedImageIndex !== null && student?.attributes.embedding_images) {
			const nextIndex = selectedImageIndex < student.attributes.embedding_images.length - 1
				? selectedImageIndex + 1
				: 0;
			setSelectedImageIndex(nextIndex);
		}
	};

	const handleDeleteEmbedding = (embeddingId: string, e: React.MouseEvent) => {
		e.stopPropagation(); // Prevenir que abra o modal ao clicar no botão de deletar
		setEmbeddingToDelete(embeddingId);
		setShowDeleteModal(true);
	};

	const confirmDeleteEmbedding = async () => {
		if (!embeddingToDelete) return;

		try {
			setIsDeleting(true);
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
				`${baseUrl}/admin/courses/${courseId}/class_rooms/${classRoomId}/students/${studentId}/delete_embedding`,
				{
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
					},
					body: JSON.stringify({
						embedding_id: embeddingToDelete,
					}),
				}
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || `Erro ao deletar foto: ${response.status}`);
			}

			toast.success('Foto deletada com sucesso!');

			// Remover a foto do estado local
			if (student && student.attributes.embedding_images) {
				const deletedIndex = student.attributes.embedding_images.findIndex(
					(img) => img.id === embeddingToDelete
				);
				const updatedImages = student.attributes.embedding_images.filter(
					(img) => img.id !== embeddingToDelete
				);
				
				setStudent({
					...student,
					attributes: {
						...student.attributes,
						embedding_images: updatedImages,
					},
				});

				// Ajustar o índice do modal se necessário
				if (selectedImageIndex !== null) {
					if (updatedImages.length === 0) {
						// Se não há mais imagens, fechar o modal
						setSelectedImageIndex(null);
					} else if (deletedIndex === selectedImageIndex) {
						// Se a imagem deletada era a que estava sendo visualizada
						// Ajustar o índice para não ultrapassar o limite
						const newIndex = selectedImageIndex >= updatedImages.length 
							? updatedImages.length - 1 
							: selectedImageIndex;
						setSelectedImageIndex(newIndex);
					} else if (deletedIndex < selectedImageIndex) {
						// Se a imagem deletada estava antes da atual, ajustar o índice
						setSelectedImageIndex(selectedImageIndex - 1);
					}
				}
			}

			setShowDeleteModal(false);
			setEmbeddingToDelete(null);
		} catch (error) {
			console.error('Erro ao deletar foto:', error);
			const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar foto';
			toast.error(errorMessage);
		} finally {
			setIsDeleting(false);
		}
	};

	const handleAddPhotosClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) {
			return;
		}

		await handleUploadPhotos(Array.from(files));
		
		// Limpar o input para permitir selecionar os mesmos arquivos novamente
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const handleUploadPhotos = async (files: File[]) => {
		if (files.length === 0) {
			return;
		}

		try {
			setIsUploadingPhotos(true);

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

			const formData = new FormData();

			files.forEach((file, index) => {
				formData.append('files[]', file, `photo_${index}.${file.name.split('.').pop()}`);
			});

			const response = await fetch(
				`${baseUrl}/admin/courses/${courseId}/class_rooms/${classRoomId}/students/${studentId}/add_embedding`,
				{
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${token}`,
					},
					body: formData,
				}
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(
					errorData.message || 
					errorData.error ||
					`Erro ao adicionar fotos: ${response.status} ${response.statusText}`
				);
			}

			const responseData = await response.json();
			
			// Atualizar o estado com as novas fotos
			if (student && responseData.data?.attributes?.embedding_images) {
				setStudent({
					...student,
					attributes: {
						...student.attributes,
						embedding_images: responseData.data.attributes.embedding_images,
					},
				});
			} else {
				// Se a resposta não trouxer os dados atualizados, recarregar o estudante
				const token = authUtils.getToken();
				if (token) {
					const baseUrl = applicationUtils.getBaseUrl();
					if (baseUrl) {
						const refreshResponse = await fetch(
							`${baseUrl}/admin/courses/${courseId}/class_rooms/${classRoomId}/students/${studentId}?include=class_room,course`,
							{
								method: 'GET',
								headers: {
									'Content-Type': 'application/json',
									'Authorization': `Bearer ${token}`,
								},
							}
						);

						if (refreshResponse.ok) {
							const refreshData: StudentResponse = await refreshResponse.json();
							setStudent(refreshData.data);

							// Atualizar turma e curso se necessário
							const fetchedClassRoom: ClassRoom[] = [];
							const fetchedCourse: Course[] = [];

							refreshData.included?.forEach((item) => {
								if (item.type === 'class_rooms') {
									fetchedClassRoom.push(item as ClassRoom);
									if ((item as ClassRoom).attributes.course) {
										const courseFromClassRoom = (item as ClassRoom).attributes.course;
										fetchedCourse.push({
											id: courseFromClassRoom.id,
											type: 'course',
											attributes: {
												id: courseFromClassRoom.id,
												name: courseFromClassRoom.name,
												periods: courseFromClassRoom.periods,
											},
										});
									}
								} else if (item.type === 'course') {
									fetchedCourse.push(item as Course);
								}
							});

							if (fetchedClassRoom.length > 0) {
								setClassRoom(fetchedClassRoom[0]);
							}

							if (fetchedCourse.length > 0) {
								setCourse(fetchedCourse[0]);
							} else if (fetchedClassRoom.length > 0 && fetchedClassRoom[0].attributes.course) {
								const courseFromClassRoom = fetchedClassRoom[0].attributes.course;
								setCourse({
									id: courseFromClassRoom.id,
									type: 'course',
									attributes: {
										id: courseFromClassRoom.id,
										name: courseFromClassRoom.name,
										periods: courseFromClassRoom.periods,
									},
								});
							}
						}
					}
				}
			}

			toast.success(`${files.length} ${files.length === 1 ? 'foto adicionada' : 'fotos adicionadas'} com sucesso!`);
		} catch (error) {
			console.error('Erro ao adicionar fotos:', error);
			const errorMessage = error instanceof Error ? error.message : 'Erro ao adicionar fotos';
			toast.error(errorMessage);
		} finally {
			setIsUploadingPhotos(false);
		}
	};

	if (loading) {
		return (
			<ProtectedRoute>
				<AuthenticatedLayout className="p-0">
					<div className="flex items-center justify-center min-h-screen">
						<div className="flex flex-col items-center gap-4">
							<Loader2 className="h-10 w-10 animate-spin text-primary" />
							<p className="text-sm text-muted-foreground font-medium">
								Carregando aluno...
							</p>
						</div>
					</div>
				</AuthenticatedLayout>
			</ProtectedRoute>
		);
	}

	if (error || !student) {
		return (
			<ProtectedRoute>
				<AuthenticatedLayout className="p-0">
					<div className="container mx-auto max-w-7xl px-6 py-12">
						<div className="flex flex-col items-center justify-center min-h-[400px] text-center">
							<div className="p-6 rounded-full bg-destructive/10 mb-4">
								<AlertCircle className="h-12 w-12 text-destructive" />
							</div>
							<h3 className="text-xl font-semibold text-foreground mb-2">
								{error || 'Aluno não encontrado'}
							</h3>
							<p className="text-sm text-muted-foreground max-w-md mb-6">
								{error || 'O aluno que você está procurando não existe ou foi removido.'}
							</p>
							<Button
								variant="outline"
								onClick={() => router.push('/alunos')}
							>
								<ArrowLeft className="h-4 w-4 mr-2" />
								Voltar para Alunos
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
								onClick={() => router.push(`/alunos?course_id=${courseId}` as any)}
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
										{student.attributes.name}
									</h1>
									<p className="text-base md:text-lg text-white/90">
										{classRoom?.attributes.name || 'Turma não encontrada'}
									</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Conteúdo Principal */}
				<div className="container mx-auto max-w-7xl px-6 py-8 md:py-12">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						{/* Conteúdo Principal */}
						<div className="lg:col-span-2 space-y-8">
							{/* Informações do Aluno */}
							<div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
								<div className="flex items-center gap-3 mb-6">
									<div className="p-2 rounded-lg bg-primary/10">
										<User className="h-5 w-5 text-primary" />
									</div>
									<h2 className="text-xl font-bold text-foreground">
										Informações do Aluno
									</h2>
								</div>

								<div className="space-y-6">
									<div className="flex items-start gap-4">
										<div className="p-3 rounded-lg bg-primary/10 shrink-0">
											<User className="h-5 w-5 text-primary" />
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
												Nome Completo
											</p>
											<p className="text-base font-semibold text-foreground">
												{student.attributes.name}
											</p>
										</div>
									</div>

									<div className="h-px bg-border" />

									<div className="flex items-start gap-4">
										<div className="p-3 rounded-lg bg-primary/10 shrink-0">
											<IdCard className="h-5 w-5 text-primary" />
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
												RA (Registro Acadêmico)
											</p>
											<p className="text-base font-semibold text-foreground">
												{student.attributes.ra}
											</p>
										</div>
									</div>

									{student.attributes.email && (
										<>
											<div className="h-px bg-border" />
											<div className="flex items-start gap-4">
												<div className="p-3 rounded-lg bg-primary/10 shrink-0">
													<Mail className="h-5 w-5 text-primary" />
												</div>
												<div className="flex-1 min-w-0">
													<p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
														Email
													</p>
													<p className="text-base font-semibold text-foreground break-all">
														{student.attributes.email}
													</p>
												</div>
											</div>
										</>
									)}
								</div>
							</div>

							{/* Galeria de Imagens */}
							<div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
								<div className="flex items-center gap-3 mb-6">
									<div className="p-2 rounded-lg bg-primary/10">
										<ImageIcon className="h-5 w-5 text-primary" />
									</div>
									<h2 className="text-xl font-bold text-foreground">
										Fotos do Aluno
									</h2>
									{student.attributes.embedding_images && student.attributes.embedding_images.length > 0 && (
										<span className="text-sm text-muted-foreground">
											{student.attributes.embedding_images.length} {student.attributes.embedding_images.length === 1 ? 'foto' : 'fotos'}
										</span>
									)}
									<div className="ml-auto flex items-center gap-2">
										<input
											ref={fileInputRef}
											type="file"
											accept="image/*"
											multiple
											onChange={handleFileChange}
											className="hidden"
										/>
										<Button
											variant="outline"
											size="sm"
											onClick={handleAddPhotosClick}
											disabled={isUploadingPhotos}
											className="gap-2"
										>
											{isUploadingPhotos ? (
												<>
													<Loader2 className="h-4 w-4 animate-spin" />
													Enviando...
												</>
											) : (
												<>
													<Upload className="h-4 w-4" />
													Adicionar Fotos
												</>
											)}
										</Button>
									</div>
								</div>

								{student.attributes.embedding_images && student.attributes.embedding_images.length > 0 ? (
									<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
										{student.attributes.embedding_images.map((embedding, index) => (
											<div
												key={embedding.id}
												className="group relative aspect-square rounded-lg overflow-hidden border border-border/50 bg-muted/50 hover:border-primary/50 transition-all duration-200"
											>
												<div
													onClick={() => handleImageClick(index)}
													className="w-full h-full cursor-pointer"
												>
													<img
														src={embedding.image_url}
														alt={`Foto ${index + 1} do aluno ${student.attributes.name}`}
														className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
														onError={(e) => {
															const target = e.target as HTMLImageElement;
															target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EErro ao carregar%3C/text%3E%3C/svg%3E';
														}}
													/>
													<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
												</div>
												{/* Botão de Deletar */}
												<Button
													variant="ghost"
													size="icon"
													className="absolute top-2 right-2 z-10 h-8 w-8 bg-destructive/90 hover:bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
													onClick={(e) => handleDeleteEmbedding(embedding.id, e)}
													title="Deletar foto"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										))}
									</div>
								) : (
									<div className="flex flex-col items-center justify-center py-12 text-center">
										<div className="p-4 rounded-full bg-muted mb-4">
											<ImageIcon className="h-8 w-8 text-muted-foreground" />
										</div>
										<p className="text-sm text-muted-foreground mb-4">
											Nenhuma foto adicionada ainda
										</p>
										<Button
											variant="outline"
											size="sm"
											onClick={handleAddPhotosClick}
											disabled={isUploadingPhotos}
											className="gap-2"
										>
											{isUploadingPhotos ? (
												<>
													<Loader2 className="h-4 w-4 animate-spin" />
													Enviando...
												</>
											) : (
												<>
													<Upload className="h-4 w-4" />
													Adicionar Primeira Foto
												</>
											)}
										</Button>
									</div>
								)}
							</div>

							{/* Informações da Turma */}
							{classRoom && (
								<div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
									<div className="flex items-center gap-3 mb-6">
										<div className="p-2 rounded-lg bg-primary/10">
											<BookOpen className="h-5 w-5 text-primary" />
										</div>
										<h2 className="text-xl font-bold text-foreground">
											Informações da Turma
										</h2>
									</div>

									<div className="space-y-6">
										<div className="flex items-start gap-4">
											<div className="p-3 rounded-lg bg-primary/10 shrink-0">
												<BookOpen className="h-5 w-5 text-primary" />
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
													Nome da Turma
												</p>
												<p className="text-base font-semibold text-foreground">
													{classRoom.attributes.name}
												</p>
											</div>
										</div>

										<div className="h-px bg-border" />

										<div className="flex items-start gap-4">
											<div className="p-3 rounded-lg bg-primary/10 shrink-0">
												<BookOpen className="h-5 w-5 text-primary" />
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
													Período
												</p>
												<p className="text-base font-semibold text-foreground">
													{classRoom.attributes.period}º período
												</p>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>

						{/* Sidebar */}
						<div className="lg:col-span-1">
							<div className="sticky top-8 space-y-6">
								{/* Card de Navegação */}
								<div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
									<h3 className="text-lg font-semibold text-foreground mb-4">
										Navegação
									</h3>
									<div className="space-y-2">
										<Button
											variant="outline"
											className="w-full justify-start"
											onClick={() => router.push(`/alunos?course_id=${courseId}` as any)}
										>
											<ArrowLeft className="h-4 w-4 mr-2" />
											Voltar para Alunos
										</Button>
										{classRoom && (
											<Button
												variant="outline"
												className="w-full justify-start"
												onClick={() => router.push(`/turmas/${courseId}/${classRoomId}` as any)}
											>
												<BookOpen className="h-4 w-4 mr-2" />
												Ver Turma
											</Button>
										)}
										{course && (
											<Button
												variant="outline"
												className="w-full justify-start"
												onClick={() => router.push(`/cursos/${courseId}` as any)}
											>
												<GraduationCap className="h-4 w-4 mr-2" />
												Ver Curso
											</Button>
										)}
									</div>
								</div>

								{/* Card de Informações Rápidas */}
								<div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
									<h3 className="text-lg font-semibold text-foreground mb-4">
										Informações Rápidas
									</h3>
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<span className="text-sm text-muted-foreground">RA</span>
											<span className="text-sm font-bold text-foreground">
												{student.attributes.ra}
											</span>
										</div>
										{classRoom && (
											<>
												<div className="h-px bg-border" />
												<div className="flex items-center justify-between">
													<span className="text-sm text-muted-foreground">Turma</span>
													<span className="text-sm font-bold text-foreground">
														{classRoom.attributes.name}
													</span>
												</div>
											</>
										)}
										{course && (
											<>
												<div className="h-px bg-border" />
												<div className="flex items-center justify-between">
													<span className="text-sm text-muted-foreground">Curso</span>
													<span className="text-sm font-bold text-foreground line-clamp-1">
														{course.attributes.name}
													</span>
												</div>
											</>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Modal de Visualização de Imagem */}
				{selectedImageIndex !== null && student?.attributes.embedding_images && (
					<div
						className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
						onClick={handleCloseModal}
					>
						{/* Botão Fechar */}
						<Button
							variant="ghost"
							size="icon"
							className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 h-10 w-10"
							onClick={handleCloseModal}
						>
							<X className="h-6 w-6" />
						</Button>

						{/* Botão Deletar */}
						<Button
							variant="ghost"
							size="icon"
							className="absolute top-4 right-20 z-10 text-white hover:bg-destructive/20 hover:text-destructive h-10 w-10"
							onClick={(e) => {
								e.stopPropagation();
								if (selectedImageIndex !== null && student.attributes.embedding_images) {
									handleDeleteEmbedding(student.attributes.embedding_images[selectedImageIndex].id, e);
								}
							}}
							title="Deletar foto"
						>
							<Trash2 className="h-6 w-6" />
						</Button>

						{/* Botão Anterior */}
						{student.attributes.embedding_images.length > 1 && (
							<Button
								variant="ghost"
								size="icon"
								className="absolute left-4 z-10 text-white hover:bg-white/20 h-12 w-12"
								onClick={handlePreviousImage}
							>
								<ChevronLeft className="h-8 w-8" />
							</Button>
						)}

						{/* Botão Próximo */}
						{student.attributes.embedding_images.length > 1 && (
							<Button
								variant="ghost"
								size="icon"
								className="absolute right-4 z-10 text-white hover:bg-white/20 h-12 w-12"
								onClick={handleNextImage}
							>
								<ChevronRight className="h-8 w-8" />
							</Button>
						)}

						{/* Imagem Expandida */}
						<div
							className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
							onClick={(e) => e.stopPropagation()}
						>
							<img
								src={student.attributes.embedding_images[selectedImageIndex].image_url}
								alt={`Foto ${selectedImageIndex + 1} do aluno ${student.attributes.name}`}
								className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
								onError={(e) => {
									const target = e.target as HTMLImageElement;
									target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EErro ao carregar%3C/text%3E%3C/svg%3E';
								}}
							/>

							{/* Contador de Imagens */}
							{student.attributes.embedding_images.length > 1 && (
								<div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm text-white text-sm font-medium">
									{selectedImageIndex + 1} / {student.attributes.embedding_images.length}
								</div>
							)}
						</div>
					</div>
				)}

				{/* Modal de Confirmação de Exclusão de Foto */}
				<ConfirmDeleteModal
					isOpen={showDeleteModal}
					onClose={() => {
						setShowDeleteModal(false);
						setEmbeddingToDelete(null);
					}}
					onConfirm={confirmDeleteEmbedding}
					title="Confirmar Exclusão"
					message="Tem certeza que deseja deletar esta foto?"
					confirmText="Deletar Foto"
					isLoading={isDeleting}
				/>
			</AuthenticatedLayout>
		</ProtectedRoute>
	);
}

