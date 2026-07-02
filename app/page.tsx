import React from "react"
import Link from "next/link"

import { Button } from "../components/ui/button"
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
} from "../components/ui/card"
import { Badge } from "../components/ui/badge"

import {
	FileText,
	MessageCircle,
	Calendar,
	Clock,
	CreditCard,
	CheckSquare,
	DollarSign,
	Users,
} from "lucide-react"

export default function Page() {
	return (
		<main className="min-h-screen bg-slate-50 text-slate-900">
			<header className="border-b bg-white/60 backdrop-blur-sm">
				<div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
					<Link href="/" className="font-heading text-lg font-semibold">
						CA Compliance Vault
					</Link>

					<nav className="hidden md:flex items-center gap-6">
						<a href="#features" className="text-sm text-slate-700 hover:text-slate-900">
							Features
						</a>
						<a href="#workflow" className="text-sm text-slate-700 hover:text-slate-900">
							Workflow
						</a>
						<a href="#pricing" className="text-sm text-slate-700 hover:text-slate-900">
							Pricing
						</a>
						<Link href="/login">
							<Button variant="outline" size="sm">
								Login
							</Button>
						</Link>
					</nav>
				</div>
			</header>

			<section className="mx-auto max-w-7xl px-6 py-16">
				<div className="grid gap-12 lg:grid-cols-2 lg:items-center">
					<div>
						<h1 className="font-heading mb-4 text-3xl font-semibold leading-tight md:text-4xl">
							Stop chasing clients for documents, approvals, and payments.
						</h1>
						<p className="text-muted-foreground mb-6 max-w-xl">
							A branded client portal for CA and tax firms to collect files, track
							deadlines, and improve collections.
						</p>

						<div className="flex flex-wrap gap-3">
							<Link href="/dashboard">
								<Button size="lg">View Demo Dashboard</Button>
							</Link>
							<Link href="/client-portal">
								<Button variant="outline" size="lg">
									Client Portal Preview
								</Button>
							</Link>
						</div>
					</div>

					<div className="order-first lg:order-last">
						<Card className="shadow-md">
							<CardHeader>
								<CardTitle>Branded portal • Clean workflows</CardTitle>
								<CardDescription>
									Designed for CA firms, accountants and outsourced finance teams.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<div>
											<div className="text-sm text-muted-foreground">Pending Documents</div>
											<div className="text-xl font-semibold">42</div>
										</div>
										<FileText className="h-6 w-6 text-slate-500" />
									</div>

									<div className="flex items-center justify-between">
										<div>
											<div className="text-sm text-muted-foreground">Jobs Due This Week</div>
											<div className="text-xl font-semibold">18</div>
										</div>
										<Calendar className="h-6 w-6 text-slate-500" />
									</div>

									<div className="flex items-center justify-between">
										<div>
											<div className="text-sm text-muted-foreground">Unpaid Invoices</div>
											<div className="text-xl font-semibold">₹1,24,000</div>
										</div>
										<DollarSign className="h-6 w-6 text-slate-500" />
									</div>

									<div className="flex items-center justify-between">
										<div>
											<div className="text-sm text-muted-foreground">SLA Risk</div>
											<div className="text-xl font-semibold">7 high-risk jobs</div>
										</div>
										<Clock className="h-6 w-6 text-amber-600" />
									</div>
								</div>
							</CardContent>
							<CardFooter className="justify-between">
								<Badge>Demo Dashboard</Badge>
								<Link href="/dashboard">
									<Button size="sm">Open Preview</Button>
								</Link>
							</CardFooter>
						</Card>
					</div>
				</div>
			</section>

			<section id="problems" className="border-t bg-white/50">
				<div className="mx-auto max-w-7xl px-6 py-16">
					<h2 className="font-heading mb-8 text-2xl font-semibold">The problems</h2>
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
						<Card>
							<CardContent className="flex items-start gap-4">
								<FileText className="h-6 w-6 text-slate-600" />
								<div>
									<div className="font-medium">Late documents</div>
									<p className="text-sm text-muted-foreground">Clients send files late, delaying work.</p>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="flex items-start gap-4">
								<MessageCircle className="h-6 w-6 text-slate-600" />
								<div>
									<div className="font-medium">WhatsApp chaos</div>
									<p className="text-sm text-muted-foreground">Approvals and file requests scattered across chats.</p>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="flex items-start gap-4">
								<Calendar className="h-6 w-6 text-slate-600" />
								<div>
									<div className="font-medium">Missed deadlines</div>
									<p className="text-sm text-muted-foreground">Tracking deadlines across clients is time-consuming.</p>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="flex items-start gap-4">
								<CreditCard className="h-6 w-6 text-slate-600" />
								<div>
									<div className="font-medium">Payment delays</div>
									<p className="text-sm text-muted-foreground">Invoices get lost; collections suffer.</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			<section id="features" className="mx-auto max-w-7xl px-6 py-16">
				<h2 className="font-heading mb-8 text-2xl font-semibold">How CA Compliance Vault helps</h2>
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
					<Card>
						<CardContent className="flex items-start gap-4">
							<CheckSquare className="h-6 w-6 text-slate-600" />
								<div>
									<div className="font-medium">Document request checklists</div>
									<p className="text-sm text-muted-foreground">Structured lists so clients upload exactly what&apos;s needed.</p>
								</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="flex items-start gap-4">
							<Calendar className="h-6 w-6 text-slate-600" />
							<div>
								<div className="font-medium">Deadline tracker</div>
								<p className="text-sm text-muted-foreground">Clear timelines and reminders for team and clients.</p>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="flex items-start gap-4">
							<Users className="h-6 w-6 text-slate-600" />
							<div>
								<div className="font-medium">Client approvals</div>
								<p className="text-sm text-muted-foreground">Approve deliverables in a single, auditable place.</p>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="flex items-start gap-4">
							<DollarSign className="h-6 w-6 text-slate-600" />
							<div>
								<div className="font-medium">Invoice payment links</div>
								<p className="text-sm text-muted-foreground">Send invoices with one-click payment options.</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</section>

			<section id="workflow" className="border-t bg-white/50">
				<div className="mx-auto max-w-7xl px-6 py-16">
					<h2 className="font-heading mb-8 text-2xl font-semibold">Workflow</h2>
					<div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
						{[
							"Create client",
							"Start engagement",
							"Request documents",
							"Track progress",
							"Send reminder",
							"Collect payment",
						].map((step, i) => (
							<div key={step} className="flex flex-col items-start gap-3 rounded-lg border bg-white p-4">
								<Badge variant="outline">Step {i + 1}</Badge>
								<div className="font-medium">{step}</div>
							</div>
						))}
					</div>
				</div>
			</section>

			<section id="pricing" className="mx-auto max-w-7xl px-6 py-16">
				<h2 className="font-heading mb-8 text-2xl font-semibold">Pricing preview</h2>
				<div className="grid gap-6 md:grid-cols-3">
					<Card>
						<CardHeader>
							<CardTitle>Starter Setup</CardTitle>
							<CardDescription>One-time</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-semibold">₹49,999</div>
							<p className="text-sm text-muted-foreground mt-2">Ideal for small CA practices getting started.</p>
						</CardContent>
						<CardFooter>
							<Link href="/contact">
								<Button size="sm">Request Setup</Button>
							</Link>
						</CardFooter>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Growth Setup</CardTitle>
							<CardDescription>One-time</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-semibold">₹1.5L+</div>
							<p className="text-sm text-muted-foreground mt-2">For growing firms with multi-practice needs.</p>
						</CardContent>
						<CardFooter>
							<Link href="/contact">
								<Button size="sm">Get Quote</Button>
							</Link>
						</CardFooter>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Monthly Support</CardTitle>
							<CardDescription>Ongoing</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-semibold">₹7,999+</div>
							<p className="text-sm text-muted-foreground mt-2">Support, updates and additional integrations.</p>
						</CardContent>
						<CardFooter>
							<Link href="/contact">
								<Button size="sm">Talk to Sales</Button>
							</Link>
						</CardFooter>
					</Card>
				</div>
			</section>

			<section className="border-t bg-white/60">
				<div className="mx-auto max-w-7xl px-6 py-16 text-center">
					<h2 className="font-heading mb-4 text-2xl font-semibold">Turn client follow-ups into a clean, trackable workflow.</h2>
					<div className="flex items-center justify-center gap-4">
						<Link href="/dashboard">
							<Button size="lg">Open Dashboard Preview</Button>
						</Link>
					</div>
				</div>
			</section>

			<footer className="border-t bg-white">
				<div className="mx-auto max-w-7xl px-6 py-8 text-sm text-muted-foreground">
					<div className="flex flex-col items-center justify-between gap-4 md:flex-row">
						<div>© {new Date().getFullYear()} CA Compliance Vault</div>
						<div className="flex gap-4">
							<a href="/privacy" className="hover:text-slate-900">Privacy</a>
							<a href="/terms" className="hover:text-slate-900">Terms</a>
						</div>
					</div>
				</div>
			</footer>
		</main>
	)
}
