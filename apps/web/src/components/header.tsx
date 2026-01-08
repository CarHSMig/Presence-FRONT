"use client";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./UserMenu";
import Logo from "@/assets/images/logo.png";
import DarkLogo from "@/assets/images/dark-logo.png";
import { useEffect, useState } from "react";

export default function Header() {
	const { theme, resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");
	const logoSrc = isDark ? DarkLogo : Logo;

	return (
		<div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
			<div className="container mx-auto flex h-24 items-center justify-between">
				<div className="flex items-center gap-3">
					<ModeToggle />
				</div>

				<Link href="/" className="absolute left-1/2 -translate-x-1/2">
					<Image 
						src={logoSrc} 
						alt="Presence System" 
						width={300} 
						height={300}
						className="w-auto cursor-pointer transition-opacity hover:opacity-80"
						priority
					/>
				</Link>

				<div className="flex items-center gap-3">
					<UserMenu />
				</div>
			</div>
			<hr className="mt-0" />
		</div>
	);
}
