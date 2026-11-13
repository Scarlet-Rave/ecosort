import { useEffect, useRef, useState } from "react";
import { Button, EmptyIllustration, Icon, MaterialArt, Notice } from "./components";
import type { Material } from "./materials";
import {
  classifyImage,
  loadCatalog,
  validateImage,
  type Catalog,
  type Prediction,
} from "./classification";

type Page = "Classify" | "Sorting Guide" | "About EcoSort";

export default function App() {
  const [page, setPage] = useState<Page>("Classify");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [catalogError, setCatalogError] = useState("");
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const materials = catalog?.materials ?? [];
  const [result, setResult] = useState<Prediction | null>(null);
  const [scoresExpanded, setScoresExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState<Material | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const request = useRef(0);
  const activeRequest = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLElement>(null);
  const guideRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    setCatalogError("");
    void loadCatalog(controller.signal)
      .then(setCatalog)
      .catch((failure: unknown) => {
        if (!controller.signal.aborted)
          setCatalogError(
            failure instanceof Error
              ? failure.message
              : "Sorting guidance is unavailable. Please try again.",
          );
      });
    return () => controller.abort();
  }, [catalogAttempt]);

  useEffect(() => () => activeRequest.current?.abort(), []);

  useEffect(() => {
    if (selected) {
      guideRef.current?.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        block: "nearest",
      });
    }
  }, [selected]);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function reset() {
    request.current++;
    activeRequest.current?.abort();
    activeRequest.current = null;
    setFile(null);
    setPreview("");
    setResult(null);
    setScoresExpanded(false);
    setError("");
    setBusy(false);
    if (input.current) input.current.value = "";
  }

  function navigate(next: Page) {
    setPage(next);
    setSelected(null);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  async function acceptFile(next?: File) {
    if (!next) return;
    reset();
    const invalid = validateImage(next, catalog?.maxUploadBytes);
    if (invalid) {
      setError(invalid);
      return;
    }
    const id = request.current;
    const url = URL.createObjectURL(next);
    try {
      await new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          if (image.naturalWidth * image.naturalHeight > (catalog?.maxImagePixels ?? 20_000_000))
            reject(new Error("large"));
          else resolve();
        };
        image.onerror = () => reject(new Error("decode"));
        image.src = url;
      });
      if (id === request.current) setFile(next);
    } catch (failure) {
      if (id === request.current)
        setError(
          failure instanceof Error && failure.message === "large"
            ? "This image is too large. Resize it to 20 megapixels or less."
            : "We couldn’t open that image. Please try another JPG or PNG photo.",
        );
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function classify() {
    if (!file || busy || !catalog) return;
    const id = ++request.current;
    const controller = new AbortController();
    activeRequest.current = controller;
    setBusy(true);
    setResult(null);
    setError("");
    try {
      const prediction = await classifyImage(file, controller.signal);
      if (id !== request.current) return;
      setResult(prediction);
      if (window.innerWidth < 760)
        resultRef.current?.scrollIntoView({
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
          block: "center",
        });
    } catch (failure) {
      if (id === request.current)
        setError(
          failure instanceof Error
            ? failure.message
            : "We couldn’t classify this image. Please try again or choose another photo.",
        );
    } finally {
      if (id === request.current) {
        setBusy(false);
        activeRequest.current = null;
      }
    }
  }

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="header">
        <div className="header-inner">
          <button className="brand" onClick={() => navigate("Classify")} aria-label="EcoSort home">
            <span className="brand-icon">
              <Icon name="leaf" size={25} />
            </span>
            <span>
              Eco<span className="brand-light">Sort</span>
              <span className="brand-dot">.</span>
            </span>
          </button>
          <nav aria-label="Main navigation">
            {(["Classify", "Sorting Guide", "About EcoSort"] as Page[]).map((item) => (
              <button
                key={item}
                className={`nav-link ${page === item ? "active" : ""}`}
                onClick={() => navigate(item)}
                aria-current={page === item ? "page" : undefined}
              >
                {item === "Classify" && <Icon name="scan" size={17} />}
                {item}
              </button>
            ))}
          </nav>
          <span className="header-tag">
            <span /> A little action. A greener future.
          </span>
        </div>
      </header>

      <main id="main" className="main">
        {catalogError && (
          <Notice warning>
            {catalogError}{" "}
            <button className="text-link" onClick={() => setCatalogAttempt((value) => value + 1)}>
              Try again
            </button>
          </Notice>
        )}
        {!catalog && !catalogError && (
          <p className="subtle" role="status">
            Loading sorting guidance…
          </p>
        )}
        {page === "Classify" && (
          <>
            <section className="welcome">
              <div className="welcome-copy">
                <div className="eyebrow">
                  <span className="tiny-leaf">
                    <Icon name="leaf" size={13} />
                  </span>{" "}
                  A SMALL STEP TOWARD LESS WASTE
                </div>
                <h1>
                  Sort smarter.
                  <br />
                  Make a <span>difference.</span>
                </h1>
                <p>
                  One photo. A clearer idea of where it belongs.
                  <br className="desktop-break" /> Identify your waste and take the next right step.
                </p>
              </div>
              <div className="hero-art" aria-hidden="true">
                <div className="orbit orbit-one" />
                <div className="orbit orbit-two" />
                <div className="hero-center">
                  <Icon name="leaf" size={58} />
                </div>
                <span className="orbit-item orbit-plastic">
                  <Icon name="plastic" size={30} />
                </span>
                <span className="orbit-item orbit-box">
                  <Icon name="cardboard" size={31} />
                </span>
                <span className="orbit-item orbit-paper">
                  <Icon name="paper" size={27} />
                </span>
                <span className="hero-star star-one">+</span>
                <span className="hero-star star-two">+</span>
                <span className="hero-caption">Better sorting starts with you.</span>
              </div>
            </section>

            <div className="workflow-heading">
              <div>
                <h2>A better sort starts here</h2>
                <p>Choose a photo of one item. We’ll help with the rest.</p>
              </div>
              <span className="private-note">
                <Icon name="shield" size={15} /> Your photo is not saved
              </span>
            </div>
            <div className="workspace">
              <section className="panel upload-panel" aria-labelledby="upload-heading">
                <div className="panel-heading">
                  <div className="step-title">
                    <span className="step">01</span>
                    <h3 id="upload-heading">Add your photo</h3>
                  </div>
                  <span className="subtle">JPG or PNG</span>
                </div>
                <input
                  ref={input}
                  type="file"
                  disabled={!catalog}
                  tabIndex={-1}
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  aria-label="Choose a waste image"
                  className="sr-only"
                  onChange={(event) => void acceptFile(event.target.files?.[0])}
                />
                {preview ? (
                  <div className="preview-container">
                    <img
                      className="image-preview"
                      src={preview}
                      alt={`Uploaded waste item: ${file?.name}`}
                    />
                    <span className="preview-badge">Your photo</span>
                    <button className="remove-button" aria-label="Remove image" onClick={reset}>
                      <Icon name="close" size={17} />
                    </button>
                    <div className="preview-bottom">
                      <span>{file?.name}</span>
                      <button onClick={() => input.current?.click()}>
                        <Icon name="refresh" size={14} /> Replace
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className={`upload-zone ${dragging ? "is-dragging" : ""}`}
                    disabled={!catalog}
                    onClick={() => input.current?.click()}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDragging(false);
                      void acceptFile(event.dataTransfer.files[0]);
                    }}
                  >
                    <span className="upload-icon">
                      <Icon name="upload" size={28} />
                      <span className="icon-spark">
                        <Icon name="spark" size={13} />
                      </span>
                    </span>
                    <strong>{dragging ? "Drop your photo here" : "Upload a waste image"}</strong>
                    <span>
                      Drag and drop your photo here, or{" "}
                      <span className="browse-link">browse files</span>
                    </span>
                    <small>One item, well lit, with a clear background.</small>
                  </button>
                )}
                {error && <Notice warning>{error}</Notice>}
                <Button
                  className="classify-button"
                  disabled={!file || busy || !catalog}
                  onClick={() => void classify()}
                >
                  {busy ? (
                    <>
                      <span className="spinner" /> Looking at your item…
                    </>
                  ) : (
                    <>
                      <Icon name="scan" size={19} /> Classify waste <Icon name="arrow" size={18} />
                    </>
                  )}
                </Button>
                <p className="sample-disclosure">
                  <Icon name="info" size={13} /> JPG, JPEG or PNG · Up to 10 MB · 20 megapixels
                </p>
              </section>

              <section
                className={`panel result-panel ${result ? "has-result" : ""}`}
                ref={resultRef}
                aria-labelledby="result-heading"
                aria-live="polite"
                aria-busy={busy}
              >
                <div className="panel-heading">
                  <div className="step-title">
                    <span className="step">02</span>
                    <h3 id="result-heading">Your sorting guidance</h3>
                  </div>
                  {result ? (
                    <span className="result-status">
                      <Icon name="check" size={12} /> Ready
                    </span>
                  ) : (
                    <Icon name="spark" size={17} className="muted-icon" />
                  )}
                </div>
                {result ? (
                  <Result
                    result={result}
                    scoresExpanded={scoresExpanded}
                    onScoresExpandedChange={setScoresExpanded}
                  />
                ) : (
                  <div className="result-empty">
                    {busy ? (
                      <div className="processing-art">
                        <Icon name="scan" size={49} />
                        <span />
                      </div>
                    ) : (
                      <EmptyIllustration />
                    )}
                    <h3>
                      {busy
                        ? "A little clarity is on the way"
                        : "A little clarity. A better choice."}
                    </h3>
                    <p>
                      {busy ? (
                        "Identifying the material and preparing your sorting guidance."
                      ) : (
                        <>
                          Your result and practical sorting tips
                          <br />
                          will appear here once you classify an item.
                        </>
                      )}
                    </p>
                    <span className="empty-caption">
                      <Icon name={busy ? "info" : "leaf"} size={14} />
                      {busy
                        ? "Use as a guide. Check locally."
                        : "Less guesswork. More good habits."}
                    </span>
                  </div>
                )}
              </section>
            </div>
            <section className="materials-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow dark-eyebrow">SIX MATERIALS. A SMARTER START.</span>
                  <h2>A place for every material.</h2>
                </div>
                <button className="text-link" onClick={() => navigate("Sorting Guide")}>
                  Explore the sorting guide <Icon name="arrow" size={17} />
                </button>
              </div>
              <div className="material-strip">
                {materials.map((material) => (
                  <button
                    key={material.name}
                    className="material-tile"
                    onClick={() => {
                      navigate("Sorting Guide");
                      setSelected(material);
                    }}
                  >
                    <MaterialArt type={material.icon} />
                    <strong>{material.name}</strong>
                    <Icon name="arrow" size={14} className="tile-arrow" />
                  </button>
                ))}
              </div>
            </section>
            <div className="local-reminder">
              <span className="reminder-icon">
                <Icon name="info" size={19} />
              </span>
              <p>
                <strong>A material match is just the first step.</strong> Recycling rules vary by
                location. Always check what your local service accepts.
              </p>
              <Icon name="leaf" size={26} />
            </div>
          </>
        )}

        {page === "Sorting Guide" && (
          <>
            <PageIntro
              label="A LITTLE KNOW-HOW GOES A LONG WAY"
              title={
                <>
                  Know where your
                  <br />
                  waste <em>belongs.</em>
                </>
              }
              description="Explore common materials and simple sorting tips."
            />
            <div className="guide-toolbar">
              <h2>Find your material</h2>
              <span className="subtle">6 everyday categories</span>
            </div>
            <div className="guide-grid">
              {materials.map((material) => (
                <button
                  key={material.name}
                  className={`guide-card ${selected?.name === material.name ? "selected" : ""}`}
                  onClick={() => setSelected(selected?.name === material.name ? null : material)}
                  aria-expanded={selected?.name === material.name}
                >
                  <MaterialArt type={material.icon} large />
                  <h3>{material.name}</h3>
                  <p>{material.description}</p>
                  <span className="guide-card-link">
                    How to sort it <Icon name="arrow" size={17} />
                  </span>
                </button>
              ))}
            </div>
            {selected && (
              <section className="guide-detail" ref={guideRef} aria-live="polite">
                <div className="guide-detail-heading">
                  <MaterialArt type={selected.icon} />
                  <div>
                    <span className="eyebrow dark-eyebrow">YOUR SORTING GUIDE</span>
                    <h2>{selected.name}</h2>
                  </div>
                  <button
                    className="icon-button"
                    onClick={() => setSelected(null)}
                    aria-label="Close material guidance"
                  >
                    <Icon name="close" />
                  </button>
                </div>
                <p>{selected.action}</p>
                <Guidance material={selected} />
                <Notice warning>{selected.caution}</Notice>
              </section>
            )}
            <div className="local-reminder">
              <Icon name="info" />
              <p>
                <strong>Local rules come first.</strong> {catalog?.localRule}
              </p>
            </div>
          </>
        )}

        {page === "About EcoSort" && (
          <About catalog={catalog} onClassify={() => navigate("Classify")} />
        )}
      </main>
      <footer className="footer">
        <div>
          <span className="footer-brand">
            <Icon name="leaf" size={18} /> EcoSort
          </span>
          <span>Better choices, one item at a time.</span>
        </div>
        <span>
          Made for a more mindful tomorrow <span className="footer-dot">·</span>{" "}
          <button onClick={() => navigate("About EcoSort")}>
            About EcoSort <Icon name="arrow" size={13} />
          </button>
        </span>
      </footer>
    </div>
  );
}

