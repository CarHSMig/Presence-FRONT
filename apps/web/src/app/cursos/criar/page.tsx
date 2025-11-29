"use client";

import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthenticatedLayout from "@/components/authenticated-layout";
import { editCourseSchema, type EditCourseFormData } from '@/validators/course.validator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { GraduationCap, Loader2, ArrowLeft, Sparkles, AlertCircle, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { authUtils } from '@/utils/auth.utils';
import { applicationUtils } from '@/utils/application.utils';
import { useState } from 'react';

export default function CriarCursoPage() {
	const router = useRouter();
	const [showValidationErrors, setShowValidationErrors] = useState(false);

	const form = useForm({
		defaultValues: {
			name: '',
			periods: 1,
		} as EditCourseFormData,
		validators: {
			onChange: ({ value }) => {
				const result = editCourseSchema.safeParse(value);
				if (result.success) return undefined;
				return result.error.flatten().fieldErrors.name?.[0] ||
					result.error.flatten().fieldErrors.periods?.[0] ||
					'Erro de validação';
			},
		},
		onSubmitInvalid: ({ value }) => {
			setShowValidationErrors(true);
			
			const result = editCourseSchema.safeParse(value);
			if (!result.success) {
				const errors = result.error.flatten().fieldErrors;
				const errorMessages: string[] = [];
				
				const fieldLabels: Record<string, string> = {
					name: 'Nome do Curso',
					periods: 'Períodos',
				};

				Object.entries(errors).forEach(([field, messages]) => {
					if (messages && messages.length > 0) {
						const label = fieldLabels[field] || field;
						errorMessages.push(`${label}: ${messages[0]}`);
					}
				});

				if (errorMessages.length > 0) {
					toast.error(
						`Por favor, corrija os seguintes erros:\n${errorMessages.join('\n')}`,
						{ duration: 6000 }
					);
				}
			}
		},
		onSubmit: async ({ value }) => {
			try {
				const token = authUtils.getToken();
				if (!token) {
					toast.error('Você precisa estar autenticado para criar um curso');
					router.push('/login');
					return;
				}

				// Montar o payload no formato JSON:API
				const payload = {
					data: {
						type: "course",
						attributes: {
							name: value.name,
							periods: value.periods,
						}
					}
				};

				const baseUrl = applicationUtils.getBaseUrl();
				if (!baseUrl) {
					throw new Error('URL do servidor não configurada');
				}

				const url = `${baseUrl}/admin/courses`;

				const response = await fetch(url, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
					},
					body: JSON.stringify(payload),
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => ({}));
					throw new Error(
						errorData.message || 
						errorData.error ||
						`Erro ao criar curso: ${response.status} ${response.statusText}`
					);
				}

				const responseData = await response.json();
				toast.success('Curso criado com sucesso!');
				
				// Redirecionar para a página de detalhes do curso criado
				if (responseData.data?.id) {
					router.push(`/cursos/${responseData.data.id}` as any);
				} else {
					router.push('/cursos');
				}
			} catch (error) {
				console.error('Erro ao criar curso:', error);
				toast.error(
					error instanceof Error 
						? error.message 
						: 'Erro ao criar curso. Tente novamente.'
				);
			}
		},
	});

	const isLoading = form.state.isSubmitting;

	// Esconder erros quando a validação passar
	const handleFormChange = () => {
		if (showValidationErrors) {
			const result = editCourseSchema.safeParse(form.state.values);
			if (result.success) {
				setShowValidationErrors(false);
			}
		}
	};

	return (
		<ProtectedRoute>
			<AuthenticatedLayout className="p-4 md:p-8 bg-linear-to-br from-background via-background to-secondary/20">
				<div className="container mx-auto max-w-2xl">
					{/* Header com botão de voltar */}
					<div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
						<div className="flex items-start justify-between gap-4 mb-6">
							<div className="flex items-center gap-3 flex-1">
								<div className="p-3 rounded-lg bg-primary/10 backdrop-blur-sm animate-in zoom-in duration-500 delay-100">
									<Sparkles className="h-6 w-6 text-primary" />
								</div>
								<div className="flex-1 animate-in fade-in slide-in-from-left-4 duration-500 delay-200">
									<h1 className="text-4xl md:text-5xl font-bold text-foreground">
										Criar Curso
									</h1>
									<p className="text-base text-muted-foreground mt-2">
										Adicione um novo curso ao sistema
									</p>
								</div>
							</div>
							<Link href="/cursos" className="animate-in fade-in slide-in-from-right-4 duration-500 delay-300">
								<Button
									variant="ghost"
									size="sm"
									className="hover:bg-secondary/50 transition-colors duration-200 shrink-0"
								>
									<ArrowLeft className="h-4 w-4 mr-2" />
									Voltar
								</Button>
							</Link>
						</div>
					</div>

					{/* Formulário */}
					<div className="rounded-2xl border border-border/50 bg-card shadow-lg hover:shadow-xl transition-shadow overflow-hidden backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
						{/* Componente de Erros de Validação */}
						{showValidationErrors && (() => {
							const result = editCourseSchema.safeParse(form.state.values);
							if (!result.success) {
								const errors = result.error.flatten().fieldErrors;
								const errorList: Array<{ field: string; message: string; label: string }> = [];
								
								const fieldLabels: Record<string, string> = {
									name: 'Nome do Curso',
									periods: 'Períodos',
								};

								Object.entries(errors).forEach(([field, messages]) => {
									if (messages && messages.length > 0) {
										errorList.push({
											field,
											message: messages[0],
											label: fieldLabels[field] || field,
										});
									}
								});

								if (errorList.length > 0) {
									return (
										<div className="p-6 m-6 mb-0 rounded-lg bg-destructive/10 border border-destructive/30 animate-in fade-in slide-in-from-top-2">
											<div className="flex items-start gap-3">
												<div className="shrink-0 mt-0.5">
													<AlertCircle className="h-5 w-5 text-destructive" />
												</div>
												<div className="flex-1">
													<h3 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2">
														Erros de Validação
													</h3>
													<p className="text-xs text-destructive/80 mb-3">
														Por favor, corrija os seguintes campos antes de continuar:
													</p>
													<ul className="space-y-2">
														{errorList.map((error, index) => (
															<li 
																key={index} 
																className="flex items-start gap-2 text-sm text-destructive/90"
															>
																<span className="text-destructive mt-1.5 shrink-0">•</span>
																<span>
																	<span className="font-medium">{error.label}:</span>{' '}
																	<span className="text-destructive/80">{error.message}</span>
																</span>
															</li>
														))}
													</ul>
												</div>
											</div>
										</div>
									);
								}
							}
							return null;
						})()}
						
						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								
								const result = editCourseSchema.safeParse(form.state.values);
								if (!result.success) {
									setShowValidationErrors(true);
								} else {
									setShowValidationErrors(false);
								}
								
								form.handleSubmit().catch((error) => {
									console.error('Erro no submit do formulário:', error);
								});
							}}
							onChange={handleFormChange}
							className="p-8 md:p-10 space-y-8"
						>
							{/* Seção: Informações do Curso */}
							<div className="space-y-7">
								<div>
									<h2 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
										<GraduationCap className="h-5 w-5 text-primary" />
										Informações do Curso
									</h2>
									<p className="text-sm text-muted-foreground">
										Dados essenciais para identificar o curso
									</p>
								</div>

								<form.Field
									name="name"
									children={(field) => (
										<Input
											label="Nome do Curso"
											type="text"
											placeholder="Ex: Análise e Desenvolvimento de Sistemas"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
											aria-invalid={field.state.meta.errors.length > 0}
											error={field.state.meta.errors.length > 0}
											errorMessage={field.state.meta.errors[0] || 'Erro de validação'}
											icon={<GraduationCap className="h-4 w-4 text-primary" />}
											iconPosition="left"
										/>
									)}
								/>

								<form.Field
									name="periods"
									children={(field) => (
										<Input
											label="Número de Períodos"
											type="number"
											placeholder="Ex: 6"
											value={field.state.value.toString()}
											onChange={(e) => {
												const value = parseInt(e.target.value, 10);
												if (!isNaN(value)) {
													field.handleChange(value);
												} else if (e.target.value === '') {
													field.handleChange(1);
												}
											}}
											onBlur={field.handleBlur}
											aria-invalid={field.state.meta.errors.length > 0}
											error={field.state.meta.errors.length > 0}
											errorMessage={field.state.meta.errors[0] || 'Erro de validação'}
											icon={<BookOpen className="h-4 w-4 text-primary" />}
											iconPosition="left"
											min={1}
											max={20}
										/>
									)}
								/>
							</div>

							{/* Botões de Ação */}
							<div className="pt-6 flex gap-4">
								<Button
									type="button"
									variant="outline"
									onClick={() => router.push('/cursos')}
									className="flex-1 h-11 text-base font-medium rounded-lg hover:bg-secondary/50 transition-all duration-200 border-border/50"
									disabled={isLoading}
								>
									Cancelar
								</Button>
								<Button
									type="submit"
									className="flex-1 h-11 text-base font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70"
									disabled={isLoading}
									loading={isLoading}
									loadingIcon={<Loader2 className="h-4 w-4 animate-spin" />}
								>
									{isLoading ? 'Criando Curso...' : 'Criar Curso'}
								</Button>
							</div>
						</form>
					</div>
				</div>
			</AuthenticatedLayout>
		</ProtectedRoute>
	);
}

