export function indexPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <link rel="stylesheet" href="https://unpkg.com/mvp.css"/>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>FigCuts — Share Laser Cut Files from Figma</title>
  <meta name="description" content="Export SVG laser cut files from Figma and share them via a simple link. Files auto-expire in 24 hours."/>
  <style>
    h1 { font-style: italic; }
    code { font-size: 0.85rem; }
  </style>
</head>
<body>
  <header>
    <nav>
      <a href="/"><b><i>FigCNC</i></b></a>
    </nav>
    <h1>Share Laser Cut Files from Figma</h1>
    <p>Export your Figma designs as laser-ready SVGs and share them with a simple link.<br/>
    No account needed. Files auto-expire in 24 hours.</p>
    <br/>
    <p>
      <a href="https://www.figma.com/community/plugin/1539858013511152976"><b>Get the Plugin</b></a>
    </p>
  </header>

  <main>
    <hr/>
    <section>
      <header>
        <h2>How it Works</h2>
        <p>Three steps — from Figma frame to shareable laser file</p>
      </header>
      <aside>
        <h3>1. Select &amp; Export</h3>
        <p>Select any frame in Figma and open the FigCuts plugin. Hit <b>Get Share Link</b> to export a laser-ready SVG with corrected DPI dimensions.</p>
      </aside>
      <aside>
        <h3>2. Share the Link</h3>
        <p>A unique room link is generated. Send it to your makerspace, teammate, or laser cutter operator — no login required on their end.</p>
        <code>figcuts.deno.dev/room/amber-frost-cedar</code>
      </aside>
      <aside>
        <h3>3. Download &amp; Cut</h3>
        <p>The recipient opens the link, sees all uploaded SVGs, and can download or send directly to print. Done.</p>
      </aside>
    </section>
    <hr/>
    <article>
      <h2>Why FigCuts?</h2>
      <p>Figma is a great design tool, but getting files to a laser cutter is always a few too many steps.
      FigCuts bridges that gap — correct DPI scaling, clean SVG output, and a shareable URL in one click.</p>
      <ul>
        <li>Corrects Figma's 72 DPI → 96 DPI for laser cutter importers</li>
        <li>Outputs real-world millimeter dimensions</li>
        <li>Ephemeral by design — files expire after 24 hours</li>
        <li>Works with Easel, LightBurn, and any SVG-compatible cutter</li>
      </ul>
      <div>
        <details>
          <summary>What laser cutters does this work with?</summary>
          <p>Any cutter that accepts SVG files — Glowforge, xTool, Dremel Digilab, Epilog, and more.
          The exported SVG includes proper mm dimensions so your design imports at the correct size.</p>
        </details>
        <details>
          <summary>Do files stay forever?</summary>
          <p>No. Files are automatically deleted 24 hours after upload. This keeps rooms ephemeral and storage lean.
          Download your files before the link expires.</p>
        </details>
        <details>
          <summary>Can I reuse the same room?</summary>
          <p>Yes. The plugin remembers your room ID per Figma file. Each time you click <b>Get Share Link</b>,
          it uploads to the same room. Hit the refresh icon to generate a fresh room.</p>
        </details>
        <details>
          <summary>Is it free?</summary>
          <p>Yes, completely free. The plugin and the sharing service are free to use.</p>
        </details>
      </div>
    </article>
    <hr/>
  </main>

  <footer>
    <hr/>
    <small>FigCuts — ephemeral laser cut file sharing</small>
  </footer>
</body>
</html>`;
}
