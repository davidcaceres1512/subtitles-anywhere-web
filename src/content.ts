import TextTrackRenderer, {
  TTML_PARSER,
  VTT_PARSER,
  SRT_PARSER,
  SAMI_PARSER
} from "rx-player/experimental/tools/TextTrackRenderer";

import { getInfosFromLocalStorage } from "./utils/storage";
import { checkDomVideoChanges } from "./utils/domChanges";
import { styleSheetManager } from "./utils/addStyleSheet";
import {
  resizeObserver,
  determineBestPositionForTextTrack
} from "./utils/resizeObserver";
import { onMouseMove } from "./utils/onMouseMove";

TextTrackRenderer.addParsers([
  TTML_PARSER,
  VTT_PARSER,
  SRT_PARSER,
  SAMI_PARSER
]);

let mouseMoveSubscription: (() => void) | null = null;
const { checkVideoChanges } = checkDomVideoChanges();
const { insertStyleSheetRule, cleanStyleSheet } = styleSheetManager();


checkVideoChanges(videoElement => {
  if (videoElement == null) {
    cleanStyleSheet();
    mouseMoveSubscription?.();
    document.querySelector(".SA-textTrackManager")?.remove();
    document.querySelector(".SA-textTrackDisplayer")?.remove();
    if (document.querySelector(".subtitlesEverywhere") !== null) {
      document.documentElement.classList.remove("subtitlesEverywhere");
    }
    return;
  }

  const isControlsPresent = document.querySelector(".subtitlesEverywhere");
  if (isControlsPresent !== null) {
    return;
  }
  document.documentElement.classList.add("subtitlesEverywhere");

  // Set the UI to manage the textTrack rendering
  const containerTextTrackManager = document.createElement("div");
  const startIcon = document.createElement("img");
  const stopIcon = document.createElement("img");

  startIcon.src = chrome.runtime.getURL("medias/play.svg");
  startIcon.style.height = "2rem";
  startIcon.style.margin = "0 3.5px";
  startIcon.style.cursor = "pointer";
  startIcon.style.pointerEvents = "auto";

  stopIcon.src = chrome.runtime.getURL("medias/stop.svg");
  stopIcon.style.height = "2rem";
  stopIcon.style.margin = "0 3.5px";
  stopIcon.style.cursor = "pointer";
  stopIcon.style.pointerEvents = "auto";

  containerTextTrackManager.append(startIcon, stopIcon);

  containerTextTrackManager.className = "SA-textTrackManager";
  containerTextTrackManager.style.display = "flex";
  containerTextTrackManager.style.padding = "5px 10px";
  containerTextTrackManager.style.zIndex = "10000";
  containerTextTrackManager.style.backgroundColor = "white";
  containerTextTrackManager.style.position = "absolute";
  containerTextTrackManager.style.borderRadius = "2.5rem";
  containerTextTrackManager.style.backgroundColor = "#1b1e22";
  const { top, left, height } = videoElement.getBoundingClientRect();
  const scrollTopDoc = document.documentElement.scrollTop;
  containerTextTrackManager.style.top = `${top +
    scrollTopDoc +
    (height / 2 - containerTextTrackManager.clientHeight)}px`;
  containerTextTrackManager.style.left = `${left}px`;

  // Set up the UI to display the text track in
  const textTrackDisplayer = document.createElement("div");
  textTrackDisplayer.className = "SA-textTrackDisplayer";
  textTrackDisplayer.style.position = "absolute";
  textTrackDisplayer.style.zIndex = "10000";
  textTrackDisplayer.style.width = "100%";

  resizeObserver(videoElement, () => {
    const { top, left, height } = videoElement.getBoundingClientRect();
    const scrollTopDocRefreshed = document.documentElement.scrollTop;
    containerTextTrackManager.style.top = `${top +
      scrollTopDocRefreshed +
      (height / 2 - containerTextTrackManager.clientHeight)}px`;
    containerTextTrackManager.style.left = `${left}px`;

    determineBestPositionForTextTrack(videoElement, textTrackDisplayer);
  });

  const textTrackRenderer = new TextTrackRenderer({
    videoElement,
    textTrackElement: textTrackDisplayer
  });

  mouseMoveSubscription = onMouseMove(
    textTrackRenderer,
    () => {
      containerTextTrackManager.style.display = "block";
    },
    () => {
      containerTextTrackManager.style.display = "none";
    }
  );

  startIcon.onclick = async () => {
    try {
      // Notif user of the click...
      containerTextTrackManager.style.border = "solid 1px #0060E5";
      setTimeout(() => (containerTextTrackManager.style.border = "none"), 1000);
      determineBestPositionForTextTrack(videoElement, textTrackDisplayer);
      const {
        textTrack,
        subtitleType,
        timeoffset,
        textTrackPicker,
        urlTextTrack,
        fileTextTrack,
        sizeSub
      } = await getInfosFromLocalStorage([
        "textTrack",
        "subtitleType",
        "timeoffset",
        "textTrackPicker",
        "urlTextTrack",
        "fileTextTrack",
        "sizeSub"
      ]);
      // get informations from url if asked to.
      if (
        textTrackPicker === "URL" &&
        urlTextTrack !== undefined &&
        subtitleType !== undefined
      ) {
        console.warn("textTrackPicker === URL");
        const resp = await fetch(urlTextTrack);
        const textTrackFromURL = await resp.text();
        // Insert the wanted size for the subtitles
        insertStyleSheetRule(
          `.rxp-texttrack-span { font-size: ${sizeSub}px; }`
        );
        textTrackRenderer.setTextTrack({
          data: textTrackFromURL,
          type: subtitleType,
          timeOffset: Number(timeoffset)
        });
      } else if (
        textTrackPicker === "LOCAL" &&
        textTrack !== undefined &&
        subtitleType !== undefined
      ) {
        console.warn("textTrackPicker === LOCAL");
        // Insert the wanted size for the subtitles
        insertStyleSheetRule(
          `.rxp-texttrack-span { font-size: ${sizeSub}px; }`
        );
        textTrackRenderer.setTextTrack({
          data: textTrack,
          type: subtitleType,
          timeOffset: Number(timeoffset)
        });
      } else if (
        textTrackPicker === "FILE" &&
        fileTextTrack !== undefined &&
        subtitleType !== undefined
      ) {

        console.warn("textTrackPicker === FILE");
        // Insert the wanted size for the subtitles
        insertStyleSheetRule(
          `.rxp-texttrack-span { font-size: ${sizeSub}px; }`
        );
        textTrackRenderer.setTextTrack({
          data: fileTextTrack,
          type: subtitleType,
          timeOffset: Number(timeoffset)
        });
      } else {
        // A mandatory param is not given
        // Lets see how we can handle gracefully the ext's error
        console.warn("pass warning");
        console.warn(`
          [SUBANY]-Error: Have you gave all the mandatory parameters?
        `);
      }
    } catch (e) {
      // Display error in the console for now
      // Lets see how we can handle gracefully the ext's error
      if (e instanceof Error) {
        
        console.warn(`[SUBANY]-Error: ${e.message}`);
      }
    }
  };
  stopIcon.onclick = () => {
    // Notif user of the click...
    containerTextTrackManager.style.border = "solid 1px #0060E5";
    setTimeout(() => (containerTextTrackManager.style.border = "none"), 1000);
    textTrackRenderer.removeTextTrack();
  };
  containerTextTrackManager.append(startIcon, stopIcon);
  // To keep everything working in fullscreen mode, we have to append the closest possible to the video element
  if (videoElement.parentElement !== null) {
    videoElement.parentElement.append(
      containerTextTrackManager,
      textTrackDisplayer
    );
  }
});
