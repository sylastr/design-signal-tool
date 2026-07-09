"use client"

/**
 * AppShell — the canonical Saffron application frame.
 *
 * Composes the real Saffron chrome so screens inherit correct structure,
 * spacing, and a11y for free:
 *   SafProductHeader (+ SafLogo, SafProductHeaderItem)  — top app bar
 *   SafSideNav       (+ SafMenuItem)                    — primary navigation
 *   SafBreadcrumb    (+ SafBreadcrumbItem)              — location trail
 *   SafFooter        (+ SafList / SafAnchor)            — page footer
 *
 * NEVER hand-roll a <header>/<nav>/<footer> for a Saffron app — use this.
 * All prop/slot shapes here are verified against the Ask Saffron MCP.
 */

import type { ReactNode } from "react"
import { useState } from "react"
import {
  SafAnchor,
  SafBreadcrumb,
  SafBreadcrumbItem,
  SafButton,
  SafFooter,
  SafIcon,
  SafList,
  SafListItem,
  SafLogo,
  SafMenuItem,
  SafProductHeader,
  SafProductHeaderItem,
  SafSideNav,
  SafSrOnly,
} from "@thomsonreuters/saffron-core-components-prototyping-only/react"

export type NavItem = {
  id: string
  label: string
  /** Font Awesome icon name, e.g. "objects-column". */
  icon: string
  url?: string
  /** Marks this item as the current page (sets native aria-current="page"). */
  current?: boolean
}

export type Crumb = { label: string; href?: string }

const defaultNav: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "objects-column", url: "#dashboard" },
  { id: "matters", label: "Matters", icon: "folder", url: "#matters" },
  { id: "documents", label: "Documents", icon: "file-lines", url: "#documents" },
  { id: "reports", label: "Reports", icon: "chart-simple", url: "#reports" },
  { id: "settings", label: "Settings", icon: "cog", url: "#settings" },
]

export function AppShell({
  productName = "Saffron Workspace",
  navItems = defaultNav,
  breadcrumbs,
  children,
}: {
  productName?: string
  navItems?: NavItem[]
  breadcrumbs?: Crumb[]
  children: ReactNode
}) {
  const [navState, setNavState] = useState<"open" | "closed">("open")

  return (
    <div className="app-shell">
      <SafProductHeader tasksAriaLabel="Product" globalAriaLabel="Global">
        <SafLogo slot="logo" appearance="1-color-reversed" productName={productName} />
        <div slot="tasks">
          <SafProductHeaderItem>
            <SafButton appearance="tertiary" iconOnly>
              <SafIcon iconName="magnifying-glass" />
              <SafSrOnly>Search</SafSrOnly>
            </SafButton>
          </SafProductHeaderItem>
        </div>
        <div slot="global">
          <SafProductHeaderItem>
            <SafButton appearance="tertiary" iconOnly>
              <SafIcon iconName="circle-question" />
              <SafSrOnly>Help</SafSrOnly>
            </SafButton>
          </SafProductHeaderItem>
          <SafProductHeaderItem>
            <SafButton appearance="tertiary" iconOnly>
              <SafIcon iconName="bell" />
              <SafSrOnly>Notifications</SafSrOnly>
            </SafButton>
          </SafProductHeaderItem>
          <SafProductHeaderItem>
            <SafButton appearance="tertiary" iconOnly>
              <SafIcon iconName="circle-user" />
              <SafSrOnly>User profile</SafSrOnly>
            </SafButton>
          </SafProductHeaderItem>
        </div>
      </SafProductHeader>

      <div className="app-body">
        <SafSideNav
          openAriaLabel="Open side navigation"
          closeAriaLabel="Close side navigation"
          openIconName="arrow-right-from-line"
          closeIconName="arrow-left-from-line"
          state={navState}
          onOpen={() => setNavState("open")}
          onClose={() => setNavState("closed")}
        >
          {navItems.map((item) => (
            <SafMenuItem
              key={item.id}
              id={item.id}
              hasLink
              url={item.url ?? "#"}
              /* Selection is driven by aria-current="page" (NOT `checked`, which
                 is for checkbox/radio menu items). SafMenuItem renders its own
                 native current-item treatment from it — emphasis font and, on
                 versions that support it, background + left indicator bar. Never
                 hand-write the selected styling. */
              aria-current={item.current ? "page" : undefined}
            >
              <SafIcon iconName={item.icon} slot="start" />
              {item.label}
            </SafMenuItem>
          ))}
        </SafSideNav>

        <main className="app-content">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <SafBreadcrumb aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, i) =>
                i < breadcrumbs.length - 1 ? (
                  <SafBreadcrumbItem key={crumb.label} href={crumb.href ?? "#"}>
                    {crumb.label}
                  </SafBreadcrumbItem>
                ) : (
                  <SafBreadcrumbItem key={crumb.label}>{crumb.label}</SafBreadcrumbItem>
                ),
              )}
            </SafBreadcrumb>
          )}
          {children}
        </main>
      </div>

      <SafFooter
        productName={productName}
        a11yAriaLabelAnchorGroup="Footer links"
        a11yAriaLabelSocialIcons="Social links"
      >
        <SafList slot="footer-links" size="medium" listStyle="none" order="unordered" inline>
          <SafListItem>
            <SafAnchor href="#terms">Terms</SafAnchor>
          </SafListItem>
          <SafListItem>
            <SafAnchor href="#privacy">Privacy</SafAnchor>
          </SafListItem>
          <SafListItem>
            <SafAnchor href="#accessibility">Accessibility</SafAnchor>
          </SafListItem>
        </SafList>
      </SafFooter>
    </div>
  )
}
