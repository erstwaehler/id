/**
 * Password Reset Email Template
 * Built with React-Email + Tailwind for EWF-ID
 */
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface PasswordResetEmailProps {
  name: string;
  resetUrl: string;
}

export function PasswordResetEmail({
  name,
  resetUrl,
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Passwort zurücksetzen für EWF-ID</Preview>
      <Tailwind>
        <Body className="bg-slate-100 font-sans">
          <Container className="bg-white mx-auto py-5 pb-12 mb-16 max-w-150">
            <Heading className="text-slate-900 text-2xl font-bold text-center my-8">
              EWF-ID
            </Heading>
            <Section className="px-6">
              <Text className="text-slate-700 text-base leading-7 my-4">
                Hallo {name},
              </Text>
              <Text className="text-slate-700 text-base leading-7 my-4">
                Du hast eine Passwort-Zurücksetzung angefordert. Klicke auf den
                Button unten, um ein neues Passwort zu setzen.
              </Text>
              <Button
                className="bg-slate-900 rounded-md text-white block text-base font-semibold text-center no-underline py-3 px-6 mx-auto my-6"
                href={resetUrl}
              >
                Passwort zurücksetzen
              </Button>
              <Text className="text-slate-500 text-sm leading-6 my-4">
                Oder kopiere diesen Link: {resetUrl}
              </Text>
              <Text className="text-slate-500 text-sm leading-6 my-4">
                Dieser Link ist 1 Stunde gültig. Wenn du keine Zurücksetzung
                angefordert hast, ignoriere diese E-Mail.
              </Text>
            </Section>
            <Hr className="border-slate-200 my-5" />
            <Text className="text-slate-400 text-xs text-center">
              Erstwähler Foundation |{" "}
              <Link href="https://ewf-stade.de" className="text-slate-400">
                ewf-stade.de
              </Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default PasswordResetEmail;
