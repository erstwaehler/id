/**
 * EWF-ID Impressum (Legal Notice) Page
 * SPEC.md Phase 6 - Task 6.6: Legal & Compliance Pages
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/(legal)/impressum")({
  component: ImpressumPage,
});

function ImpressumPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Impressum</h1>
            <p className="text-muted-foreground">Legal Notice</p>
          </div>
        </div>

        <Card className="prose prose-invert max-w-none">
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold mt-0">Angaben gemäß § 5 TMG</h2>
            
            <p>
              <strong>Erstwähler Forum e.V.</strong><br />
              (eingetragener gemeinnütziger Verein)
            </p>

            <h3 className="text-lg font-medium">Anschrift</h3>
            <p>
              Erstwähler Forum e.V.<br />
              z.Hd. Jack Ruder<br />
              c/o Athenaeum Stade (SV-Büro)<br />
              Harsefelder Str. 40<br />
              21680 Stade<br />
              Deutschland
            </p>

            <h3 className="text-lg font-medium">Kontakt</h3>
            <p>
              Telefon: <a href="tel:+4941412271009" className="text-primary hover:underline">0414152271009</a> (Athenaeum SV-Büro)<br />
              E-Mail: <a href="mailto:contact@ewf-stade.de" className="text-primary hover:underline">contact@ewf-stade.de</a><br />
              Website: <a href="https://ewf-stade.de" className="text-primary hover:underline">ewf-stade.de</a>
            </p>

            <h3 className="text-lg font-medium">Vertretungsberechtigte</h3>
            <p>
              Der Verein wird vertreten durch den Vorstand gemäß § 26 BGB.
            </p>

            <h3 className="text-lg font-medium">Registereintrag</h3>
            <p>
              Eingetragen im Vereinsregister<br />
              Registergericht: Amtsgericht Tostedt<br />
              Registernummer: [Vereinsregisternummer]
            </p>

            <h2 className="text-xl font-semibold">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
            <p>
              Erstwähler Forum e.V.<br />
              z.Hd. Jack Ruder<br />
              c/o Athenaeum Stade<br />
              Harsefelder Str. 40<br />
              21680 Stade
            </p>

            <h2 className="text-xl font-semibold">EU-Streitschlichtung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
              <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                https://ec.europa.eu/consumers/odr/
              </a>
            </p>
            <p>
              Unsere E-Mail-Adresse finden Sie oben im Impressum.
            </p>

            <h2 className="text-xl font-semibold">Verbraucherstreitbeilegung/Universalschlichtungsstelle</h2>
            <p>
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer 
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>

            <h2 className="text-xl font-semibold">Haftung für Inhalte</h2>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen 
              Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind 
              wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte 
              fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine 
              rechtswidrige Tätigkeit hinweisen.
            </p>
            <p>
              Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach 
              den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung 
              ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung 
              möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese 
              Inhalte umgehend entfernen.
            </p>

            <h2 className="text-xl font-semibold">Haftung für Links</h2>
            <p>
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir 
              keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine 
              Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige 
              Anbieter oder Betreiber der Seiten verantwortlich.
            </p>

            <h2 className="text-xl font-semibold">Urheberrecht</h2>
            <p>
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten 
              unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, 
              Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes 
              bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>

            <h2 className="text-xl font-semibold">Datenschutz</h2>
            <p>
              Informationen zur Verarbeitung Ihrer personenbezogenen Daten finden Sie in unserer{" "}
              <Link to="/privacy-policy" className="text-primary hover:underline">
                Datenschutzerklärung
              </Link>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
