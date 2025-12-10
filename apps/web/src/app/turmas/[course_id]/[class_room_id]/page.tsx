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
	GraduationCap, 
	BookOpen, 
	ArrowLeft,
	User,
	Mail,
	IdCard,
	Edit,
	Trash2,
	AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
			data: {
				type: string;
				id: string;
			};
		};
		students?: {
			data: Array<{
				type: string;
				id: string;
			}>;
		};
	};
}

interface ClassRoomResponse {
	data: ClassRoom;
	included?: Array<Course | Student>;
	jsonapi: {
		version: string;
	};
}

export default function ClassRoomDetailPage() {
	const params = useParams();
	const router = useRouter();
	const courseId = params?.course_id as string;
	const classRoomId = params?.class_room_id as string;

	const [classRoom, setClassRoom] = useState<ClassRoom | null>(null);
	const [course, setCourse] = useState<Course | null>(null);
	const [students, setStudents] = useState<Student[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchClassRoom = async () => {
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
					`${baseUrl}/admin/courses/${courseId}/class_rooms/${classRoomId}?include=course,students`,
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
					throw new Error(`Erro ao buscar turma: ${response.status}`);
				}

				const data: ClassRoomResponse = await response.json();
				setClassRoom(data.data);

				// Separar curso e estudantes do included
				const fetchedCourse: Course[] = [];
				const fetchedStudents: Student[] = [];

				data.included?.forEach((item) => {
					if (item.type === 'course') {
						fetchedCourse.push(item as Course);
					} else if (item.type === 'students') {
						fetchedStudents.push(item as Student);
					}
				});

				if (fetchedCourse.length > 0) {
					setCourse(fetchedCourse[0]);
				}

				setStudents(fetchedStudents);
			} catch (error) {
				console.error('Erro ao buscar turma:', error);
				const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar turma';
				setError(errorMessage);
				toast.error(errorMessage);
			} finally {
				setLoading(false);
			}
		};

		if (courseId && classRoomId) {
			fetchClassRoom();
		}
	}, [courseId, classRoomId, router]);

	if (loading) {
		return (
			<ProtectedRoute>
				<AuthenticatedLayout className="p-0">
					<div className="flex items-center justify-center min-h-screen">
						<div className="flex flex-col items-center gap-4">
							<Loader2 className="h-10 w-10 animate-spin text-primary" />
							<p className="text-sm text-muted-foreground font-medium">
								Carregando turma...
							</p>
						</div>
					</div>
				</AuthenticatedLayout>
			</ProtectedRoute>
		);
	}

	if (error || !classRoom) {
		return (
			<ProtectedRoute>
				<AuthenticatedLayout className="p-0">
					<div className="container mx-auto max-w-7xl px-6 py-12">
						<div className="flex flex-col items-center justify-center min-h-[400px] text-center">
							<div className="p-6 rounded-full bg-destructive/10 mb-4">
								<AlertCircle className="h-12 w-12 text-destructive" />
							</div>
							<h3 className="text-xl font-semibold text-foreground mb-2">
								{error || 'Turma não encontrada'}
							</h3>
							<p className="text-sm text-muted-foreground max-w-md mb-6">
								{error || 'A turma que você está procurando não existe ou foi removida.'}
							</p>
							<Button
								variant="outline"
								onClick={() => router.push('/turmas')}
							>
								<ArrowLeft className="h-4 w-4 mr-2" />
								Voltar para Turmas
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
								onClick={() => router.push('/turmas')}
								className="w-fit text-white/90 hover:text-white hover:bg-white/10 mb-2"
							>
								<ArrowLeft className="h-4 w-4 mr-2" />
								Voltar
							</Button>
							
							<div className="flex flex-col items-start gap-6">
								<div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm animate-in fade-in zoom-in duration-500">
									<Users className="h-10 w-10 md:h-12 md:w-12 text-white" />
								</div>
								<div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
									<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
										{classRoom.attributes.name}
									</h1>
									<p className="text-base md:text-lg text-white/90">
										{course?.attributes.name || classRoom.attributes.course.name}
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
							{/* Informações da Turma */}
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
											<Users className="h-5 w-5 text-primary" />
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

									<div className="h-px bg-border" />

									<div className="flex items-start gap-4">
										<div className="p-3 rounded-lg bg-primary/10 shrink-0">
											<GraduationCap className="h-5 w-5 text-primary" />
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
												Curso
											</p>
											<p className="text-base font-semibold text-foreground">
												{course?.attributes.name || classRoom.attributes.course.name}
											</p>
											<p className="text-sm text-muted-foreground mt-1">
												{course?.attributes.periods || classRoom.attributes.course.periods} períodos
											</p>
										</div>
									</div>
								</div>
							</div>

							{/* Lista de Participantes */}
							<div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
								<div className="flex items-center justify-between mb-6">
									<div className="flex items-center gap-3">
										<div className="p-2 rounded-lg bg-primary/10">
											<User className="h-5 w-5 text-primary" />
										</div>
										<div>
											<h2 className="text-xl font-bold text-foreground">
												Participantes
											</h2>
											<p className="text-sm text-muted-foreground">
												{students.length} {students.length === 1 ? 'participante cadastrado' : 'participantes cadastrados'}
											</p>
										</div>
									</div>
									{students.length > 0 && (
										<Button
											variant="outline"
											size="sm"
											onClick={() => router.push(`/turmas/${courseId}/${classRoomId}/alunos` as any)}
											className="flex items-center gap-2"
										>
											<Users className="h-4 w-4" />
											Ver Todos os Alunos
										</Button>
									)}
								</div>

								{students.length === 0 ? (
									<div className="text-center py-12">
										<User className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
										<p className="text-sm text-muted-foreground">
											Nenhum participante cadastrado nesta turma
										</p>
									</div>
								) : (
									<div className="space-y-4">
										{students.map((student) => (
											<div
												key={student.id}
												onClick={() => router.push(`/alunos/${courseId}/${classRoomId}/${student.id}` as any)}
												className="group relative rounded-xl border border-border/50 bg-card hover:bg-secondary/50 hover:border-primary/30 hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer"
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
												{/* Barra lateral de destaque */}
												<div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/30 group-hover:bg-primary transition-colors duration-300" />
												
												<div className="p-5">
													<div className="flex items-start gap-4">
														{/* Ícone do Estudante */}
														<div className="relative shrink-0 p-4 rounded-xl bg-primary/20 group-hover:bg-primary/30 group-hover:scale-105 transition-all duration-300">
															<User className="h-6 w-6 text-primary" />
														</div>

														{/* Informações do Estudante */}
														<div className="flex-1 min-w-0">
															<h3 className="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
																{student.attributes.name}
															</h3>
															
															<div className="space-y-2">
																<div className="flex items-center gap-2 text-sm">
																	<IdCard className="h-4 w-4 text-muted-foreground" />
																	<span className="text-muted-foreground">RA:</span>
																	<span className="font-medium text-foreground">{student.attributes.ra}</span>
																</div>
																
																{student.attributes.email && (
																	<div className="flex items-center gap-2 text-sm">
																		<Mail className="h-4 w-4 text-muted-foreground" />
																		<span className="text-muted-foreground">Email:</span>
																		<span className="font-medium text-foreground">{student.attributes.email}</span>
																	</div>
																)}
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
								{/* Card de Estatísticas */}
								<div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
									<h3 className="text-lg font-semibold text-foreground mb-4">
										Estatísticas
									</h3>
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<span className="text-sm text-muted-foreground">Participantes</span>
											<span className="text-lg font-bold text-foreground">
												{students.length}
											</span>
										</div>
										<div className="h-px bg-border" />
										<div className="flex items-center justify-between">
											<span className="text-sm text-muted-foreground">Período</span>
											<span className="text-lg font-bold text-foreground">
												{classRoom.attributes.period}º
											</span>
										</div>
									</div>
								</div>

								{/* Card de Navegação */}
								<div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
									<h3 className="text-lg font-semibold text-foreground mb-4">
										Navegação
									</h3>
									<div className="space-y-2">
										<Button
											variant="outline"
											className="w-full justify-start"
											onClick={() => router.push('/turmas')}
										>
											<ArrowLeft className="h-4 w-4 mr-2" />
											Voltar para Turmas
										</Button>
										{course && (
											<Button
												variant="outline"
												className="w-full justify-start"
												onClick={() => router.push(`/cursos/${course.id}` as any)}
											>
												<GraduationCap className="h-4 w-4 mr-2" />
												Ver Curso
											</Button>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</AuthenticatedLayout>
		</ProtectedRoute>
	);
}

