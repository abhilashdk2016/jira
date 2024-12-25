import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      <section className="container mx-auto py-20 text-center">
        <h1 className="text-6xl sm:text-7xl lg:text-8xl font-extrabold gradient-title pb-6 flex flex-col">
          Streamline Your Workflow <br />
          <span>with Scrum</span>
        </h1>
        <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
          Empower your team with our intuitive project management solution.
        </p>
        <Link href={"/onboarding"}>
          <Button size="lg" className="mr-4">Get Started <ChevronRight size={18} className="ml-1" /></Button>
        </Link>
        <Link href={"/"}>
          <Button variant={'outline'} size="lg" className="mr-4">Learn More</Button>
        </Link>
      </section>
    </div>
  );
}