function PageIntro({
  label,
  title,
  description,
}: {
  label: string;
  title: React.ReactNode;
  description: string;
}) {
  return (
    <section className="page-intro">
      <span className="eyebrow dark-eyebrow">
        <Icon name="leaf" size={14} />
        {label}
      </span>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
}

function Guidance({ material }: { material: Material }) {
  return (
    <ol className="guidance-steps">
      {material.steps.map((step, i) => (
        <li key={step}>
          <span>{i + 1}</span>
          {step}
        </li>
      ))}
    </ol>
  );
}

function Result({
  result,
  scoresExpanded,
  onScoresExpandedChange,
}: {
  result: Prediction;
  scoresExpanded: boolean;
  onScoresExpandedChange: (expanded: boolean) => void;
}) {
  const material = result.guidance;
  const score = result.score * 100;
  const uncertain = result.needsReview;
  return (
    <div className="result-content">
      <div className="sample-label">
        <Icon name="info" size={13} /> {result.scoreNote}
      </div>
      <div className="identified">
        <MaterialArt type={material.icon} />
        <div>
          <span className="subtle">Suggested material</span>
          <h2>{material.name}</h2>
        </div>
        <div className="model-score">
          <strong>
            {score.toFixed(1)}
            <small>%</small>
          </strong>
          <span>Model score</span>
        </div>
      </div>
      {uncertain && (
        <Notice warning>
          <strong>Please double-check this result.</strong>
          <p>The image may be unclear. Try another photo or check the material manually.</p>
        </Notice>
      )}
      <div className="sorting-title">
        <Icon name="leaf" size={16} />
        <h3>{material.action}</h3>
      </div>
      <Guidance material={material} />
      <Notice warning>{material.caution}</Notice>
      <details
        className="score-details"
        open={scoresExpanded}
        onToggle={(event) => onScoresExpandedChange(event.currentTarget.open)}
      >
        <summary>
          View all category scores <Icon name="chevron" size={17} />
        </summary>
        <div className="score-list">
          {[...result.scores]
            .sort((a, b) => b.score - a.score)
            .map((item) => (
              <div className="score-row" key={item.category}>
                <span>{item.category}</span>
                <div className="score-track">
                  <div style={{ width: `${item.score * 100}%` }} />
                </div>
                <strong>{(item.score * 100).toFixed(1)}%</strong>
              </div>
            ))}
          <p>
            Model scores are not calibrated probabilities or guaranteed accuracy. Scores below{" "}
            {(result.reviewThreshold * 100).toFixed(2)}% request manual review; higher scores can
            still be wrong.
          </p>
        </div>
      </details>
      <p className="result-footnote">
        <Icon name="info" size={13} /> {result.localRule}
      </p>
    </div>
  );
}

function About({ onClassify, catalog }: { onClassify: () => void; catalog: Catalog | null }) {
  return (
    <>
      <PageIntro
        label="SMALL CHOICES. LASTING HABITS."
        title={
          <>
            Smarter sorting.
            <br />
            <em>Better habits.</em>
          </>
        }
        description="A little clarity can change what we throw away."
      />
      <section className="about-mission">
        <div>
          <span className="eyebrow">MEET ECOSORT</span>
          <h2>Make the next right choice.</h2>
          <p>
            EcoSort helps you identify everyday waste from a photo and understand what to do next.
            Less guessing at the bin. More informed decisions, one item at a time.
          </p>
          <Button onClick={onClassify}>
            Let’s sort something <Icon name="arrow" size={18} />
          </Button>
        </div>
        <div className="about-illustration">
          <EmptyIllustration />
        </div>
      </section>
      <div className="about-features">
        {[
          {
            icon: "scan" as const,
            title: "See the material",
            text: "Start with a photo of one item. Get a material category to help guide your decision.",
          },
          {
            icon: "leaf" as const,
            title: "Build better habits",
            text: "Small, practical sorting steps make everyday waste a little easier to manage.",
          },
          {
            icon: "shield" as const,
            title: "Stay informed",
            text: "Use the result as a guide, not a guarantee. Your local recycling rules always come first.",
          },
        ].map((item) => (
          <section key={item.title}>
            <Icon name={item.icon} size={27} />
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </section>
        ))}
      </div>
      <section className="sdg-card">
        <div className="sdg-number">
          11
          <span>
            SUSTAINABLE CITIES
            <br />
            AND COMMUNITIES
          </span>
        </div>
        <div>
          <span className="eyebrow dark-eyebrow">A MORE MINDFUL TOMORROW</span>
          <h2>Better habits. More sustainable communities.</h2>
          <p>
            EcoSort aligns with UN Sustainable Development Goal 11 and target 11.6’s focus on
            municipal waste management. It encourages informed sorting; it does not measure
            environmental impact.
          </p>
          <a
            href="https://sdgs.un.org/goals/goal11"
            target="_blank"
            rel="noreferrer"
            className="text-link"
          >
            Explore SDG 11 <Icon name="arrow" size={16} />
          </a>
        </div>
      </section>
      <section className="limitations">
        <h2>A helpful guide, not the final word.</h2>
        <p>
          A photo can’t tell the whole story. Mixed materials, poor lighting and unfamiliar items
          can affect a result. The small, imbalanced dataset makes the broad trash category
          especially difficult. Model scores are uncalibrated; a material match is not proof of
          recyclability or disposal safety.
        </p>
        <Notice>
          For hazardous items, batteries, electronics or sharps, use specialist collection
          guidance—not an image-based sorting result.
        </Notice>
      </section>
      <details className="technical-details">
        <summary>
          Technical details and references <Icon name="chevron" size={19} />
        </summary>
        <div>
          <h3>How to read a result</h3>
          <p>
            EcoSort presents one predicted material and model scores for six categories. Results
            below its validation-derived review cutoff
            {catalog ? ` of ${(catalog.reviewThreshold * 100).toFixed(2)}%` : ""} need manual
            review. Scores are not calibrated probabilities, and high scores can still be wrong.
          </p>
          <h3>Your photo and the result</h3>
          <p>
            Your photo is classified on your device, inside your browser. It is not uploaded to a
            classification server or saved by EcoSort. The image preview is released when you
            remove or replace it, or close EcoSort. The result suggests a material, not a verified
            disposal route.
          </p>
          <h3>Sources and attribution</h3>
          <p>
            Sustainability context:{" "}
            <a href="https://sdgs.un.org/goals/goal11" target="_blank" rel="noreferrer">
              United Nations — Sustainable Development Goal 11
            </a>
            . General sorting guidance:{" "}
            <a
              href="https://www.epa.gov/recycle/how-do-i-recycle-common-recyclables"
              target="_blank"
              rel="noreferrer"
            >
              US EPA — common recyclables
            </a>
            . Local collection rules and item condition take precedence.
          </p>
          <p>
            Dataset:{" "}
            <a href="https://github.com/garythung/trashnet" target="_blank" rel="noreferrer">
              TrashNet by Gary Thung and Mindy Yang
            </a>
            , Stanford CS229 project. The repository’s MIT license and source records are retained
            with EcoSort; upstream does not state separate dataset-specific terms.
          </p>
        </div>
      </details>
    </>
  );
}
