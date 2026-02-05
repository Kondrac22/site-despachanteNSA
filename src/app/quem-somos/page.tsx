import { Card, CardContent } from "@/components/ui/card";
import { Target, Eye, Heart, Users } from "lucide-react";

export default function QuemSomosPage() {
  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Quem Somos</h1>
            <p className="text-xl text-muted-foreground">
              Conheça a história e os valores do Despachante Nossa Senhora
            </p>
          </div>

          <div className="space-y-12">
            <section>
              <h2 className="text-3xl font-bold mb-6">Nossa História</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  O Despachante Nossa Senhora Aparecida nasceu da necessidade de oferecer
                  serviços de documentação veicular com excelência, agilidade e
                  transparência. Com anos de experiência no mercado, construímos
                  uma reputação sólida baseada na confiança e satisfação dos
                  nossos clientes.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Nossa equipe é formada por profissionais altamente
                  qualificados e comprometidos em facilitar todos os processos
                  burocráticos relacionados à documentação de veículos, sempre
                  buscando as melhores soluções para cada situação.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold mb-6">
                Missão, Visão e Valores
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-primary/30">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Target className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold">Missão</h3>
                      <p className="text-muted-foreground">
                        Facilitar e agilizar todos os processos de documentação
                        veicular, oferecendo serviços de qualidade com
                        transparência e eficiência.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/30">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Eye className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold">Visão</h3>
                      <p className="text-muted-foreground">
                        Ser referência em serviços de despachante em São Paulo,
                        reconhecidos pela excelência e inovação no atendimento.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/30">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Heart className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold">Valores</h3>
                      <p className="text-muted-foreground">
                        Ética, transparência, comprometimento, agilidade e foco
                        total na satisfação do cliente.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section>
              <Card className="border-[var(--orange)]/30 bg-[var(--orange)]/5">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="p-4 rounded-full bg-[var(--orange)]/10">
                      <Users className="h-12 w-12 text-[var(--orange)]" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-2xl font-bold mb-2">Nossa Equipe</h3>
                      <p className="text-muted-foreground">
                        Contamos com uma equipe de profissionais experientes e
                        dedicados, sempre atualizados com as legislações e
                        procedimentos do DETRAN-SP. Cada membro da nossa equipe
                        está comprometido em oferecer o melhor atendimento e
                        resolver suas necessidades com eficiência.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
