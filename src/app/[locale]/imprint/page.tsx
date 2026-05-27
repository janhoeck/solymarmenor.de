import { ContactDetails } from '@/components/shared/ContactDetails/ContactDetails'
import { ContentContainer } from '@/components/shared/Container/ContentContainer'
import { ContentBlock } from '@/components/shared/ContentBlock/ContentBlock'
import { Section } from '@/components/shared/Section/Section'

export default function ImprintPage() {
  return (
    <ContentContainer className='mt-10'>
      <div className='flex flex-col gap-4'>
        <Section title='Impressum'>
          <Section
            title='Angaben gemäß § 5 TMG'
            variant='subsection'
          >
            <ContactDetails />
          </Section>
        </Section>
        <Section title='Haftungsausschluss'>
          <div className='flex flex-col gap-4'>
            <Section
              title='Haftung für Inhalte'
              variant='subsection'
            >
              <ContentBlock
                items={[
                  'Als Diensteanbieter bin ich gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG bin ich jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.',
                  'Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden entsprechender Rechtsverletzungen werde ich diese Inhalte umgehend entfernen.',
                ]}
              />
            </Section>
            <Section
              title='Haftung für Links'
              variant='subsection'
            >
              <ContentBlock
                items={[
                  'Diese Website enthält ggf. Links zu externen Websites Dritter, auf deren Inhalte ich keinen Einfluss habe. Deshalb kann ich für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.',
                  'Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werde ich derartige Links umgehend entfernen.',
                ]}
              />
            </Section>
          </div>
        </Section>
        <Section title='Datenschutz'>
          <ContentBlock
            items={[
              'Diese Website verwendet keine Cookies und erhebt keine personenbezogenen Daten ohne Ihre ausdrückliche Eingabe. Wenn Sie das Kontaktformular nutzen, werden Ihre Angaben ausschließlich zur Bearbeitung Ihrer Anfrage verwendet und nicht an Dritte weitergegeben. Weitere Hinweise finden Sie ggf. in der Datenschutzerklärung.',
            ]}
          />
        </Section>
      </div>
    </ContentContainer>
  )
}
