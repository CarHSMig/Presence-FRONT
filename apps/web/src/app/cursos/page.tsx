"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthenticatedLayout from "@/components/authenticated-layout";
import { authUtils } from "@/utils/auth.utils";
import { applicationUtils } from "@/utils/application.utils";
import { toast } from "sonner";
import { Loader2, GraduationCap, Search, Plus } from "lucide-react";
import { CourseCard } from "@/components/CourseCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { LoadMoreButton } from "@/components/LoadMoreButton";

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

interface CoursesResponse {
	data: Course[];
	included?: ClassRoom[];
	jsonapi: {
		version: string;
	};
}

export default function CursosPage() {
	const router = useRouter();
	const [courses, setCourses] = useState<Course[]>([]);
	const [classRooms, setClassRooms] = useState<ClassRoom[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const perPage = 20;

	useEffect(() => {
		const fetchCourses = async () => {
			try {
				setLoading(true);
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

				const response = await fetch(`${baseUrl}/admin/courses?include=class_rooms&per_page=${perPage}&page=1`, {
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

				// Separar turmas do included
				const fetchedClassRooms: ClassRoom[] = [];
				data.included?.forEach((item) => {
					if (item.type === 'class_rooms') {
						fetchedClassRooms.push(item as ClassRoom);
					}
				});
				setClassRooms(fetchedClassRooms);

				// Verificar se há mais dados
				setHasMore(data.data.length === perPage);
			} catch (error) {
				console.error('Erro ao buscar cursos:', error);
				toast.error(
					error instanceof Error 
						? error.message 
						: 'Erro ao carregar cursos'
				);
			} finally {
				setLoading(false);
			}
		};

		fetchCourses();
	}, []);

	// Função para carregar mais cursos
	const handleLoadMore = async () => {
		if (loadingMore || !hasMore) return;

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
			const response = await fetch(`${baseUrl}/admin/courses?include=class_rooms&per_page=${perPage}&page=${nextPage}`, {
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
			setCourses(prev => [...prev, ...data.data]);

			// Separar turmas do included e adicionar às existentes
			const fetchedClassRooms: ClassRoom[] = [];
			data.included?.forEach((item) => {
				if (item.type === 'class_rooms') {
					fetchedClassRooms.push(item as ClassRoom);
				}
			});
			setClassRooms(prev => [...prev, ...fetchedClassRooms]);

			// Verificar se há mais dados
			setHasMore(data.data.length === perPage);
			setCurrentPage(nextPage);
		} catch (error) {
			console.error('Erro ao carregar mais cursos:', error);
			toast.error(
				error instanceof Error 
					? error.message 
					: 'Erro ao carregar mais cursos'
			);
		} finally {
			setLoadingMore(false);
		}
	};

	// Filtrar cursos por termo de busca
	const filteredCourses = courses.filter((course) =>
		course.attributes.name.toLowerCase().includes(searchTerm.toLowerCase())
	);

	// Função para abrir modal de deletar curso
	const handleDeleteCourse = (courseId: string) => {
		setCourseToDelete(courseId);
		setShowDeleteModal(true);
	};

	// Função para confirmar deletar curso
	const confirmDeleteCourse = async () => {
		if (!courseToDelete) return;

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

			const response = await fetch(`${baseUrl}/admin/courses/${courseToDelete}`, {
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
			
			// Remover curso da lista
			setCourses(prev => prev.filter(c => c.id !== courseToDelete));
			setShowDeleteModal(false);
			setCourseToDelete(null);
		} catch (error) {
			console.error('Erro ao deletar curso:', error);
			toast.error(
				error instanceof Error 
					? error.message 
					: 'Erro ao deletar curso. Tente novamente.'
			);
		} finally {
			setIsDeleting(false);
		}
	};

	const courseToDeleteData = courses.find(c => c.id === courseToDelete);

	return (
		<ProtectedRoute>
			<AuthenticatedLayout className="p-0">
				{/* Header com gradiente */}
				<section className="relative w-full overflow-hidden bg-linear-to-r from-[#0288D1] via-[#00ACC1] to-[#4DB6AC] shadow-xl">
					<div className="absolute inset-0 bg-linear-to-r from-black/5 to-transparent pointer-events-none" />
					
					<div className="container mx-auto px-6 relative z-10">
						<div className="flex flex-col items-center justify-center gap-6 min-h-[200px] md:min-h-[240px] py-8 md:py-12 text-center">
							<div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm animate-in fade-in zoom-in duration-500">
								<GraduationCap className="h-10 w-10 md:h-12 md:w-12 text-white" />
							</div>
							<div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
								<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
									Cursos
								</h1>
								<p className="text-base md:text-lg text-white/90 max-w-2xl">
									Visualize todos os cursos cadastrados e suas turmas
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* Conteúdo Principal */}
				<div className="container mx-auto max-w-7xl px-6 py-8 md:py-12">
					{/* Barra de Busca e Botão de Criar */}
					<div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500 delay-300">
						<Input
							type="text"
							placeholder="Buscar cursos por nome..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							icon={<Search className="h-4 w-4 text-primary" />}
							iconPosition="left"
							className="max-w-md w-full"
						/>
						<Button 
							onClick={() => router.push('/cursos/criar' as any)}
							className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
						>
							<Plus className="h-4 w-4 mr-2" />
							Criar Curso
						</Button>
					</div>

					{/* Loading State */}
					{loading ? (
						<div className="flex items-center justify-center min-h-[400px]">
							<div className="flex flex-col items-center gap-4">
								<Loader2 className="h-10 w-10 animate-spin text-primary" />
								<p className="text-sm text-muted-foreground font-medium">
									Carregando cursos...
								</p>
							</div>
						</div>
					) : filteredCourses.length === 0 ? (
						<div className="flex flex-col items-center justify-center min-h-[400px] text-center">
							<div className="p-6 rounded-full bg-muted/50 mb-4">
								<GraduationCap className="h-12 w-12 text-muted-foreground" />
							</div>
							<h3 className="text-xl font-semibold text-foreground mb-2">
								{searchTerm ? 'Nenhum curso encontrado' : 'Nenhum curso cadastrado'}
							</h3>
							<p className="text-sm text-muted-foreground max-w-md">
								{searchTerm
									? `Não encontramos cursos com o termo "${searchTerm}". Tente buscar com outro termo.`
									: 'Ainda não há cursos cadastrados no sistema.'}
							</p>
						</div>
					) : (
						<>
							{/* Estatísticas */}
							<div className="mb-6 flex items-center gap-4 text-sm text-muted-foreground animate-in fade-in slide-in-from-top-4 duration-500 delay-400">
								<span>
									{filteredCourses.length} {filteredCourses.length === 1 ? 'curso encontrado' : 'cursos encontrados'}
								</span>
								{searchTerm && (
									<span className="text-primary">
										Filtrando por: "{searchTerm}"
									</span>
								)}
							</div>

							{/* Grid de Cursos */}
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{filteredCourses.map((course, index) => (
									<CourseCard
										key={course.id}
										course={course}
										classRooms={classRooms}
										index={index}
										onDelete={handleDeleteCourse}
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

				{/* Modal de Confirmação de Exclusão */}
				<ConfirmDeleteModal
					isOpen={showDeleteModal}
					onClose={() => {
						setShowDeleteModal(false);
						setCourseToDelete(null);
					}}
					onConfirm={confirmDeleteCourse}
					title="Confirmar Exclusão"
					message={courseToDeleteData ? `Tem certeza que deseja deletar o curso "${courseToDeleteData.attributes.name}"?` : 'Tem certeza que deseja deletar este curso?'}
					confirmText="Deletar Curso"
					isLoading={isDeleting}
				/>
			</AuthenticatedLayout>
		</ProtectedRoute>
	);
}
