import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { AppIcon } from "../common/AppIcon";
import { Button } from "../common/Button";
import { COUNTRY_CURRENCIES } from "../../constants/currencies";
import { useAuth } from "../../hooks/useAuth";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage";

const Layout = styled.div`
  display: grid;
  min-width: 0;
  min-height: 100vh;
  grid-template-columns: 236px minmax(0, 1fr);
  background: var(--color-background);

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const Sidebar = styled.aside`
  position: sticky;
  top: 0;
  display: flex;
  height: 100vh;
  flex-direction: column;
  padding: var(--space-5) var(--space-4);
  border-right: 1px solid var(--color-border);
  background: var(--color-surface);

  @media (max-width: 860px) {
    position: static;
    min-width: 0;
    width: 100%;
    max-width: 100vw;
    height: auto;
    overflow: hidden;
    padding: var(--space-4);
    border-right: 0;
    border-bottom: 1px solid var(--color-border);
  }
`;

const Brand = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 0 var(--space-2) var(--space-6);
  color: var(--color-text);
  font-weight: 750;
  text-decoration: none;

  @media (max-width: 860px) {
    padding-bottom: var(--space-4);
  }
`;

const BrandMark = styled.span`
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  place-items: center;
  border-radius: var(--radius-lg);
  background: linear-gradient(145deg, var(--color-primary-500), var(--color-primary-700));
  color: #ffffff;
  font-size: var(--font-size-lg);
`;

const Navigation = styled.nav`
  display: grid;
  gap: var(--space-1);

  @media (max-width: 860px) {
    display: flex;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    overflow-x: auto;
    padding-bottom: var(--space-1);
  }
`;

const NavigationLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 0.68rem 0.75rem;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-decoration: none;
  transition:
    background 150ms ease,
    color 150ms ease;

  &:hover {
    background: var(--color-surface-subtle);
    color: var(--color-text);
  }

  &.active {
    background: var(--color-primary-50);
    color: var(--color-primary-700);
    box-shadow: inset 3px 0 0 var(--color-primary-500);
  }

  @media (max-width: 860px) {
    flex: 0 0 auto;
  }
`;

const NavigationIcon = styled.span`
  display: grid;
  width: 1.5rem;
  height: 1.5rem;
  place-items: center;
  border-radius: var(--radius-sm);
  background: var(--color-primary-100);
  color: var(--color-primary-700);
  font-size: 0.65rem;
  font-weight: 800;
`;

const UserArea = styled.div`
  display: grid;
  gap: var(--space-4);
  margin-top: auto;
  padding: var(--space-5) var(--space-2) 0;
  border-top: 1px solid var(--color-border);

  @media (max-width: 860px) {
    display: grid;
    margin-top: var(--space-4);
    padding-top: var(--space-4);
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    gap: var(--space-3);
  }
