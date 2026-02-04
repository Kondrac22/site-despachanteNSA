import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white">
                <span className="text-3xl font-bold text-primary">NSA</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold">
                Despachante
                <br />
                Nossa Senhora Aparecida
              </h1>
            </div>

            <p className="text-xl md:text-2xl opacity-95">
              Soluções completas em documentação veicular
            </p>

            <p className="text-lg opacity-90">
              Agilidade, segurança e transparência em todos os serviços.
              Cuidamos da documentação do seu veículo com excelência.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-[var(--orange-foreground)]"
              >
                <Link href="#formulario">Solicitar Serviço</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-white text-primary hover:bg-white/90"
              >
                <Link href="/servicos">Nossos Serviços</Link>
              </Button>
            </div>
          </div>

          <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80"
              alt="Documentação veicular"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
