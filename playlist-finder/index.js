import { Web5 } from "https://cdn.jsdelivr.net/npm/@web5/api@0.8.1/dist/browser.mjs";

const loading = document.querySelector("#loading");
const fanDid = document.querySelector("#fanDid");
const fanDidError = document.querySelector("#fanDidError");
const fanPlaylistButton = document.querySelector("#fanPlaylistButton");
const fanForm = document.querySelector("#fanForm");
const trackList = document.querySelector("#trackList");

const { web5 } = await Web5.connect();

if (web5) {
  // Remove loading on successful load of web5
  document.body.removeChild(loading);
  content.style.visibility = "visible";

  // Handle user input of DID
  fanDid.oninput = (e) => {
    if (fanDidError.childElementCount > 0) {
      fanDidError.textContent = "";
    }
    if (e.currentTarget.value) {
      fanPlaylistButton.removeAttribute("disabled");
    } else {
      fanPlaylistButton.setAttribute("disabled", "true");
    }
  };
  fanDid.onkeyup = (e) => {
    e.preventDefault();
    if (e.key === "Enter" && e.currentTarget.value) {
      fanPlaylistButton.removeAttribute("disabled");
      fanPlaylistButton.click();
    }
  };

  // Get playlist from DID's DWN
  fanForm.onsubmit = async (e) => {
    e.preventDefault();
    fanDidError.textContent = "";
    trackList.replaceChildren([]);
    if (fanDid.value) {
      try {
        // Check if playlist context exists
        const { records: fanPlaylistRecords } = await web5.dwn.records.query({
          from: fanDid.value,
          message: {
            filter: {
              protocol: "https://example.com/wwc-workshop/protocol",
              protocolPath: "playlist",
            },
          },
        });
        if (fanPlaylistRecords.length) {
          for (const fanPlaylistRecord of fanPlaylistRecords) {
            // Check for playlist tracks to render
            const { records: fanTracksRecords } = await web5.dwn.records.query({
              from: fanDid.value,
              message: {
                filter: {
                  protocol: "https://example.com/wwc-workshop/protocol",
                  protocolPath: "playlist/track",
                  contextId: fanPlaylistRecord.contextId,
                },
              },
            });
            if (!fanTracksRecords.length) {
              fanDidError.textContent =
                "This user hasn't added any tracks to their playlist. Try a different user.";
            }
            // Render each track
            for (const fanTrackRecord of fanTracksRecords) {
              const { track } = await fanTrackRecord.data.json();
              const listItem = document.createElement("li");
              const trackDetailAndImage = document.createElement("div");
              const trackImage = document.createElement("img");
              trackImage.setAttribute(
                "src",
                track.resource.album.imageCover[0].url
              );
              trackImage.setAttribute(
                "alt",
                `Album cover for ${track.resource.album.title}`
              );
              trackDetailAndImage.append(trackImage);
              const trackDetail = document.createElement("div");
              const trackTitle = document.createElement("h2");
              trackTitle.textContent = track.resource.title;
              const trackAlbum = document.createElement("p");
              trackAlbum.textContent = track.resource.album.title;
              const trackArtists = document.createElement("p");
              trackArtists.textContent = track.resource.artists
                .map((artist) => artist.name)
                .join(", ");
              const trackCopyright = document.createElement("p");
              trackCopyright.textContent = track.resource.copyright;
              trackCopyright.classList.add("copyright");
              trackDetail.append(trackTitle);
              trackDetail.append(trackAlbum);
              trackDetail.append(trackArtists);
              trackDetail.append(trackCopyright);
              trackDetailAndImage.append(trackDetail);
              const trackDuration = document.createElement("time");
              trackDuration.setAttribute(
                "datetime",
                `PT${track.resource.duration}S`
              );
              trackDuration.textContent = `${Math.floor(
                track.resource.duration / 60
              )}:${String(track.resource.duration % 60).padStart(2, "0")}`;
              listItem.append(trackDetailAndImage);
              listItem.append(trackDuration);
              trackList.append(listItem);
            }
          }
        } else {
          fanDidError.textContent =
            "This user doesn't have a fan playlist. Please try again.";
        }
      } catch {
        fanDidError.textContent =
          "Error getting fan playlist. Please check the DID and try again.";
      }
    }
  };
} else {
  loading.textContent = "Error loading Web5";
}
