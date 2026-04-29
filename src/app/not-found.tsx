import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-10 pb-8 space-y-4">
          <p className="text-5xl font-bold tracking-tight text-muted-foreground">
            404
          </p>
          <h1 className="text-xl font-semibold tracking-tight">
            Page not found
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
          <Link href="/">
            <Button className="mt-2">Go home</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
