"use client"

import { useTranslations } from "next-intl"

export function PrivacyContent() {
    const t = useTranslations("privacy")

    return (
        <div className="prose dark:prose-invert max-w-none">
            <h1>{t("title")}</h1>
            <p>{t("lastUpdated")}</p>

            <h2>{t("introduction.title")}</h2>
            <p>{t("introduction.content")}</p>

            <h2>{t("informationCollection.title")}</h2>
            <p>{t("informationCollection.content")}</p>

            <h2>{t("emailContent.title")}</h2>
            <p>{t("emailContent.content")}</p>

            <h2>{t("thirdParty.title")}</h2>
            <p>{t("thirdParty.content")}</p>

            <h2>{t("contact.title")}</h2>
            <p>{t("contact.content")}</p>
        </div>
    )
}
