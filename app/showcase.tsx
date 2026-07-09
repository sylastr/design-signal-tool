"use client";
// v0 Design System Showcase Page

import {
  SafActionCard,
  SafActionCardAction,
  SafAlert,
  SafBadge,
  SafButton,
  SafCard,
  SafCheckbox,
  SafContainer,
  SafEmptyState,
  SafIcon,
  SafOption,
  SafSelect,
  SafSwitch,
  SafTable,
  SafText,
  SafTextArea,
  SafTextField,
} from "@thomsonreuters/saffron-core-components-prototyping-only/react";
import type { TextAppearance } from "@thomsonreuters/saffron-core-components-prototyping-only";

import { AppShell } from "@/components/app-shell";
import { PageHeader, type PageTab } from "@/components/page-header";

const typeScale: { label: string; appearance: TextAppearance; sample: string }[] = [
  { label: "display-sm", appearance: "display-sm", sample: "Build with Saffron" },
  { label: "heading-xl", appearance: "heading-xl", sample: "Workspace heading" },
  { label: "heading-md", appearance: "heading-md", sample: "Section heading" },
  { label: "body-default-lg", appearance: "body-default-lg", sample: "Large body copy for intros." },
  { label: "body-default-md", appearance: "body-default-md", sample: "Default body copy used across the UI." },
  { label: "eyebrow-heavy-md", appearance: "eyebrow-heavy-md", sample: "Eyebrow label" },
];

const tasks = [
  { icon: "envelope", title: "Set up Torie & Howe project", detail: "Documents received from Littleton & Associates" },
  { icon: "calendar", title: "Review filing deadlines", detail: "Three matters due this week across two jurisdictions" },
  { icon: "file", title: "Summarize deposition", detail: "Draft a concise summary from the latest transcript" },
  { icon: "file-lines", title: "Draft engagement letter", detail: "Use the standard template for new client intake" },
];

function EmptyPanel({ title, icon, description }: { title: string; icon: string; description: string }) {
  return (
    <SafContainer maxWidth="xl" centered>
      <SafEmptyState isCenter emptyStateTitle={title}>
        <SafIcon slot="icon" size={45} iconName={icon} />
        <p>{description}</p>
      </SafEmptyState>
    </SafContainer>
  );
}

