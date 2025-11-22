"use client";

import { Calendar, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventLocation {
	road?: string;
	town?: string;
	state?: string;
	amenity?: string;
	postcode?: string;
	country?: string;
}

interface EventAttributes {
	id: string;
	name: string;
	description: string;
	event_start: string;
	event_end: string;
	location: EventLocation;
	latitude?: string;
	longitude?: string;
}

interface EventCardProps {
	event: {
		id: string;
		type: string;
		attributes: EventAttributes;
	};
	index?: number;
}

export function EventCard({ event, index = 0 }: EventCardProps) {
	const formatDateTime = (dateString: string) => {
		const date = new Date(dateString);
		const day = date.getDate().toString().padStart(2, '0');
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const year = date.getFullYear();
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		
		return {
			date: `${day}/${month}/${year}`,
			time: `${hours}:${minutes}`,
		};
	};

	const formatLocation = (location: EventLocation) => {
		const parts: string[] = [];
		
		if (location.amenity) parts.push(location.amenity);
		if (location.road) parts.push(location.road);
		if (location.town) parts.push(location.town);
		if (location.state) parts.push(location.state);
		
		return parts.length > 0 ? parts.join(', ') : 'Localização não informada';
	};

	const startDateTime = formatDateTime(event.attributes.event_start);
	const endDateTime = formatDateTime(event.attributes.event_end);
	const location = formatLocation(event.attributes.location);

	return (
		<div
			className={cn(
				"group relative rounded-xl border border-border/50 bg-card shadow-sm",
				"hover:shadow-xl hover:shadow-primary/10 transition-all duration-300",
				"hover:-translate-y-1 hover:border-primary/30",
				"overflow-hidden cursor-pointer",
				"animate-in fade-in slide-in-from-bottom-4"
			)}
			style={{
				animationDelay: `${index * 100}ms`,
			}}
		>
			<div className="absolute inset-0 bg-linear-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/3 group-hover:to-primary/5 transition-all duration-300 pointer-events-none" />
			
			<div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary via-primary/50 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

			<div className="relative p-6 space-y-5">
				<div className="space-y-2">
					<h3 className="text-lg font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-300">
						{event.attributes.name}
					</h3>
					{event.attributes.description && (
						<p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
							{event.attributes.description}
						</p>
					)}
				</div>

				<div className="h-px bg-border group-hover:bg-primary/30 transition-colors duration-300" />

				<div className="space-y-4">
					<div className="flex items-start gap-3">
						<div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300 shrink-0">
							<Calendar className="h-4 w-4 text-primary" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
								Início
							</p>
							<p className="text-sm font-semibold text-foreground">
								{startDateTime.date}
							</p>
							<p className="text-xs text-muted-foreground">
								{startDateTime.time}
							</p>
						</div>
					</div>

					{/* Data e Hora de Término */}
					<div className="flex items-start gap-3">
						<div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300 shrink-0">
							<Clock className="h-4 w-4 text-primary" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
								Término
							</p>
							<p className="text-sm font-semibold text-foreground">
								{endDateTime.date}
							</p>
							<p className="text-xs text-muted-foreground">
								{endDateTime.time}
							</p>
						</div>
					</div>

					{/* Localização */}
					<div className="flex items-start gap-3">
						<div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300 shrink-0">
							<MapPin className="h-4 w-4 text-primary" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
								Local
							</p>
							<p className="text-sm font-medium text-foreground line-clamp-2 leading-relaxed">
								{location}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

