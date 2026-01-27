import ServiceCard from "@/components/services/ServiceCard";
import {
  FileCheck,
  RefreshCw,
  Search,
  Unlock,
  Car,
  FileText,
  Wrench,
  Cog,
  Hash,
} from "lucide-react";

export default function ServicosPage() {
  const services = [
    {
      title: "Licenciamento",
      description: "Renovação anual do licenciamento do seu veículo",
      icon: <FileCheck className="h-6 w-6" />,
      documents: [
        "CRLV (Certificado de Registro e Licenciamento do Veículo)",
        "Comprovante de pagamento do IPVA",
        "Comprovante de pagamento do seguro DPVAT",
        "Comprovante de endereço atualizado",
      ],
      estimatedTime: "3 a 5 dias úteis",
      pricing: "Consulte-nos para valores",
    },
    {
      title: "Transferência",
      description: "Transferência de propriedade do veículo",
      icon: <RefreshCw className="h-6 w-6" />,
      documents: [
        "CRV (Certificado de Registro do Veículo) original",
        "CRLV (Certificado de Registro e Licenciamento)",
        "RG e CPF do comprador e vendedor",
        "Comprovante de residência de ambas as partes",
        "Nota fiscal (se veículo 0km)",
      ],
      estimatedTime: "7 a 15 dias úteis",
      pricing: "Consulte-nos para valores",
    },
    {
      title: "Consulta de Débitos e Restrições",
      description: "Verificação completa de pendências do veículo",
      icon: <Search className="h-6 w-6" />,
      documents: ["Placa do veículo", "RENAVAM"],
      estimatedTime: "Imediato",
      pricing: "Consulte-nos para valores",
    },
    {
      title: "Liberação de Veículos Apreendidos",
      description: "Processo completo para liberação de veículos",
      icon: <Unlock className="h-6 w-6" />,
      documents: [
        "Documento do veículo",
        "RG e CPF do proprietário",
        "Comprovante de residência",
        "Auto de infração (se houver)",
        "Comprovante de pagamento de multas",
      ],
      estimatedTime: "5 a 10 dias úteis",
      pricing: "Consulte-nos para valores",
    },
    {
      title: "Emplacamento de 0km",
      description: "Primeiro emplacamento de veículos novos",
      icon: <Car className="h-6 w-6" />,
      documents: [
        "Nota fiscal do veículo",
        "RG e CPF do proprietário",
        "Comprovante de residência",
        "Certificado de segurança veicular",
      ],
      estimatedTime: "5 a 7 dias úteis",
      pricing: "Consulte-nos para valores",
    },
    {
      title: "Emissão de ATPV e CRLV",
      description: "Emissão de documentos do veículo",
      icon: <FileText className="h-6 w-6" />,
      documents: [
        "Documento de identidade do proprietário",
        "CPF",
        "Comprovante de residência",
        "Boletim de ocorrência (em caso de perda/roubo)",
      ],
      estimatedTime: "3 a 5 dias úteis",
      pricing: "Consulte-nos para valores",
    },
    {
      title: "Documentação de Modificação",
      description: "Regularização de modificações no veículo",
      icon: <Wrench className="h-6 w-6" />,
      documents: [
        "CRV e CRLV originais",
        "Laudo de vistoria técnica",
        "Nota fiscal das peças instaladas",
        "RG e CPF do proprietário",
      ],
      estimatedTime: "15 a 30 dias úteis",
      pricing: "Consulte-nos para valores",
    },
    {
      title: "Cadastro de Motor",
      description: "Registro de troca ou retífica de motor",
      icon: <Cog className="h-6 w-6" />,
      documents: [
        "CRV e CRLV originais",
        "Nota fiscal do motor",
        "Laudo de vistoria",
        "RG e CPF do proprietário",
      ],
      estimatedTime: "10 a 15 dias úteis",
      pricing: "Consulte-nos para valores",
    },
    {
      title: "Remarcação de Chassi e Motor",
      description: "Processo de remarcação legal",
      icon: <Hash className="h-6 w-6" />,
      documents: [
        "CRV e CRLV originais",
        "Boletim de ocorrência",
        "Laudo pericial",
        "RG e CPF do proprietário",
        "Autorização do DETRAN",
      ],
      estimatedTime: "20 a 30 dias úteis",
      pricing: "Consulte-nos para valores",
    },
  ];

  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Nossos Serviços
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Oferecemos soluções completas para todas as suas necessidades de
            documentação veicular
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {services.map((service, index) => (
            <ServiceCard key={index} {...service} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-lg text-muted-foreground mb-4">
            Não encontrou o serviço que procura?
          </p>
          <a
            href="https://wa.me/5511995324559"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-[var(--orange)] text-[var(--orange-foreground)] shadow hover:bg-[var(--orange)]/90 h-10 px-8"
          >
            Entre em contato conosco
          </a>
        </div>
      </div>
    </div>
  );
}
