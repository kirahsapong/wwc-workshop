import { Web5 } from "https://cdn.jsdelivr.net/npm/@web5/api@0.8.1/dist/browser.mjs";
import { API_KEY } from "./config.js";

const { web5, did } = await Web5.connect();

if (web5) {
  const loading = document.querySelector("#loading");
  document.body.removeChild(loading);
}

const playlistProtocolRes = await fetch("./finals/playlistProtocol.json");
const playlistProtocol = await playlistProtocolRes.json();

const { protocols } = await web5.dwn.protocols.query({
  message: {
    filter: {
      protocol: playlistProtocol.protocol,
    },
  },
});

if (!protocols || !protocols.length) {
  const { protocol } = await web5.dwn.protocols.configure({
    message: {
      definition: playlistProtocol,
    },
  });
  await protocol.send(did);
}

let playlistRecord;
const { records: playlistRecords } = await web5.dwn.records.query({
  message: {
    filter: {
      protocol: playlistProtocol.protocol,
      protocolPath: "playlist",
    },
  },
});
if (!playlistRecords || !playlistRecords.length) {
  ({ record: playlistRecord } = await web5.dwn.records.write({
    data: {},
    message: {
      protocol: playlistProtocol.protocol,
      protocolPath: "playlist",
      schema: playlistProtocol.types.playlist.schema,
      published: true,
    },
  }));
  await playlistRecord.send(did);
} else {
  playlistRecord = playlistRecords[0];
}

let albumRes;
let tracksRes;
let resource;
let albumTracks;

try {
  const token = await fetch("https://auth.tidal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${API_KEY}`,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }),
  });
  const tokenJson = await token.json();

  albumRes = await fetch(
    "https://openapi.tidal.com/albums/251380836?countryCode=US",
    {
      headers: {
        accept: "application/vnd.tidal.v1+json",
        "Content-Type": "application/vnd.tidal.v1+json",
        Authorization: `Bearer ${tokenJson.access_token}`,
      },
    }
  );

  tracksRes = await fetch(
    "https://openapi.tidal.com/albums/251380836/items?countryCode=US",
    {
      headers: {
        accept: "application/vnd.tidal.v1+json",
        "Content-Type": "application/vnd.tidal.v1+json",
        Authorization: `Bearer ${tokenJson.access_token}`,
      },
    }
  );

  ({ resource } = await albumRes.json());
  ({ data: albumTracks } = await tracksRes.json());
} catch {
  // throw new Error("error fetching album and track data ");
  albumRes = await fetch("./mockAlbum.json");
  tracksRes = await fetch("./mockTracks.json");
  ({ resource } = await albumRes.json());
  ({ data: albumTracks } = await tracksRes.json());
}

const copyDidButton = document.querySelector("#copyDidButton");
const albumCover = document.querySelector("#albumCover");
const albumName = document.querySelector("#albumName");
const artistName = document.querySelector("#artistName");
const trackList = document.querySelector("#trackList");

// Copy DID Button
copyDidButton.onclick = () => {
  console.log(did);
  navigator.clipboard.writeText(did);
};

// Album cover
albumCover.setAttribute("src", resource.imageCover[0].url);
albumCover.setAttribute("alt", `Album cover for ${resource.title}`);

// Album header
albumName.textContent = resource.title;
artistName.textContent = resource.artists
  .map((artist) => artist.name)
  .join(", ");

// Track list
const { records: trackRecords } = await web5.dwn.records.query({
  message: {
    filter: {
      protocol: playlistProtocol.protocol,
      protocolPath: "playlist/track",
    },
  },
});
for (const track of albumTracks) {
  const listItem = document.createElement("li");
  const trackToggleAndLabel = document.createElement("div");
  const trackToggle = document.createElement("input");
  trackToggle.setAttribute("type", "checkbox");
  trackToggle.setAttribute("id", `trackName-${track.resource.id}`);
  for (const record of trackRecords) {
    const result = await record.data.json();
    if (result.track.resource.id === track.resource.id) {
      trackToggle.setAttribute("checked", "true");
      trackToggle.setAttribute("data-record-id", record.id);
    }
  }
  trackToggle.onchange = async (e) => {
    if (e.target.checked) {
      const { record: trackRecord } = await web5.dwn.records.write({
        data: {
          track,
        },
        message: {
          protocol: playlistProtocol.protocol,
          protocolPath: "playlist/track",
          contextId: playlistRecord.contextId,
          parentId: playlistRecord.contextId,
          schema: playlistProtocol.types.track.schema,
          published: true,
        },
      });
      await trackRecord.send(did);
      trackToggle.setAttribute("data-record-id", trackRecord.id);
    } else {
      if (e.target.getAttribute("data-record-id")) {
        console.log(e.target.getAttribute("data-record-id"));
        const { status: localStatus } = await web5.dwn.records.delete({
          message: {
            recordId: e.target.getAttribute("data-record-id"),
          },
        });
        const { status: remoteStatus } = await web5.dwn.records.delete({
          from: did,
          message: {
            recordId: e.target.getAttribute("data-record-id"),
          },
        });
        e.target.removeAttribute("data-record-id");
        console.log(localStatus, remoteStatus);
      }
    }
  };
  const trackLabel = document.createElement("label");
  trackLabel.setAttribute("for", `trackName-${track.resource.id}`);
  trackLabel.textContent = track.resource.title;
  trackToggleAndLabel.append(trackToggle);
  trackToggleAndLabel.append(trackLabel);
  const trackDuration = document.createElement("time");
  trackDuration.setAttribute("datetime", `PT${track.resource.duration}S`);
  trackDuration.textContent = `${Math.floor(
    track.resource.duration / 60
  )}:${String(track.resource.duration % 60).padStart(2, "0")}`;
  listItem.append(trackToggleAndLabel);
  listItem.append(trackDuration);
  trackList.append(listItem);
}
