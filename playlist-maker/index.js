import { Web5 } from "https://cdn.jsdelivr.net/npm/@web5/api@0.8.1/dist/browser.mjs";
import { API_KEY } from "./config.js";

const loading = document.querySelector("#loading");
const content = document.querySelector("#content");
const copyDidButton = document.querySelector("#copyDidButton");
const albumCover = document.querySelector("#albumCover");
const albumName = document.querySelector("#albumName");
const artistName = document.querySelector("#artistName");
const trackList = document.querySelector("#trackList");

const { web5, did } = await Web5.connect();

if (web5) {
  // Change loading text on succesful load of web5;
  loading.textContent = "Loading tracks...";
  try {
    // Check if protocol exists in user's DWN, otherwise install it
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

    // Check if user has a playlist context, otherwise create one
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

    // Fetch the album and track data from Tidal API
    let albumRes;
    let tracksRes;
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
        "https://openapi.tidal.com/albums/300334014?countryCode=US",
        {
          headers: {
            accept: "application/vnd.tidal.v1+json",
            "Content-Type": "application/vnd.tidal.v1+json",
            Authorization: `Bearer ${tokenJson.access_token}`,
          },
        }
      );

      tracksRes = await fetch(
        "https://openapi.tidal.com/albums/300334014/items?countryCode=US",
        {
          headers: {
            accept: "application/vnd.tidal.v1+json",
            "Content-Type": "application/vnd.tidal.v1+json",
            Authorization: `Bearer ${tokenJson.access_token}`,
          },
        }
      );
    } catch {
      // Fallback to mock album and track data
      albumRes = await fetch("./mocks/mockAlbum.json");
      tracksRes = await fetch("./mocks/mockTracks.json");
    }
    const { resource: album } = await albumRes.json();
    const { data: albumTracks } = await tracksRes.json();

    // Copy DID Button and log it in the console
    copyDidButton.onclick = () => {
      console.log(did);
      navigator.clipboard.writeText(did);
    };

    // Set album cover
    albumCover.setAttribute("src", album.imageCover[0].url);
    albumCover.setAttribute("alt", `Album cover for ${album.title}`);

    // Set album heading details
    albumName.textContent = album.title;
    artistName.textContent = album.artists
      .map((artist) => artist.name)
      .join(", ");

    // Render album tracks and check off any already in user's playlist
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
      // Add tracks to user's playlist when track is checked
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
          trackToggle.setAttribute("checked", "true");
          trackToggle.setAttribute("data-record-id", trackRecord.id);
        } else {
          // Otherwise delete the track from user's playlist
          if (e.target.getAttribute("data-record-id")) {
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
            e.target.removeAttribute("checked");
            e.target.removeAttribute("data-record-id");
          }
        }
      };
      const trackLabel = document.createElement("label");
      trackLabel.setAttribute("for", `trackName-${track.resource.id}`);
      const trackLabelText = document.createElement("span");
      trackLabelText.textContent = track.resource.title;
      const trackDuration = document.createElement("time");
      trackDuration.setAttribute("datetime", `PT${track.resource.duration}S`);
      trackDuration.textContent = `${Math.floor(
        track.resource.duration / 60
      )}:${String(track.resource.duration % 60).padStart(2, "0")}`;
      trackLabel.appendChild(trackLabelText);
      trackLabel.append(trackDuration);
      trackToggleAndLabel.append(trackToggle);
      trackToggleAndLabel.append(trackLabel);
      listItem.append(trackToggleAndLabel);
      trackList.append(listItem);
    }
    // Remove loading on successful load of web5
    document.body.removeChild(loading);
    document.body.classList.add("gradient");
    content.style.display = "contents";
  } catch {
    // If tracks fail to load, inform the user
    loading.textContent = "Error loading tracks";
  }
} else {
  // If web5 fails to load, inform the user
  loading.textContent = "Error loading Web5";
}
