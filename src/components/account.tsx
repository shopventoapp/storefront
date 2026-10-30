"use client";

import {
  type AccountBooking,
  AccountBookings,
  AccountEventDetail,
  type AccountHelp,
  type AccountLabels,
  AccountLayout,
  type AccountOrder,
  AccountOrderDetail,
  AccountOverview,
  type AccountRoutes,
  AccountSettings,
  AccountState,
  AccountVoucherDetail,
  AccountVouchers,
  accountErrorMessage,
  createAccountClient,
  createDashboardClient,
  type DashboardProps,
  EmailChangeConfirm,
  EmailVerify,
  LoginForm,
  PasswordResetRequest,
  PasswordSetForm,
  profileNewsletterAdapter,
  RegisterForm,
  safeAccountReturnPath,
  useAccountResource,
  useAccountSession,
} from "@shopvento/ui";
import { useEffect, useRef, useState } from "react";
import {
  bookingClient,
  publicHref,
  useBranding,
  usePublicSettings,
} from "./runtime";

const account = createAccountClient();
const dashboard = createDashboardClient();
const newsletter = profileNewsletterAdapter(dashboard, () =>
  account.getProfile(),
);
const routes: AccountRoutes = {
  overview: "/konto",
  bookings: "/konto/buchungen",
  vouchers: "/konto/gutscheine",
  settings: "/konto/einstellungen",
  events: "/events",
  shop: "/shop",
  reserve: "/reservierung",
  passwordSet: "/konto/passwort-setzen",
};
const labels: AccountLabels = {
  event: "Erlebnis",
  events: "Erlebnisse",
  eventVoucher: "Erlebnisgutscheine",
  eventVoucherSingular: "Erlebnisgutschein",
  product: "Produkt",
  products: "Produkte",
  pickup: "Abholung",
  voucherUse: "Gutschein einlösen",
  newsletter: "Neuigkeiten aus dem Atelier",
};

const formRoutes: Record<string, string> = {
  registrieren: "Dein neues Konto",
  "passwort-vergessen": "Passwort vergessen?",
  "passwort-setzen": "Dein neues Passwort",
  "email-bestaetigen": "Deine E-Mail bestätigen",
  "email-aendern": "Deine neue E-Mail bestätigen",
  anmelden: "Dein Konto",
};

export function AccountPage() {
  const [path, setPath] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const consumed = useRef(false);
  const branding = useBranding();
  useEffect(() => {
    const url = new URL(window.location.href);
    setPath(url.pathname.replace(/\/$/, ""));
    if (!consumed.current) {
      consumed.current = true;
      setToken(url.searchParams.get("token"));
      if (url.searchParams.has("token")) {
        url.searchParams.delete("token");
        window.history.replaceState(
          window.history.state,
          "",
          `${url.pathname}${url.search}${url.hash}`,
        );
      }
    }
  }, []);
  if (!path) return <AccountState loading />;
  const kind = path.split("/")[2] ?? "";
  const form = formRoutes[kind];
  if (!form) return <AccountDashboard path={path} />;
  const loginProps = { client: account, loginUrl: "/konto/anmelden" };
  return (
    <section className="account-page">
      <h1>{form}</h1>
      {kind === "anmelden" && <SignIn />}
      {kind === "registrieren" && (
        <RegisterForm
          {...loginProps}
          termsUrl={publicHref(branding.terms_url, "/agb")}
          privacyUrl={publicHref(branding.privacy_url, "/datenschutz")}
        />
      )}
      {kind === "passwort-vergessen" && (
        <PasswordResetRequest {...loginProps} />
      )}
      {kind === "passwort-setzen" && (
        <PasswordSetForm {...loginProps} token={token} accountUrl="/konto" />
      )}
      {kind === "email-bestaetigen" && (
        <EmailVerify {...loginProps} token={token} />
      )}
      {kind === "email-aendern" && (
        <EmailChangeConfirm {...loginProps} token={token} />
      )}
    </section>
  );
}

function SignIn({ notice }: { notice?: string }) {
  return (
    <LoginForm
      client={account}
      registerUrl="/konto/registrieren"
      passwordResetUrl="/konto/passwort-vergessen"
      notice={notice}
      onSuccess={() => {
        const query = new URLSearchParams(window.location.search);
        window.location.assign(
          safeAccountReturnPath(query.get("weiter")) ?? "/konto",
        );
      }}
    />
  );
}

