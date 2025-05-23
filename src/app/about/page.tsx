
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Github, Linkedin, Server } from 'lucide-react'; // Using Server for React
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image src="https://placehold.co/120x120.png" alt="FieldKey Logo" data-ai-hint="shield logo" width={120} height={120} className="rounded-full" />
          </div>
          <CardTitle className="text-4xl font-bold">FieldKey</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Secure, Memorable Passwords. Your Keys, Your Rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center max-w-2xl mx-auto">
          <p>
            FieldKey is a modern password generation tool designed to help you create unique and human-rememberable passwords.
            It leverages a deterministic approach: by providing a set of custom input fields and their specific sequence, FieldKey generates a consistent password every time.
          </p>
          <p className="font-semibold text-primary">
            Crucially, FieldKey does not store any of your input values or generated passwords. Your privacy and security are paramount.
          </p>
          
          <div className="pt-4">
            <h3 className="text-2xl font-semibold mb-3">Built With</h3>
            <div className="flex justify-center space-x-6">
              <div className="flex flex-col items-center" title="React & Next.js">
                <Server className="h-10 w-10 text-primary mb-1" />
                <span className="text-sm text-muted-foreground">React/Next.js</span>
              </div>
              <div className="flex flex-col items-center" title="Tailwind CSS">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary mb-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M10 3.545c1.804 0 3.294 1.388 3.522 3.182H6.478A3.531 3.531 0 0110 3.545zm3.522 4.318H6.478a3.53 3.53 0 000 1.274h7.044a3.53 3.53 0 000-1.274zm.254 2.182H6.224a3.531 3.531 0 003.776 3.182 3.531 3.531 0 003.776-3.182z" />
                </svg>
                <span className="text-sm text-muted-foreground">Tailwind CSS</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <h3 className="text-2xl font-semibold mb-4">Developer</h3>
            <div className="flex flex-col items-center space-y-3">
              <Avatar className="h-24 w-24">
                <AvatarImage src="https://placehold.co/100x100.png" alt="Developer Avatar" data-ai-hint="developer avatar" />
                <AvatarFallback>FS</AvatarFallback>
              </Avatar>
              <p className="text-xl font-medium">Firebase Studio Developer</p>
              <div className="flex space-x-4">
                <Link href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Github className="h-6 w-6" />
                  <span className="sr-only">GitHub</span>
                </Link>
                <Link href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  <Linkedin className="h-6 w-6" />
                  <span className="sr-only">LinkedIn</span>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
