"use client"

import { usePathname } from "next/navigation"
import { Footer } from "./footer"

export function ConditionalFooter() {
    const pathname = usePathname()

    // Hide footer on /moe and /profile paths
    const hideFooterPaths = ["/moe", "/profile"]
    const shouldHideFooter = hideFooterPaths.some(path =>
        pathname.includes(path)
    )

    if (shouldHideFooter) {
        return null
    }

    return <Footer />
}
