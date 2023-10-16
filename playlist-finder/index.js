import { Web5 } from "https://cdn.jsdelivr.net/npm/@web5/api@0.8.1/dist/browser.mjs";

const { web5 } = await Web5.connect();

if (web5) {
  const loading = document.querySelector("#loading");
  document.body.removeChild(loading);
}

const fanDid = document.querySelector("#fanDid");
const fanDidError = document.querySelector("#fanDidError");
const getFanPlaylistButton = document.querySelector("#getFanPlaylistButton");
const trackList = document.querySelector("#trackList");

fanDid.onchange = (e) => {
  if (fanDidError.childElementCount > 0) {
    fanDidError.textContent = "";
  }
  if (e.currentTarget.value) {
    getFanPlaylistButton.removeAttribute("disabled");
  } else {
    getFanPlaylistButton.setAttribute("disabled", "true");
  }
};
fanDid.onkeyup = (e) => {
  e.preventDefault();
  if (e.key === "Enter" && e.currentTarget.value) {
    getFanPlaylistButton.removeAttribute("disabled");
    getFanPlaylistButton.click();
  }
};
getFanPlaylistButton.onclick = async () => {
  fanDidError.textContent = "";
  trackList.replaceChildren([]);
  if (fanDid.value) {
    try {
      const { records: fanPlaylistRecords } = await web5.dwn.records.query({
        from: fanDid.value,
        message: {
          filter: {
            protocol: "https://example.com/protocol",
            protocolPath: "playlist",
          },
        },
      });
      console.log(fanPlaylistRecords);
      if (fanPlaylistRecords.length) {
        for (const fanPlaylistRecord of fanPlaylistRecords) {
          const { records: fanTracksRecords } = await web5.dwn.records.query({
            from: fanDid.value,
            message: {
              filter: {
                protocol: "https://example.com/protocol",
                protocolPath: "playlist/track",
                contextId: fanPlaylistRecord.contextId,
              },
            },
          });
          if (!fanTracksRecords.length) {
            fanDidError.textContent =
              "This user hasn't added any tracks to their playlist. Try a different user.";
          }
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
      }
    } catch {
      fanDidError.textContent =
        "Error getting fan playlist. Please check the DID and try again.";
    }
  }
};
