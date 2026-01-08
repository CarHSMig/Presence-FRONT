"use client";

import { GraduationCap, Users, BookOpen, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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

interface CourseAttributes {
	id: string;
	name: string;
	periods: number;
}

interface CourseCardProps {
	course: {
		id: string;
		type: string;
		attributes: CourseAttributes;
		relationships?: {
			class_rooms?: {
				data: Array<{ type: string; id: string }>;
			};
		};
	};
	classRooms?: ClassRoom[];
	index?: number;
	onDelete?: (courseId: string) => void;
}

export function CourseCard({ course, classRooms = [], index = 0, onDelete }: CourseCardProps) {
	const router = useRouter();
	
	const courseClassRooms = classRooms.filter(
		(cr) => cr.attributes.course.id === course.id
	);

	const handleCardClick = () => {
		router.push(`/cursos/${course.id}` as any);
	};

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (onDelete) {
			onDelete(course.id);
		}
	};

	return (
		<div
			onClick={handleCardClick}
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
					handleCardClick();
				}
			}}
			aria-label={`Ver detalhes do curso ${course.attributes.name}`}
		>
			<div className="absolute inset-0 bg-linear-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/3 group-hover:to-primary/5 transition-all duration-300 pointer-events-none" />
			
			<div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary via-primary/50 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

			<div className="relative w-full h-32 overflow-hidden bg-linear-to-br from-primary/20 via-primary/10 to-primary/5">
				<div className="absolute inset-0 bg-linear-to-t from-card/60 via-card/20 to-transparent" />
				<div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
				
				<div className="absolute top-6 left-6 p-4 rounded-xl bg-primary/20 backdrop-blur-sm group-hover:bg-primary/30 group-hover:scale-110 transition-all duration-300">
					<GraduationCap className="h-8 w-8 text-primary" />
				</div>
			</div>

			<div className="relative p-6 space-y-5 flex-1">
				<div className="flex items-start justify-between gap-2">
					<div className="space-y-2 flex-1 min-w-0">
						<h3 className="text-xl font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-300">
							{course.attributes.name}
						</h3>
					</div>
					{onDelete && (
						<Button
							variant="ghost"
							size="icon"
							onClick={handleDelete}
							className="shrink-0 h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
							aria-label={`Deletar curso ${course.attributes.name}`}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					)}
				</div>

				<div className="h-px bg-border group-hover:bg-primary/30 transition-colors duration-300" />

				<div className="space-y-4">
					<div className="flex items-start gap-3">
						<div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300 shrink-0">
							<BookOpen className="h-4 w-4 text-primary" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
								Períodos
							</p>
							<p className="text-sm font-semibold text-foreground">
								{course.attributes.periods} {course.attributes.periods === 1 ? 'período' : 'períodos'}
							</p>
						</div>
					</div>

					<div className="flex items-start gap-3">
						<div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300 shrink-0">
							<Users className="h-4 w-4 text-primary" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
								Turmas
							</p>
							{courseClassRooms.length > 0 ? (
								<div className="space-y-1">
									<p className="text-sm font-semibold text-foreground">
										{courseClassRooms.length} {courseClassRooms.length === 1 ? 'turma cadastrada' : 'turmas cadastradas'}
									</p>
									<div className="flex flex-wrap gap-2 mt-2">
										{courseClassRooms.slice(0, 3).map((classRoom) => (
											<span
												key={classRoom.id}
												className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary/50 text-xs font-medium text-foreground border border-border/50"
											>
												{classRoom.attributes.name}
												<span className="text-muted-foreground">
													({classRoom.attributes.period}º período)
												</span>
											</span>
										))}
										{courseClassRooms.length > 3 && (
											<span className="inline-flex items-center px-2.5 py-1 rounded-md bg-muted/50 text-xs font-medium text-muted-foreground">
												+{courseClassRooms.length - 3} mais
											</span>
										)}
									</div>
								</div>
							) : (
								<p className="text-sm text-muted-foreground italic">
									Nenhuma turma cadastrada
								</p>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

