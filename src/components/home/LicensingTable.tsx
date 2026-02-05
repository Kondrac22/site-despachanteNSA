import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Truck } from 'lucide-react';

export default function LicensingTable() {
  const vehiclesData = [
    { final: '1 e 2', mes: 'Julho' },
    { final: '3 e 4', mes: 'Agosto' },
    { final: '5 e 6', mes: 'Setembro' },
    { final: '7 e 8', mes: 'Outubro' },
    { final: '9', mes: 'Novembro' },
    { final: '0', mes: 'Dezembro' },
  ];

  const trucksData = [
    { final: '1, 2 e 3', mes: 'Agosto' },
    { final: '4 e 5', mes: 'Setembro' },
    { final: '6, 7 e 8', mes: 'Outubro' },
    { final: '9', mes: 'Novembro' },
    { final: '0', mes: 'Dezembro' },
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Calendário de Licenciamento SP 2026
          </h2>
          <p className="text-lg text-muted-foreground">
            Confira os prazos de licenciamento por final de placa
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <Card className="border-primary/30">
            <CardHeader className="bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Car className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Veículos Leves</CardTitle>
                  <CardDescription>Carros, motos e utilitários</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {vehiclesData.map((item) => (
                  <div
                    key={item.final}
                    className="flex justify-between items-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <span className="font-semibold">Final {item.final}</span>
                    <span className="text-muted-foreground">{item.mes}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-[var(--orange)]/30">
            <CardHeader className="bg-[var(--orange)]/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--orange)]/10">
                  <Truck className="h-6 w-6 text-[var(--orange)]" />
                </div>
                <div>
                  <CardTitle>Veículos Pesados</CardTitle>
                  <CardDescription>Caminhões e veículos de carga</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {trucksData.map((item) => (
                  <div
                    key={item.final}
                    className="flex justify-between items-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <span className="font-semibold">Final {item.final}</span>
                    <span className="text-muted-foreground">{item.mes}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
