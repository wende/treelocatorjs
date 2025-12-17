"use client"

import setupLocatorUI from "@treelocator/runtime"

if (process.env.NODE_ENV === "development") {
  setupLocatorUI()
}

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