`;

const PreferenceField = styled.div`
  display: grid;
  gap: var(--space-2);

  label {
    color: var(--color-text-muted);
    font-size: var(--font-size-xs);
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  @media (max-width: 860px) {
    min-width: 0;
  }
`;

const CountrySelect = styled.select`
  width: 100%;
  min-height: 2.5rem;
  padding: 0.55rem 2rem 0.55rem 0.7rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  outline: none;
  background-color: var(--color-surface);
  color: var(--color-text);
  font-size: var(--font-size-sm);

  &:focus {
    border-color: var(--color-primary-500);
    box-shadow: var(--focus-ring);
  }

  &:disabled {
    opacity: 0.7;
  }
`;

const CurrencyHint = styled.p`
  margin: 0;
  color: var(--color-text-subtle);
  font-size: var(--font-size-xs);

  @media (max-width: 860px) {
    display: none;
  }
`;

const UserDetails = styled.div`
  display: grid;
  min-width: 0;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: var(--space-3);

  @media (max-width: 860px) {
    display: none;
  }
`;

const MobileLogout = styled.div`
  display: none;

  @media (max-width: 860px) {
    display: block;
  }
`;

const DesktopLogout = styled.div`
  @media (max-width: 860px) {
    display: none;
  }
`;

const UserAvatar = styled.div`
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  place-items: center;
  border-radius: var(--radius-full);
  background: var(--color-primary-100);
  color: var(--color-primary-700);
  font-weight: 750;
`;

const UserName = styled.p`
  overflow: hidden;
  margin: 0;
  color: var(--color-text);
  font-size: var(--font-size-sm);
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const UserEmail = styled.p`
  overflow: hidden;
  margin: 0;
  color: var(--color-text-subtle);
  font-size: var(--font-size-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Main = styled.div`
  min-width: 0;
  padding: var(--space-8);

  @media (max-width: 860px) {
    padding: var(--space-6);
  }

  @media (max-width: 520px) {
    padding: var(--space-5) var(--space-4);
  }
`;

const Content = styled.div`
  width: min(100%, 1280px);
  min-width: 0;
  margin-inline: auto;
`;

const navigationItems = [
  { label: "Overview", path: "/dashboard", icon: "overview" as const, end: true },
  {
    label: "Plans",
    path: "/dashboard/plans",
    icon: "plans" as const,
    end: false,
  },
  {
    label: "Actuals",
    path: "/dashboard/actuals",
    icon: "actuals" as const,
    end: false,
  },
  {
    label: "Report",
    path: "/dashboard/report",
    icon: "report" as const,
    end: false,
  },
  {
    label: "Period Locks",
    path: "/dashboard/period-locks",
    icon: "lock" as const,
    end: false,
  },
  {
    label: "Categories",
    path: "/dashboard/categories",
    icon: "categories" as const,
    end: false,
  },
];

export function DashboardLayout() {
  const navigate = useNavigate();
  const { logout, updatePreferences, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUpdatingCurrency, setIsUpdatingCurrency] = useState(false);
  const [preferenceError, setPreferenceError] = useState("");

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleCountryChange = async (countryCode: string) => {
    if (!user || countryCode === user.countryCode) return;

    try {
      setIsUpdatingCurrency(true);
      setPreferenceError("");
      await updatePreferences({ countryCode });
    } catch (error) {
      setPreferenceError(
        getApiErrorMessage(error, "Unable to update currency preference."),
      );
    } finally {
      setIsUpdatingCurrency(false);
    }
  };

  return (
    <Layout>
      <Sidebar>
        <Brand to="/dashboard">
          <BrandMark><AppIcon name="brand" size={20} /></BrandMark>
          Plan vs Actual
        </Brand>

        <Navigation aria-label="Dashboard navigation">
          {navigationItems.map((item) => (
            <NavigationLink key={item.path} to={item.path} end={item.end}>
              <NavigationIcon aria-hidden="true">
                <AppIcon name={item.icon} size={15} />
              </NavigationIcon>
              {item.label}
            </NavigationLink>
          ))}
        </Navigation>

        <UserArea>
          <PreferenceField>
            <label htmlFor="country-currency">Country / currency</label>
            <CountrySelect
              id="country-currency"
              value={user?.countryCode ?? "US"}
              disabled={isUpdatingCurrency || isLoggingOut}
              onChange={(event) => void handleCountryChange(event.target.value)}
            >
              {COUNTRY_CURRENCIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name} ({country.currency})
                </option>
              ))}
            </CountrySelect>
            <CurrencyHint>
              {isUpdatingCurrency
                ? "Updating..."
                : preferenceError ||
                  `${user?.currencyName ?? "US Dollar"} · ${user?.currency ?? "USD"}`}
            </CurrencyHint>
          </PreferenceField>

          <UserDetails>
            <UserAvatar><AppIcon name="user" size={17} /></UserAvatar>
            <div>
              <UserName>{user?.name}</UserName>
              <UserEmail>{user?.email}</UserEmail>
            </div>
          </UserDetails>

          <DesktopLogout>
            <Button
              variant="secondary"
              fullWidth
              disabled={isLoggingOut}
              onClick={() => void handleLogout()}
            >
              {isLoggingOut ? "Signing out..." : "Sign out"}
            </Button>
          </DesktopLogout>

          <MobileLogout>
            <Button
              variant="secondary"
              disabled={isLoggingOut}
              onClick={() => void handleLogout()}
            >
              {isLoggingOut ? "..." : "Sign out"}
            </Button>
          </MobileLogout>
        </UserArea>
      </Sidebar>

      <Main>
        <Content>
          <Outlet />
        </Content>
      </Main>
    </Layout>
  );
}
