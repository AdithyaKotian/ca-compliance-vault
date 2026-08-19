import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { FileQuestion, Home } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-slate-200 shadow-md text-center">
        <CardHeader className="pb-2">
          <div className="h-14 w-14 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-3">
            <FileQuestion className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            404 - Page Not Found
          </CardTitle>
          <CardDescription className="text-xs">
            The compliance resource, document, or client link you requested could not be located.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-slate-500 pb-4">
          Please check the URL or return to your firm workspace dashboard.
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/dashboard">
            <Button className="gap-2 text-xs">
              <Home className="h-4 w-4" /> Return to Dashboard
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
