// Embed block — plays a YouTube (or Vimeo) video inline on the page.
// Author it by putting a video URL in an "Embed" block, or as a plain link:
//   https://www.youtube.com/watch?v=ID  |  https://youtu.be/ID
//   https://vimeo.com/ID
// Uses a click-to-play facade (thumbnail + play button) so the heavy iframe
// only loads when the user clicks — good for performance/Lighthouse.

function youTubeId(url) {
  // Handles watch?v=, youtu.be/, /embed/, /shorts/, /live/, /v/ — and even a
  // malformed link where a full YouTube URL was pasted after "v=".
  const patterns = [
    /youtube\.com\/(?:embed|shorts|live|v)\/([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /[?&]v=([\w-]{11})(?:[&?]|$)/,
  ];
  for (let i = 0; i < patterns.length; i += 1) {
    const m = url.match(patterns[i]);
    if (m) return m[1];
  }
  return null;
}

function vimeoId(url) {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

// self-hosted / direct video files (mp4, webm, …)
function isVideoFile(url) {
  return /\.(mp4|webm|ogv|ogg|mov|m4v)(\?.*)?$/i.test(url);
}

function playIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 68 48");
  svg.setAttribute("class", "embed-play");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = '<path class="embed-play-bg" d="M66.52 7.74a8 8 0 0 0-5.63-5.66C55.9.5 34 .5 34 .5s-21.9 0-26.89 1.58a8 8 0 0 0-5.63 5.66C0 12.75 0 24 0 24s0 11.25 1.48 16.26a8 8 0 0 0 5.63 5.66C12.1 47.5 34 47.5 34 47.5s21.9 0 26.89-1.58a8 8 0 0 0 5.63-5.66C68 35.25 68 24 68 24s0-11.25-1.48-16.26z"/><path class="embed-play-arrow" d="M45 24 27 14v20z"/>';
  return svg;
}

function makeIframe(src, title) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("src", src);
  iframe.setAttribute("title", title || "Video");
  iframe.setAttribute("allow", "autoplay; fullscreen; picture-in-picture; encrypted-media");
  iframe.setAttribute("allowfullscreen", "");
  iframe.setAttribute("loading", "lazy");
  iframe.className = "embed-iframe";
  return iframe;
}

// Build a facade that swaps to the iframe (autoplay) on click.
// `posters` is a list of thumbnail URLs tried in order (later ones are
// fallbacks) so the real video frame shows behind the play button.
function buildFacade(frame, posters, title) {
  const facade = document.createElement("button");
  facade.type = "button";
  facade.className = "embed-facade";
  facade.setAttribute("aria-label", `Play ${title || "video"}`);

  const list = (Array.isArray(posters) ? posters : [posters]).filter(Boolean);
  if (list.length) {
    const img = document.createElement("img");
    img.className = "embed-poster";
    img.loading = "lazy";
    img.alt = title || "";
    let i = 0;
    img.src = list[i];
    img.addEventListener("error", () => {
      i += 1;
      if (i < list.length) img.src = list[i];
      else img.remove(); // give up on the thumbnail; dark bg remains
    });
    facade.append(img);
  }

  facade.append(playIcon());
  facade.addEventListener("click", () => {
    facade.replaceWith(makeIframe(frame, title));
  }, { once: true });
  return facade;
}

export default function decorate(block) {
  const link = block.querySelector("a[href]");
  const url = (link?.getAttribute("href") || block.textContent || "").trim();
  const title = link?.textContent?.trim() || block.querySelector("h1,h2,h3,h4")?.textContent?.trim();

  const wrap = document.createElement("div");
  wrap.className = "embed-wrap";

  // optional poster image authored alongside the link
  const posterImg = block.querySelector("img");
  const posterSrc = posterImg && (posterImg.currentSrc || posterImg.src);

  const yt = youTubeId(url);
  const vim = !yt && vimeoId(url);

  if (yt) {
    const frame = `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0`;
    // real video frame first, falling back through smaller sizes; authored
    // poster (if any) wins.
    const posters = posterSrc ? [posterSrc] : [
      `https://i.ytimg.com/vi/${yt}/maxresdefault.jpg`,
      `https://i.ytimg.com/vi/${yt}/sddefault.jpg`,
      `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`,
    ];
    wrap.append(buildFacade(frame, posters, title));
  } else if (vim) {
    // Vimeo thumbnails need an API call; render the player directly.
    wrap.append(makeIframe(`https://player.vimeo.com/video/${vim}`, title));
  } else if (isVideoFile(url)) {
    // self-hosted / direct video file -> native HTML5 player
    const video = document.createElement("video");
    video.className = "embed-video";
    video.controls = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("preload", "metadata");
    if (posterSrc) video.setAttribute("poster", posterSrc);
    const source = document.createElement("source");
    source.src = url;
    video.append(source);
    wrap.append(video);
  } else if (url) {
    // Unknown provider — keep it as a plain link rather than breaking.
    const a = document.createElement("a");
    a.href = url;
    a.textContent = title || url;
    a.className = "embed-link";
    wrap.append(a);
  }

  block.textContent = "";
  block.append(wrap);
}
