"use client";

import { useRouter } from "next/navigation";
import { Users, BookOpen, GraduationCap, Trash2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
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

interface ClassRoomCardProps {
	classRoom: {
		id: string;
		type: string;
		attributes: ClassRoomAttributes;
	};
	index?: number;
	onDelete?: (classRoomId: string) => void;
	onEdit?: (classRoom: ClassRoomCardProps['classRoom']) => void;
}

export function ClassRoomCard({ classRoom, index = 0, onDelete, onEdit }: ClassRoomCardProps) {
	const router = useRouter();

	const handleCardClick = () => {
		router.push(`/turmas/${classRoom.attributes.course.id}/${classRoom.id}` as any);
	};

	const handleDelete = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (onDelete) {
			onDelete(classRoom.id);
		}
	};

	const handleEdit = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (onEdit) {
			onEdit(classRoom);
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
			aria-label={`Ver detalhes da turma ${classRoom.attributes.name}`}
		>
			<div className="absolute inset-0 bg-linear-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/3 group-hover:to-primary/5 transition-all duration-300 pointer-events-none" />
			
			<div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary via-primary/50 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

			{/* Header com gradiente */}
			<div className="relative w-full h-32 overflow-hidden bg-linear-to-br from-primary/20 via-primary/10 to-primary/5">
				<div className="absolute inset-0 bg-linear-to-t from-card/60 via-card/20 to-transparent" />
				<div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
				
				{/* Ícone da turma */}
				<div className="absolute top-6 left-6 p-4 rounded-xl bg-primary/20 backdrop-blur-sm group-hover:bg-primary/30 group-hover:scale-110 transition-all duration-300">
					<Users className="h-8 w-8 text-primary" />
				</div>
			</div>

			<div className="relative p-6 space-y-5 flex-1">
				<div className="flex items-start justify-between gap-2">
					<div className="space-y-2 flex-1 min-w-0">
						<h3 className="text-xl font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-300">
							{classRoom.attributes.name}
						</h3>
						<p className="text-sm text-muted-foreground">
							{classRoom.attributes.course.name}
						</p>
					</div>
					{(onDelete || onEdit) && (
						<div className="flex items-center gap-1 shrink-0">
							{onEdit && (
								<Button
									variant="ghost"
									size="sm"
									onClick={handleEdit}
									className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
									aria-label={`Editar turma ${classRoom.attributes.name}`}
								>
									<Edit className="h-4 w-4" />
								</Button>
							)}
							{onDelete && (
								<Button
									variant="ghost"
									size="sm"
									onClick={handleDelete}
									className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
									aria-label={`Deletar turma ${classRoom.attributes.name}`}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							)}
						</div>
					)}
				</div>

				<div className="h-px bg-border group-hover:bg-primary/30 transition-colors duration-300" />

				<div className="space-y-4">
					{/* Período */}
					<div className="flex items-start gap-3">
						<div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300 shrink-0">
							<BookOpen className="h-4 w-4 text-primary" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
								Período
							</p>
							<p className="text-sm font-semibold text-foreground">
								{classRoom.attributes.period}º período
							</p>
						</div>
					</div>

					{/* Curso */}
					<div className="flex items-start gap-3">
						<div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300 shrink-0">
							<GraduationCap className="h-4 w-4 text-primary" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
								Curso
							</p>
							<p className="text-sm font-semibold text-foreground line-clamp-2">
								{classRoom.attributes.course.name}
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								{classRoom.attributes.course.periods} {classRoom.attributes.course.periods === 1 ? 'período' : 'períodos'}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

