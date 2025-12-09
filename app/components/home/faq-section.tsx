"use client"

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { useTranslations } from "next-intl"

export function FaqSection() {
    const t = useTranslations("home.faq")

    // We'll hardcode the keys for now to map them
    const questions = ["q1", "q2", "q3", "q4", "q5"]

    return (
        <section className="py-24 bg-muted/30">
            <div className="container mx-auto px-4 max-w-3xl">
                <h2 className="text-4xl font-bold text-center mb-12">{t("title")}</h2>
                <div className="bg-card w-full rounded-2xl border shadow-sm p-6 sm:p-10">
                    <Accordion type="single" collapsible className="w-full">
                        {questions.map((key) => (
                            <AccordionItem key={key} value={key} className="border-b-border/50 last:border-0 px-2">
                                <AccordionTrigger className="text-left py-6 text-lg hover:text-primary transition-colors hover:no-underline">
                                    {t(`${key}.question`)}
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground text-base pb-6 leading-relaxed">
                                    {t(`${key}.answer`)}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </section>
    )
}
