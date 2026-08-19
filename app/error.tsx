"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production, log error to monitoring tool if configured
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-slate-200 shadow-md">
        <CardHeader className="text-center pb-2">
          <div className="h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold text-slate-900">
            Something went wrong
          </CardTitle>
          <CardDescription className="text-xs">
            An unexpected error occurred while loading this compliance view.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-xs text-slate-500 pb-4">
          <p className="bg-slate-100 p-2.5 rounded-md font-mono text-[11px] text-slate-700 break-all">
            {error?.message || "Internal Application Error"}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => reset()} className="w-full sm:flex-1 gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Try Again
          </Button>
          <Link href="/dashboard" className="w-full sm:flex-1">
            <Button variant="outline" className="w-full gap-1.5 text-xs">
              <Home className="h-3.5 w-3.5" /> Return Home
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
