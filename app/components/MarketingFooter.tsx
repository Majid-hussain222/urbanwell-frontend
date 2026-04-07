import Link from "next/link";
import { marketingNav } from "../lib/marketing";

export default function MarketingFooter() {
  return (
    <>
      <footer className="footer">
        <Link href="/" className="brand">
          <div className="icon">U</div>
          <span className="text">
            <em>Urban</em>Well
          </span>
        </Link>

        <p className="copy">© 2026 UrbanWell. All rights reserved.</p>

        <div className="links">
          {marketingNav.slice(1).map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
      </footer>

      <style jsx>{`
        .footer {
          border-top: 1px solid var(--line);
          padding: 44px 24px;
          max-width: 1320px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .icon {
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

        .text {
          color: var(--text);
          font-weight: 800;
          letter-spacing: -0.04em;
        }

        .text em {
          font-style: normal;
          color: var(--lime);
        }

        .copy {
          font-size: 0.85rem;
          color: var(--sub);
        }

        .links {
          display: flex;
          gap: 18px;
          flex-wrap: wrap;
        }

        .links :global(a) {
          color: var(--sub);
          text-decoration: none;
          font-size: 0.9rem;
        }

        .links :global(a:hover) {
          color: var(--text);
        }
      `}</style>
    </>
  );
}