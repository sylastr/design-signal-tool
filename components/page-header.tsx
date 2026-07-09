"use client"

/**
 * PageHeader — the canonical Saffron page-title region (an organism).
 *
 * Structure (matches the Saffron "page header" spec):
 *   SafBreadcrumb (+ SafBreadcrumbItem)   — location trail (56px bar)
 *   SafAnchor (+ SafIcon)                 — trailing Help link
 *   <h1> + SafText                        — page title (semantics + Saffron type)
 *   SafText                               — metadata / subtitle line
 *   SafTabs (+ SafTab / SafTabPanel)      — in-page section tabs + panels
 *
 * Tab switching uses the canonical FAST pattern: list every SafTab first, then
 * a SafTabPanel per tab in the same order. SafTabs self-manages selection —
 * no controlled state or manual event wiring needed. (A panel-less SafTabs is
 * inert and never fires `change`, so panels are required.)
 *
 * The tab strip and panel are styled via SafTabs shadow parts in globals.css:
 *   ::part(tablist-container) — sits on the header's level-2 surface + rule
 *   ::part(tabpanel)          — transparent + unpadded; content's own SafContainer owns padding
 *
 * Surfaces use --saf-color-background-subtle (#f7f7f7, "level-2") and
 * --saf-color-border-strong (#d2d2d2, "medium") per the design tokens.
 */

import { type ReactNode } from "react"
import {
  SafAnchor,
  SafBreadcrumb,
  SafBreadcrumbItem,
  SafIcon,
  SafTab,
  SafTabPanel,
  SafTabs,
  SafText,
} from "@thomsonreuters/saffron-core-components-prototyping-only/react"

export type Crumb = { label: string; href?: string }
export type PageTab = { id: string; label: string; content?: ReactNode }

export function PageHeader({
  breadcrumbs,
  title,
  metadata,
  helpHref = "#help",
  tabs,
}: {
  breadcrumbs: Crumb[]
  title: string
  metadata?: string
  helpHref?: string
  tabs?: PageTab[]
}) {
  const hasTabs = !!tabs && tabs.length > 0

  return (
    <>
      <header className="page-header">
        <div className="page-header-bar">
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

          <SafAnchor className="page-header-help" href={helpHref}>
            <SafIcon slot="start" iconName="circle-question" />
            Help
          </SafAnchor>
        </div>

        <div className="page-header-titles">
          <h1 className="page-header-title">
            <SafText appearance="heading-3xl">{title}</SafText>
          </h1>
          {metadata && (
            <SafText appearance="body-default-md" className="page-header-meta">
              {metadata}
            </SafText>
          )}
        </div>
      </header>

      {hasTabs && (
        <SafTabs className="page-tabs" orientation="horizontal" activeid={tabs[0].id}>
          {tabs.map((tab) => (
            <SafTab key={tab.id} id={tab.id}>
              {tab.label}
            </SafTab>
          ))}
          {tabs.map((tab) => (
            <SafTabPanel key={tab.id}>{tab.content}</SafTabPanel>
          ))}
        </SafTabs>
      )}
    </>
  )
}
