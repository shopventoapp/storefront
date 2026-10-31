"use client";

import {
  type AccountBooking,
  AccountBookings,
  AccountEventDetail,
  type AccountHelp,
  AccountLayout,
  type AccountOrder,
  AccountOrderDetail,
  AccountOverview,
  type AccountReservation,
  AccountReservationDetail,
  type AccountRoutes,
  AccountSettings,
  AccountState,
  AccountVoucherDetail,
  AccountVouchers,
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
import { englishAccountLabels, englishAccountNotice } from "@/lib/ui-english";
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
const formRoutes: Record<string, string> = {
  registrieren: "Create your account",
  "passwort-vergessen": "Forgot your password?",
  "passwort-setzen": "Your new password",
  "email-bestaetigen": "Confirm your email",
  "email-aendern": "Confirm your new email",
  anmelden: "Your account",
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
  if (!path) return <AccountLoading />;
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
    ...(contact.startsWith("tel:") ? { phone: contact.slice(4) } : {}),
    ...(contact.startsWith("mailto:")
      ? { email: contact.slice(7).split("?")[0] }
      : {}),
    company: branding.company,
    address: "",
    routeUrl: publicHref(branding.location_links?.[0]?.href, "/reservierung"),
  };
  if (session.loading) return <AccountLoading />;
  if (!session.profile)
    return (
      <section className="account-page">
        <h1>Good to see you.</h1>
        <p>Find your bookings, orders and vouchers here.</p>
        <SignIn notice={session.error ? englishAccountNotice : undefined} />
      </section>
    );
  const props: DashboardProps = {
    client: dashboard,
    profile: session.profile,
    routes,
    labels: englishAccountLabels,
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
    } catch {
      setLogoutError("We could not sign you out. Please try again.");
    }
  }
  return (
    <section className="account-page">
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
          (settings.loading ? (
            <AccountLoading />
          ) : !settings.data ? (
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
    </section>
  );
}

function EntryDetail(props: DashboardProps & { id: string }) {
  const { id } = props;
  const booking = id.startsWith("t-");
  const reservation = id.startsWith("r-");
  const value = id.replace(/^[otr]-/, "");
  const entry = useAccountResource<
    AccountBooking | AccountOrder | AccountReservation
  >(
    async (signal) => {
      if (reservation) return dashboard.reservation(Number(value), signal);
      if (booking) return dashboard.booking(value, signal);
      const order = (await dashboard.orders(signal)).find(
        (item) => item.id === value,
      );
      if (!order) throw new Error("This entry is unavailable.");
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
  if (entry.loading) return <AccountLoading />;
  if (!entry.data || entry.error)
    return (
      <AccountState
        loading={entry.loading}
        error={entry.error}
        retry={entry.reload}
      />
    );
  return reservation ? (
    <AccountReservationDetail
      {...props}
      reservation={entry.data as AccountReservation}
    />
  ) : booking ? (
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

function AccountLoading() {
  return (
    <p className="state" role="status">
      Loading your account …
    </p>
  );
}
