"use client"

import { useTranslations } from "next-intl"

export function TermsContent() {
    const t = useTranslations("terms")

    return (
        <div className="prose dark:prose-invert max-w-none">
            <h1>{t("title")}</h1>
            <p>{t("lastUpdated")}</p>

            <h2>{t("acceptance.title")}</h2>
            <p>{t("acceptance.content")}</p>

            <h2>{t("description.title")}</h2>
            <p>{t("description.content")}</p>

            <h2>{t("prohibited.title")}</h2>
            <p>{t("prohibited.content")}
                <ul>
                    <li>{t("prohibited.items.0")}</li>
                    <li>{t("prohibited.items.1")}</li>
                    <li>{t("prohibited.items.2")}</li>
                </ul>
            </p>

            <h2>{t("disclaimer.title")}</h2>
            <p>{t("disclaimer.content")}</p>

            <h2>{t("changes.title")}</h2>
            <p>{t("changes.content")}</p>
        </div>
    )
}