function AccountDashboard({ path }: { path: string }) {
  const session = useAccountSession(account);
  const settings = usePublicSettings();
  const branding = useBranding();
  const [logoutError, setLogoutError] = useState<string>();
  const contact = publicHref(branding.contact_url, "/reservierung");
  const help: AccountHelp = {
    phone: contact.startsWith("tel:") ? contact.slice(4) : "",
    phoneLabel: contact.startsWith("tel:") ? contact.slice(4) : "",
    email: contact.startsWith("mailto:") ? contact.slice(7).split("?")[0] : "",
    address: "",
    routeUrl: publicHref(branding.location_links?.[0]?.href, "/reservierung"),
  };
  if (session.loading) return <AccountState loading />;
  if (!session.profile)
    return (
      <section className="account-page">
        <h1>Schön, dass Du da bist.</h1>
        <p>Hier findest Du Deine Buchungen, Bestellungen und Gutscheine.</p>
        <SignIn notice={session.error ?? undefined} />
      </section>
    );
  const props: DashboardProps = {
    client: dashboard,
    profile: session.profile,
    routes,
    labels,
    help,
  };
  const section = path.split("/")[2] ?? "";
  const id = path.split("/")[3];
  const active =
    section === "buchungen"
      ? "bookings"
      : section === "gutscheine"
        ? "vouchers"
        : section === "einstellungen"
          ? "settings"
          : "overview";
  async function logout() {
    setLogoutError(undefined);
    try {
      await session.logout();
      window.location.assign("/konto/anmelden");
    } catch (error) {
      setLogoutError(accountErrorMessage(error));
    }
  }
  return (
    <section
      className={`account-page${!help.phone && !help.email ? " account-contact-url" : ""}`}
    >
      <style>{`.account-contact-url a[href="tel:"], .account-contact-url a[href="mailto:"], .account-contact-url .card:has(> a[href="tel:"]):has(> a[href="mailto:"]) { display: none; }`}</style>
      <AccountLayout
        profile={session.profile}
        routes={routes}
        help={help}
        active={active}
        onLogout={() => void logout()}
      >
        {logoutError && <p role="alert">{logoutError}</p>}
        {active === "overview" && <AccountOverview {...props} />}
        {active === "bookings" &&
          (id ? (
            <EntryDetail {...props} id={decodeURIComponent(id)} />
          ) : (
            <AccountBookings {...props} />
          ))}
        {active === "vouchers" &&
          (id ? (
            <AccountVoucherDetail {...props} id={decodeURIComponent(id)} />
          ) : (
            <AccountVouchers {...props} />
          ))}
        {active === "settings" &&
          (settings.loading || !settings.data ? (
            <AccountState
              loading={settings.loading}
              error={settings.error}
              retry={settings.reload}
            />
          ) : (
            <AccountSettings
              {...props}
              minimumAge={settings.data.min_customer_age ?? 0}
              countries={settings.data.countries}
              newsletter={newsletter}
              onChanged={session.reload}
              onLogout={() => void logout()}
            />
          ))}
      </AccountLayout>
      {!help.phone && !help.email && (
        <aside className="account-help">
          <h2>Hilfe &amp; Kontakt</h2>
          <p>
            Fragen zu Deiner Buchung oder Bestellung?{" "}
            <a href={contact}>Kontakt aufnehmen</a>
          </p>
        </aside>
      )}
    </section>
  );
}

function EntryDetail(props: DashboardProps & { id: string }) {
  const { id } = props;
  const booking = id.startsWith("t-");
  const reservation = id.startsWith("r-");
  const value = id.replace(/^[otr]-/, "");
  const entry = useAccountResource<AccountBooking | AccountOrder>(
    async (signal) => {
      if (reservation)
        throw new Error(
          "Reservierungsdetails sind im Starter noch nicht verfügbar. Bitte kontaktiere das Team über den Reservierungsbereich.",
        );
      if (booking) return dashboard.booking(value, signal);
      const order = (await dashboard.orders(signal)).find(
        (item) => item.id === value,
      );
      if (!order) throw new Error("Dieser Eintrag ist nicht verfügbar.");
      return order;
    },
    [id],
  );
  const windows = useAccountResource(
    async (signal) => {
      if (!booking) return [];
      const data = await dashboard.booking(value, signal);
      return (
        await bookingClient.listTimewindows(
          data.tasting_id,
          signal,
          data.franchise_location.id ?? undefined,
        )
      ).timewindows;
    },
    [id],
  );
  if (!entry.data || entry.loading || entry.error)
    return (
      <AccountState
        loading={entry.loading}
        error={entry.error}
        retry={entry.reload}
      />
    );
  return booking ? (
    <AccountEventDetail
      {...props}
      booking={entry.data as AccountBooking}
      windows={windows.data ?? []}
      onChanged={entry.reload}
    />
  ) : (
    <AccountOrderDetail
      {...props}
      order={entry.data as AccountOrder}
      onChanged={entry.reload}
    />
  );
}
