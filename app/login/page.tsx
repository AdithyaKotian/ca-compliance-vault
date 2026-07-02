"use client"

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { toast } from "sonner";

type Role = "admin" | "client";

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [role, setRole] = useState<Role>("admin");

	const handleLogin = () => {
		if (!email.trim() || !password.trim()) {
			toast.error("Please enter email and password");
			return;
		}

		if (role === "admin") {
			toast.success("Demo firm login successful");
			router.push("/dashboard");
			return;
		}

		toast.success("Demo client login successful");
		router.push("/client-portal");
	};

	return (
		<div className="min-h-screen bg-slate-50 flex">
			<div className="hidden md:flex w-1/2 items-center justify-center p-16">
				<div className="max-w-lg">
					<h2 className="text-3xl font-extrabold text-slate-900">CA Compliance Vault</h2>
					<h1 className="mt-6 text-4xl font-semibold text-slate-800">Stop chasing documents. Start tracking compliance.</h1>
					<p className="mt-4 text-slate-600">A secure client portal for CA and tax firms to collect files, approvals, and payments on time.</p>

					<ul className="mt-6 space-y-3 text-slate-700">
						<li>• Secure document collection</li>
						<li>• Client approval tracking</li>
						<li>• Deadline and invoice follow-ups</li>
						<li>• Branded portal experience</li>
					</ul>
				</div>
			</div>

			<div className="flex flex-1 items-center justify-center p-6">
				<div className="w-full max-w-md">
					<Card>
						<CardHeader>
							<CardTitle>Welcome back</CardTitle>
							<p className="text-sm text-slate-600">Sign in to your compliance workspace.</p>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex gap-2">
									<Button variant={role === "admin" ? undefined : "ghost"} onClick={() => setRole("admin")} className="flex-1">
										Firm Admin / Staff
									</Button>
									<Button variant={role === "client" ? undefined : "ghost"} onClick={() => setRole("client")} className="flex-1">
										Client
									</Button>
								</div>

								<div>
									<label className="block text-sm font-medium text-slate-700">Email</label>
									<Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
								</div>

								<div>
									<label className="block text-sm font-medium text-slate-700">Password</label>
									<Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
								</div>

								<div className="flex items-center justify-between">
									<Link href="/" className="text-sm text-slate-600 underline">Back to Home</Link>
									<Link href="#" className="text-sm text-slate-600 underline">Forgot password?</Link>
								</div>

								<div>
									<Button className="w-full" onClick={handleLogin}>Sign in</Button>
								</div>

								<div className="text-center text-sm text-slate-600">Need access? <Link href="#" className="underline">Contact your CA firm</Link></div>

								<div className="mt-4 rounded-md border bg-slate-50 p-3">
									<div className="text-sm font-medium text-slate-700">Demo credentials</div>
									<div className="mt-2 grid gap-2">
										<div className="text-sm">
											<strong>Firm Admin:</strong>
											<div className="text-slate-700">admin@kotianandco.in</div>
											<div className="text-slate-700">password: demo123</div>
										</div>
										<div className="text-sm">
											<strong>Client:</strong>
											<div className="text-slate-700">client@abctraders.in</div>
											<div className="text-slate-700">password: demo123</div>
										</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