export default function Showcase() {
  const componentsPanel = (
    <SafContainer maxWidth="xl" centered>
      {/* Suggested actions */}
        <section className="section">
          <div className="section-head">
            <SafText appearance="heading-lg">Suggested actions</SafText>
            <SafText appearance="body-default-md" style={{ color: "var(--saf-color-text-subtle)" }}>
              A focused worklist composed from Saffron cards and icons.
            </SafText>
          </div>
          <div className="grid grid-cards">
            {tasks.map((task) => (
              <SafCard key={task.title} appearance="vertical">
                <SafIcon slot="icon" iconName={task.icon} appearance="light" size={32} sizeUnit="px" />
                <div slot="eyebrow">Suggested</div>
                <div slot="heading">{task.title}</div>
                <p>{task.detail}</p>
                <div slot="controls">
                  <SafButton appearance="secondary">Open task</SafButton>
                </div>
              </SafCard>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section className="section">
          <div className="section-head">
            <SafText appearance="heading-lg">Typography</SafText>
            <SafText appearance="body-default-md" style={{ color: "var(--saf-color-text-subtle)" }}>
              Clario for headings, Source Sans 3 for body — set via the Text appearance scale.
            </SafText>
          </div>
          <div className="stack">
            {typeScale.map((t) => (
              <div className="type-row" key={t.label}>
                <SafText appearance="body-default-xs" style={{ color: "var(--saf-color-text-subtle)" }}>
                  {t.label}
                </SafText>
                <SafText appearance={t.appearance}>{t.sample}</SafText>
              </div>
            ))}
          </div>
        </section>

        {/* Feedback & status */}
        <section className="section">
          <div className="section-head">
            <SafText appearance="heading-lg">Feedback &amp; status</SafText>
          </div>
          <div className="stack" style={{ gap: "var(--saf-spacing-4)" }}>
            <SafAlert appearance="informational">New matters were imported from your inbox.</SafAlert>
            <SafAlert appearance="success">Engagement letter sent successfully.</SafAlert>
            <SafAlert appearance="warning">Two filings are approaching their deadline.</SafAlert>
            <SafAlert appearance="error">Filing was rejected by the court clerk.</SafAlert>
            <SafAlert appearance="neutral">Case notes were last synced 5 minutes ago.</SafAlert>
          </div>
          <div className="button-row">
            <SafBadge appearance="success">Active</SafBadge>
            <SafBadge appearance="warning">Pending</SafBadge>
            <SafBadge appearance="error">Overdue</SafBadge>
            <SafBadge appearance="info">In review</SafBadge>
            <SafBadge appearance="neutral">Draft</SafBadge>
          </div>
        </section>

        {/* Data table */}
        <section className="section">
          <div className="section-head">
            <SafText appearance="heading-lg">Data table</SafText>
            <SafText appearance="body-default-md" style={{ color: "var(--saf-color-text-subtle)" }}>
              Tabular data via SafTable — it styles a real semantic table.
            </SafText>
          </div>
          <SafTable density="standard" header-background="subtle">
            <table>
              <caption className="sr-only">Open cases</caption>
              <thead>
                <tr>
                  <th scope="col">Matter</th>
                  <th scope="col">Status</th>
                  <th scope="col">Owner</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: "1", name: "Torie & Howe", status: "Discovery", badge: "info" as const, owner: "J. Okafor" },
                  { id: "2", name: "Acme v. Widget", status: "Filing", badge: "warning" as const, owner: "R. Mehta" },
                  { id: "3", name: "Littleton intake", status: "Active", badge: "success" as const, owner: "S. Cole" },
                ].map((r) => (
                  <tr key={r.id}>
                    <th scope="row">
                      <SafText appearance="body-strong-sm">{r.name}</SafText>
                    </th>
                    <td>
                      <SafBadge appearance={r.badge}>{r.status}</SafBadge>
                    </td>
                    <td>{r.owner}</td>
                    <td className="saf-table-text-right">
                      <SafButton appearance="tertiary" density="compact">
                        View
                      </SafButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SafTable>
        </section>

        {/* Action cards */}
        <section className="section">
          <div className="section-head">
            <SafText appearance="heading-lg">Action cards</SafText>
            <SafText appearance="body-default-md" style={{ color: "var(--saf-color-text-subtle)" }}>
              Whole-card interactions via SafActionCard — not hand-rolled clickable divs.
            </SafText>
          </div>
          <div className="grid grid-cards">
            <SafActionCard>
              <SafActionCardAction mode="a" href="#new-case">
                <SafIcon iconName="sparkles" slot="start" />
                <SafIcon iconName="chevron-right" slot="end" />
                <span slot="heading">Open a new case</span>
                <span slot="description">Start from a template or a blank matter.</span>
              </SafActionCardAction>
            </SafActionCard>
            <SafActionCard>
              <SafActionCardAction mode="a" href="#import">
                <SafIcon iconName="inbox" slot="start" />
                <SafIcon iconName="chevron-right" slot="end" />
                <span slot="heading">Import from inbox</span>
                <span slot="description">Pull in new matters from connected email.</span>
              </SafActionCardAction>
            </SafActionCard>
          </div>
        </section>

        {/* Form */}
        <section className="section">
          <div className="section-head">
            <SafText appearance="heading-lg">New matter</SafText>
            <SafText appearance="body-default-md" style={{ color: "var(--saf-color-text-subtle)" }}>
              Form controls composed with Saffron field components.
            </SafText>
          </div>
          <div className="form-grid">
            <SafTextField label="Client name" placeholder="e.g. Torie & Howe" />
            <SafTextField label="Matter number" placeholder="2026-00481" />
            <SafSelect className="span-2" label="Practice area">
              <SafOption value="litigation">Litigation</SafOption>
              <SafOption value="corporate">Corporate</SafOption>
              <SafOption value="ip">Intellectual property</SafOption>
            </SafSelect>
            <SafTextArea className="span-2" label="Notes" placeholder="Add context for this matter" />
            <SafCheckbox>Notify the assigned team</SafCheckbox>
            <SafSwitch>Track time automatically</SafSwitch>
          </div>
          <div className="button-row">
            <SafButton appearance="primary">Create matter</SafButton>
            <SafButton appearance="tertiary">Cancel</SafButton>
          </div>
        </section>
      </SafContainer>
  );

  const tabs: PageTab[] = [
    { id: "components", label: "Components", content: componentsPanel },
    {
      id: "guidelines",
      label: "Guidelines",
      content: (
        <EmptyPanel
          title="Guidelines coming soon"
          icon="book-open"
          description="Usage guidance and do/don't examples for each component will live here."
        />
      ),
    },
    {
      id: "changelog",
      label: "Changelog",
      content: (
        <EmptyPanel
          title="No changelog entries yet"
          icon="clock-rotate-left"
          description="Version history and component updates will be tracked here."
        />
      ),
    },
  ];

  return (
    <AppShell
      productName="Saffron Design System"
      navItems={[
        { id: "components", label: "Component library", icon: "grid", url: "#components", current: true },
        { id: "dashboard", label: "Dashboard", icon: "objects-column", url: "#dashboard" },
        { id: "matters", label: "Matters", icon: "folder", url: "#matters" },
        { id: "documents", label: "Documents", icon: "file-lines", url: "#documents" },
        { id: "reports", label: "Reports", icon: "chart-simple", url: "#reports" },
        { id: "settings", label: "Settings", icon: "cog", url: "#settings" },
      ]}
    >
      <PageHeader
        breadcrumbs={[{ label: "Home", href: "#home" }, { label: "Component library" }]}
        title="Saffron component library"
        metadata="Buttons, forms, navigation, data display, and feedback — composed inside the Saffron app shell."
        tabs={tabs}
      />
    </AppShell>
  );
}
