import { Web5 } from "https://cdn.jsdelivr.net/npm/@web5/api@0.8.1/dist/browser.mjs";

const { web5, did } = await Web5.connect();

const playlistProtocolRes = await fetch("./playlistProtocol.json");
const playlistProtocol = await playlistProtocolRes.json();

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
  if (fanDid.value) {
    try {
      const { records: fanPlaylistRecords } = await web5.dwn.records.query({
        from: fanDid.value,
        message: {
          filter: {
            protocol: playlistProtocol.protocol,
            protocolPath: "playlist",
          },
        },
      });
      if (fanPlaylistRecords[0]) {
        const { records: fanTracksRecords } = await web5.dwn.records.query({
          from: fanDid.value,
          message: {
            filter: {
              protocol: playlistProtocol.protocol,
              protocolPath: "playlist/track",
              contextId: fanPlaylistRecords[0].contextId,
            },
          },
        });
        for (const fanTrackRecord of fanTracksRecords) {
          const track = await fanTrackRecord.data.json();
          const listItem = document.createElement("li");
          const trackDetailAndImage = document.createElement("div");
          const trackImage = document.createElement("img");
          trackImage.setAttribute("src", track.imageCover);
          trackImage.setAttribute("alt", track.imageAlt);
          trackDetailAndImage.append(trackImage);
          const trackDetail = document.createElement("div");
          const trackTitle = document.createElement("h2");
          trackTitle.textContent = track.title;
          const trackAlbum = document.createElement("p");
          trackAlbum.textContent = track.album;
          const trackArtists = document.createElement("p");
          trackArtists.textContent = track.artists;
          const trackCopyright = document.createElement("p");
          trackCopyright.textContent = track.copyright;
          trackDetail.append(trackTitle);
          trackDetail.append(trackAlbum);
          trackDetail.append(trackArtists);
          trackDetail.append(trackCopyright);
          trackDetailAndImage.append(trackDetail);
          const trackDuration = document.createElement("time");
          trackDuration.setAttribute("datetime", `PT${track.duration}S`);
          trackDuration.textContent = `${Math.floor(
            track.duration / 60
          )}:${String(track.duration % 60).padStart(2, "0")}`;
          listItem.append(trackDetailAndImage);
          listItem.append(trackDuration);
          trackList.append(listItem);
        }
      }
    } catch {
      fanDidError.textContent =
        "Error getting fan playlist. Please check the DID and try again.";
    }
  }
};
