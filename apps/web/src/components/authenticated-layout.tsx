"use client";

import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import { cn } from "@/lib/utils";

interface AuthenticatedLayoutProps {
	children: React.ReactNode;
	className?: string;
}

export default function AuthenticatedLayout({
	children,
	className,
}: AuthenticatedLayoutProps) {
	return (
		<div className="flex flex-col h-screen overflow-hidden">
			<Header />
			<div className="flex flex-1 overflow-hidden">
				<Sidebar />
				<main
					className={cn(
						"flex-1 overflow-y-auto bg-background transition-colors",
						className
					)}
				>
					{children}
				</main>
			</div>
		</div>
	);
}

