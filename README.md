# Open Protocols Workshop: Unlocking Music Sharing

This workshop is designed to demonstrate open protocols in action – and the interoperability between client applications they make possible.

## About this repository

Inside this repository are two separate client applications.

### `playlist-maker`

This project is a playlist maker that leverages [Web5](https://github.com/TBD54566975/web5-js) and the [Tidal API Beta](https://developer.tidal.com/) to allow users to create playlists that they truly own.

For the purposes of this lab, this is also where we define and configure our open protocol.

### `playlist-finder`

This project is a playlist finder that leverages [Web5](https://github.com/TBD54566975/web5-js) to allow users' playlists by DID. A user can enter any DID to see if that user has created a playlist under this open protocol.

## Prerequisites

- Node - [Installation](https://nodejs.org/en/download)
- Npm - [Installation](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- Nvm (recommended) - [Installation](https://github.com/nvm-sh/nvm#installing-and-updating)

## Getting started

1. Clone this repository and `cd` into the project.

```
$ git clone https://github.com/kirahsapong/wwc-workshop.git
$ cd wwc-workshop
```

2. At the end of this lab, you'll use the below commands to run `playlist-maker` and `playlist-finder` in your browser.

```
$ npx http-server playlist-maker -o
```

```
$ npx http-server playlist-finder -o
```

### Tidal API Beta

To get started with your own Tidal API token, create an account in [Tidal's Developer Dashboard]() and make note of your Client ID and Client Secret.

In your terminal, generate a base64 API key:

```
echo -n "CLIENT_ID:CLIENT_SECRET" | base64
```

Create a `config.js` file in your `playlist-maker` folder and add your API variables.

```
export const config = {
  CLIENT_ID: {TIDAL_API_CLIENT_ID_GOES_HERE},
  CLIENT_SECRET: {TIDAL_API_CLIENT_SECRET_GOES_HERE},
  API_KEY:
    {YOUR_GENERATED_BASE64_KEY_GOES_HERE},
};

```

This file will be ignored by your `.gitignore` file anytime you push your changes.

### Web5 SDK

To get started with Web5, visit the [Web5 SDK Homepage]() and [TBD Developer Docs](). You can also find answers to common questions in [TBD's Community Discord]().

Follow along the lab to make modifications to your `playlistProtocol.json`. It will look like this to start:

```
{
  "protocol": "",
  "published": false,
  "types": {},
  "structure": {}
}
```

You can learn more about defining protocols through [TBD Developer Docs - Learn Protocols](https://developer.tbd.website/docs/web5/learn/protocols/).

#### Clearing your Web5 state

To clear all local data associated with your Web5 test DID during development, you can write a short code snippet to clear your browser's IndexedDB or use your browser's developer tools. For example, in Chrome, you can open Chrome DevTools and navigate to the `Application` Tab. You can open the `Storage` panel on the left-hand side and click the `Clear site data` button.

**Note that this action is irreversible and you will lose any association with the DID, as well as all data tied to that DID.**

## Further exploration

Congratulations! You completed the lab and now know how to build applications using the Tidal API Beta and open protocols with Web5.

What other applications can you think of for the data you helped your users create and store in their own personal DWNs today? Maybe it's a fitness app that populates
