"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { marketingNav } from "../lib/marketing";

export default function MarketingHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const syncAuth = () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
    };

    setMounted(true);
    syncAuth();

    window.addEventListener("storage", syncAuth);
    window.addEventListener("urbanwell-auth-changed", syncAuth as EventListener);

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("urbanwell-auth-changed", syncAuth as EventListener);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("urbanwell-auth-changed"));
    router.push("/");
  };

  const brandHref = mounted && isLoggedIn ? "/dashboard" : "/";

  return (
    <>
      <header className="uwHeader">
        <div className="uwHeaderInner">
          <Link href={brandHref} className="uwBrand">
            <div className="uwBrandIcon">U</div>
            <span className="uwBrandText">
              <em>Urban</em>Well
            </span>
          </Link>

          <nav className="uwNav">
            {marketingNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`uwNavLink ${pathname === item.href ? "active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="uwActions">
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="uwGhostBtn">
                  Dashboard
                </Link>
                <Link href="/profile" className="uwGhostBtn">
                  Profile
                </Link>
                <button onClick={handleLogout} className="uwCtaBtn">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="uwGhostBtn">
                  Log in
                </Link>
                <Link href="/signup" className="uwCtaBtn">
                  Get Started →
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <style jsx>{`
        .uwHeader {
          position: sticky;
          top: 0;
          z-index: 1000;
          backdrop-filter: blur(24px) saturate(180%);
          background: rgba(3, 5, 10, 0.75);
          border-bottom: 1px solid rgba(0, 212, 255, 0.08);
        }

        .uwHeaderInner {
          max-width: 1320px;
          margin: 0 auto;
          min-height: 76px;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .uwBrand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          flex-shrink: 0;
        }

        .uwBrandIcon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          color: #000;
          background: linear-gradient(135deg, var(--lime), var(--cyan));
        }

        .uwBrandText {
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.04em;
        }

        .uwBrandText em {
          font-style: normal;
          color: var(--lime);
        }

        .uwNav {
          display: flex;
          gap: 8px;
          padding: 5px;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: rgba(255, 255, 255, 0.03);
          overflow-x: auto;
          scrollbar-width: none;
        }

        .uwNav::-webkit-scrollbar {
          display: none;
        }

        .uwNavLink {
          padding: 10px 16px;
          border-radius: 999px;
          text-decoration: none;
          color: var(--sub);
          font-size: 0.92rem;
          font-weight: 600;
          white-space: nowrap;
          transition: 0.2s ease;
        }

        .uwNavLink:hover {
          color: var(--text);
          background: rgba(255, 255, 255, 0.05);
        }

        .uwNavLink.active {
          color: #000;
          background: var(--lime);
          box-shadow: 0 0 20px rgba(198, 241, 53, 0.22);
        }

        .uwActions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .uwGhostBtn,
        .uwCtaBtn {
          height: 42px;
          padding: 0 16px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 700;
          transition: 0.2s ease;
          border: none;
          cursor: pointer;
        }

        .uwGhostBtn {
          color: var(--text);
          border: 1px solid var(--line);
          background: transparent;
        }

        .uwGhostBtn:hover {
          background: rgba(255, 255, 255, 0.04);
        }

        .uwCtaBtn {
          color: #000;
          background: var(--lime);
          box-shadow: 0 0 24px rgba(198, 241, 53, 0.2);
        }

        @media (max-width: 1100px) {
          .uwHeaderInner {
            flex-wrap: wrap;
            padding: 12px 16px;
          }

          .uwNav {
            order: 3;
            width: 100%;
          }
        }

        @media (max-width: 720px) {
          .uwActions {
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>
    </>
  );
}