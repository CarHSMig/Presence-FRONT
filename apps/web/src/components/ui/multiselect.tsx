"use client";

import * as React from "react";
import { ChevronDown, X } from "lucide-react";
import { Checkbox } from "./checkbox";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface MultiselectOption {
	id: string;
	label: string;
}

interface MultiselectProps {
	options: MultiselectOption[];
	selectedIds: string[];
	onChange: (selectedIds: string[]) => void;
	label: string;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
	loading?: boolean;
}

export function Multiselect({
	options,
	selectedIds,
	onChange,
	label,
	placeholder = "Selecione as opções",
	className,
	disabled = false,
	loading = false,
}: MultiselectProps) {
	const [isOpen, setIsOpen] = React.useState(false);
	const dropdownRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	const handleToggle = (optionId: string) => {
		if (disabled) return;
		
		const isSelected = selectedIds.includes(optionId);
		if (isSelected) {
			onChange(selectedIds.filter(id => id !== optionId));
		} else {
			onChange([...selectedIds, optionId]);
		}
	};

	const handleRemove = (optionId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		onChange(selectedIds.filter(id => id !== optionId));
	};

	const selectedOptions = options.filter(opt => selectedIds.includes(opt.id));
	const selectedLabels = selectedOptions.map(opt => opt.label);

	return (
		<div className={cn("space-y-2", className)} ref={dropdownRef}>
			<label className="text-sm font-semibold text-foreground block">
				{label}
			</label>
			
			<div className="relative">
				<button
					type="button"
					onClick={() => !disabled && setIsOpen(!isOpen)}
					disabled={disabled}
					className={cn(
						"w-full rounded-lg border border-input bg-transparent px-4 py-3 text-base shadow-sm transition-all duration-200 outline-none",
						"focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-md",
						"hover:border-primary/50",
						"disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
						"dark:bg-input/20",
						"flex items-center justify-between gap-2 min-h-[44px]",
						isOpen && "border-primary ring-2 ring-primary/20"
					)}
				>
					<div className="flex-1 flex flex-wrap gap-1.5 items-center">
						{selectedIds.length === 0 ? (
							<span className="text-muted-foreground text-sm">{placeholder}</span>
						) : (
							<>
								{selectedLabels.slice(0, 2).map((label, idx) => {
									const option = selectedOptions[idx];
									return (
										<span
											key={option.id}
											className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
										>
											{label}
											<span
												role="button"
												tabIndex={0}
												onClick={(e) => handleRemove(option.id, e)}
												onKeyDown={(e) => {
													if (e.key === 'Enter' || e.key === ' ') {
														e.preventDefault();
														handleRemove(option.id, e as any);
													}
												}}
												className="hover:bg-primary/20 rounded-full p-0.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
											>
												<X className="h-3 w-3" />
											</span>
										</span>
									);
								})}
								{selectedIds.length > 2 && (
									<span className="text-xs text-muted-foreground">
										+{selectedIds.length - 2} mais
									</span>
								)}
							</>
						)}
					</div>
					<ChevronDown
						className={cn(
							"h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0",
							isOpen && "transform rotate-180"
						)}
					/>
				</button>

				{isOpen && (
					<div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
						{loading ? (
							<div className="p-4 text-center text-sm text-muted-foreground">
								Carregando...
							</div>
						) : options.length === 0 ? (
							<div className="p-4 text-center text-sm text-muted-foreground">
								Nenhuma opção disponível
							</div>
						) : (
							<div className="p-1">
								{options.map((option) => {
									const isSelected = selectedIds.includes(option.id);
									return (
										<label
											key={option.id}
											className={cn(
												"flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors",
												"hover:bg-accent hover:text-accent-foreground",
												isSelected && "bg-accent/50"
											)}
										>
											<Checkbox
												checked={isSelected}
												onCheckedChange={() => handleToggle(option.id)}
											/>
											<span className="text-sm flex-1">{option.label}</span>
										</label>
									);
								})}
							</div>
						)}
					</div>
				)}
			</div>

			{selectedIds.length > 0 && (
				<p className="text-xs text-muted-foreground">
					{selectedIds.length} {selectedIds.length === 1 ? "item selecionado" : "itens selecionados"}
				</p>
			)}
		</div>
	);
}

