export default function PoliticaPrivacidadePage() {
  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8">
            Política de Privacidade
          </h1>

          <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                1. Introdução
              </h2>
              <p>
                O Despachante Nossa Senhora está comprometido com a proteção da
                privacidade e dos dados pessoais de seus clientes, em
                conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº
                13.709/2018).
              </p>
              <p>
                Esta Política de Privacidade descreve como coletamos, usamos,
                armazenamos e protegemos suas informações pessoais quando você
                utiliza nossos serviços.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                2. Coleta de Dados
              </h2>
              <p>Coletamos os seguintes tipos de informações:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Dados de identificação: nome completo, CPF, RG</li>
                <li>Dados de contato: telefone, e-mail, endereço</li>
                <li>
                  Dados veiculares: placa, RENAVAM, informações do veículo
                </li>
                <li>
                  Documentos necessários para prestação dos serviços contratados
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                3. Uso dos Dados
              </h2>
              <p>Utilizamos seus dados pessoais para:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Prestação dos serviços de despachante contratados</li>
                <li>Comunicação sobre o andamento dos processos</li>
                <li>Cumprimento de obrigações legais e regulatórias</li>
                <li>Melhoria dos nossos serviços</li>
                <li>
                  Envio de informações relevantes sobre nossos serviços (com seu
                  consentimento)
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                4. Compartilhamento de Dados
              </h2>
              <p>Seus dados pessoais podem ser compartilhados com:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Órgãos públicos (DETRAN, Receita Federal, etc.) para
                  cumprimento legal
                </li>
                <li>
                  Prestadores de serviços que nos auxiliam na execução dos
                  serviços
                </li>
                <li>Autoridades competentes, quando exigido por lei</li>
              </ul>
              <p className="mt-4">
                Não vendemos, alugamos ou compartilhamos seus dados pessoais com
                terceiros para fins de marketing sem seu consentimento
                explícito.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                5. Armazenamento e Segurança
              </h2>
              <p>
                Implementamos medidas técnicas e organizacionais adequadas para
                proteger seus dados pessoais contra acesso não autorizado,
                perda, destruição ou alteração.
              </p>
              <p>
                Seus dados são armazenados de forma segura e mantidos apenas
                pelo tempo necessário para cumprir as finalidades descritas
                nesta política ou conforme exigido por lei.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                6. Cookies
              </h2>
              <p>
                Nosso site pode utilizar cookies para melhorar sua experiência
                de navegação. Cookies são pequenos arquivos de texto armazenados
                em seu dispositivo que nos ajudam a entender como você utiliza
                nosso site.
              </p>
              <p>
                Você pode configurar seu navegador para recusar cookies, mas
                isso pode afetar algumas funcionalidades do site.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                7. Seus Direitos (LGPD)
              </h2>
              <p>De acordo com a LGPD, você tem direito a:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Confirmar a existência de tratamento de seus dados</li>
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
                <li>
                  Solicitar a anonimização, bloqueio ou eliminação de dados
                  desnecessários
                </li>
                <li>Solicitar a portabilidade de seus dados</li>
                <li>Revogar o consentimento</li>
                <li>
                  Obter informações sobre o compartilhamento de seus dados
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                8. Contato
              </h2>
              <p>
                Para exercer seus direitos ou esclarecer dúvidas sobre esta
                Política de Privacidade, entre em contato conosco:
              </p>
              <ul className="list-none space-y-2 mt-4">
                <li>
                  <strong>E-mail:</strong> contato@nossasenhora.com.br
                </li>
                <li>
                  <strong>Telefone:</strong> (11) 99532-4559
                </li>
                <li>
                  <strong>Endereço:</strong> São Paulo, SP
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                9. Alterações nesta Política
              </h2>
              <p>
                Esta Política de Privacidade pode ser atualizada periodicamente.
                Recomendamos que você revise esta página regularmente para se
                manter informado sobre como protegemos suas informações.
              </p>
              <p className="mt-4">
                <strong>Última atualização:</strong> Janeiro de 2024
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
