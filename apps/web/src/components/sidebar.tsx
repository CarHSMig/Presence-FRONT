"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	Home,
	Calendar,
	Users,
	GraduationCap,
	BookOpen,
	UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
	{
		name: "Home",
		href: "/",
		icon: Home,
	},
	{
		name: "Alunos",
		href: "/alunos",
		icon: Users,
	},
	{
		name: "Cursos",
		href: "/cursos",
		icon: GraduationCap,
	},
	{
		name: "Turmas",
		href: "/turmas",
		icon: BookOpen,
	},
	{
		name: "Usuários",
		href: "/usuarios",
		icon: UserCircle,
	},
];

export default function Sidebar() {
	const pathname = usePathname();

	return (
		<aside className="w-64 min-h-screen bg-card border-r border-border">
			<nav className="p-4 space-y-2">
				{navigationItems.map((item) => {
					const isActive = pathname === item.href;
					const Icon = item.icon;

					return (
						<Link
							key={item.name}
							href={item.href as any}
							className={cn(
								"flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group relative",
								isActive
									? "bg-primary text-primary-foreground shadow-sm"
									: "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
							)}
						>
							<Icon
								className={cn(
									"h-5 w-5 transition-transform group-hover:scale-110",
									isActive && "text-primary-foreground"
								)}
							/>
							<span className="flex-1">{item.name}</span>
							{isActive && (
								<div className="absolute right-2 w-2 h-2 rounded-full bg-primary-foreground/50" />
							)}
						</Link>
					);
				})}
			</nav>
		</aside>
	);
}

