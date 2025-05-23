import { Heart } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="py-6 md:px-8 md:py-0 border-t">
      <div className="container flex flex-col items-center justify-center gap-4 md:h-20 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground">
          © {currentYear} FieldKey. Built with <Heart className="inline h-4 w-4 text-red-500 fill-red-500" /> using Next.js and Tailwind CSS.
        </p>
      </div>
    </footer>
  );
}
