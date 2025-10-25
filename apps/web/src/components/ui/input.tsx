import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

interface InputProps extends React.ComponentProps<"input"> {
	icon?: React.ReactNode;
	iconPosition?: "left" | "right";
	iconClickable?: boolean;
	onIconClick?: () => void;
	error?: boolean;
	errorMessage?: string;
	label?: string;
	helperText?: string;
	// Props específicas para variante secret
	variant?: "default" | "secret";
	showToggle?: boolean; // Se deve mostrar o botão de mostrar/ocultar
	alwaysHidden?: boolean; // Se deve sempre ficar oculto (sem toggle)
}

function Input({ 
	className, 
	type, 
	icon, 
	iconPosition = "right",
	iconClickable = false,
	onIconClick,
	error = false,
	errorMessage,
	label,
	helperText,
	variant = "default",
	showToggle = true,
	alwaysHidden = false,
	...props 
}: InputProps) {
	const inputRef = React.useRef<HTMLInputElement>(null);
	const [isVisible, setIsVisible] = React.useState(false);

	const handleIconClick = () => {
		if (iconClickable && onIconClick) {
			onIconClick();
		}
	};

	// Lógica para variante secret
	const isSecretVariant = variant === "secret";
	const shouldShowToggle = isSecretVariant && showToggle && !alwaysHidden;
	const inputType = isSecretVariant 
		? (alwaysHidden ? "password" : (isVisible ? "text" : "password"))
		: type;

	const handleToggleVisibility = () => {
		if (shouldShowToggle) {
			setIsVisible(!isVisible);
		}
	};

	const inputElement = (
		<input
			ref={inputRef}
			type={inputType}
			data-slot="input"
			className={cn(
				"file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
				"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
				error && "border-destructive ring-destructive/20",
				// Padding para ícones
				icon && iconPosition === "left" && "pl-10",
				icon && iconPosition === "right" && "pr-10",
				isSecretVariant && icon && iconPosition === "left" && "pl-10",
				isSecretVariant && shouldShowToggle && "pr-20", // Espaço para ícone + toggle
				isSecretVariant && !shouldShowToggle && icon && iconPosition === "right" && "pr-10",
				className,
			)}
			{...props}
		/>
	);

	// Ícone principal (esquerda ou direita)
	const mainIconElement = icon && (
		<div 
			className={cn(
				"absolute inset-y-0 flex items-center",
				iconPosition === "left" ? "left-0 pl-3" : "right-0 pr-3",
				iconClickable && "cursor-pointer hover:opacity-70"
			)}
			onClick={handleIconClick}
		>
			{icon}
		</div>
	);

	// Ícone de toggle de visibilidade (apenas para variante secret)
	const toggleIconElement = shouldShowToggle && (
		<div 
			className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer hover:opacity-70"
			onClick={handleToggleVisibility}
		>
			{isVisible ? (
				<EyeOff className="h-4 w-4 text-muted-foreground" />
			) : (
				<Eye className="h-4 w-4 text-muted-foreground" />
			)}
		</div>
	);

	if (label || helperText || errorMessage) {
		return (
			<div className="space-y-2">
				{label && (
					<label className="text-sm font-medium text-foreground">
						{label}
					</label>
				)}
				<div className="relative">
					{inputElement}
					{mainIconElement}
					{toggleIconElement}
				</div>
				{error && errorMessage && (
					<p className="text-sm text-destructive">
						{errorMessage}
					</p>
				)}
				{helperText && !error && (
					<p className="text-sm text-muted-foreground">
						{helperText}
					</p>
				)}
			</div>
		);
	}

	return (
		<div className="relative">
			{inputElement}
			{mainIconElement}
			{toggleIconElement}
		</div>
	);
}

export { Input };
