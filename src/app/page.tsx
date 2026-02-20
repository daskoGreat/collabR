import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="landing-page">
      <div className="landing-grid" />
      <div className="landing-noise" />

      <main className="landing-content">
        <div className="landing-badge">
          <span className="status-dot online" /> invite only
        </div>

        <h1 className="landing-title">
          <span className="glitch" data-text="collab">collab</span>
        </h1>

        <div className="manifesto">
          <p className="manifesto-line manifesto-lead">
            Det här är inte ännu en plattform.
          </p>
          <p className="manifesto-line">
            Det här är en plats där kunskap delas fritt inte bevakas, inte säljs, inte gatekeepas bakom titlar och prestige.
          </p>
          <p className="manifesto-line">
            Här ställer du frågor utan att be om ursäkt.<br />
            Här hjälper du utan att signalera din senioritet.<br />
            Här finns inga dumma frågor bara dumma svar som ingen vågar ifrågasätta.
          </p>
          <p className="manifesto-line">
            Vi tror inte på hierarkier som tystar.<br />
            Vi tror på att den som delar mest vet mest.<br />
            Vi tror att en junior som vågar fråga driver mer förändring än en senior som håller tyst.
          </p>
          <p className="manifesto-line manifesto-highlight">
            Dela det du kan. Fråga det du inte kan. Bygg det vi inte har.
          </p>
          <p className="manifesto-line manifesto-coda">
            Together we ship. Together we learn. Together we break things and fix them.
          </p>
        </div>

        <div className="landing-cta">
          <Link href="/login" className="btn btn-primary btn-lg">
            enter with invite →
          </Link>
          <p className="text-xs text-muted" style={{ marginTop: "var(--space-4)" }}>
            closed community. you need an invite link to join.
          </p>
        </div>

        <div className="landing-footer">
          <span className="text-xs text-muted">
            ~/collab v1.0 — built by the community, for the community
          </span>
        </div>
      </main>
    </div>
  );
}
