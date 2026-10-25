import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { SectionHeading } from "@/components/section-heading"

const faqs = [
  {
    q: "Is Toolbox really free?",
    a: "Yes. Every tool is free, with no watermark on your files. Tools that use our server have a daily limit so the free server stays fast for everyone.",
  },
  {
    q: "Do you keep my files?",
    a: 'No. Tools marked "Stays on your device" never upload your file at all. Tools marked "Uploaded, deleted after 1 hour" send it to our server for that one job, then delete it on their own after 1 hour.',
  },
  {
    q: "Do I need an account?",
    a: "No. Open any tool and start. Signing in with Google or GitHub is optional and will let you see your history and get higher daily limits.",
  },
  {
    q: "Does it work on my phone?",
    a: "Yes. Toolbox works in any modern browser on phones, tablets and laptops. Very large videos can be slow on older phones, so we show a warning before you start.",
  },
  {
    q: "How big can my files be?",
    a: "On-device tools take videos and audio up to 500 MB, and PDFs and images up to 100 MB. Server tools take files up to 10 MB and 20 pages.",
  },
  {
    q: 'What is "Jugaad Mode"?',
    a: "It links tools together. For example: take the sound out of a video, trim it, and save it as a WhatsApp voice note, all without uploading the file again.",
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="py-16 sm:py-24">
      <div className="container-page grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <SectionHeading
          align="left"
          eyebrow="Questions"
          title="Good to know"
          description="Short answers to the questions people ask most."
        />
        <Accordion type="single" collapsible className="rounded-3xl border bg-card px-5 sm:px-7">
          {faqs.map((faq) => (
            <AccordionItem key={faq.q} value={faq.q}>
              <AccordionTrigger className="py-5 text-base font-semibold hover:no-underline">{faq.q}</AccordionTrigger>
              <AccordionContent className="pb-5 text-base leading-relaxed text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
