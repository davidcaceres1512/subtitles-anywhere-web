import {
  getInfosFromLocalStorage,
  setInfosOnLocalStorage
} from "./utils/storage";
import { IOptionsTextTrackManager } from "./utils/types";

// Get the subtitle type
const subtitleType = document.getElementById(
  "subtitlesType"
) as HTMLSelectElement;

// Get the url picker
const urlPicker = document.getElementById("pickerUrl") as HTMLInputElement;
const urlInput = document.getElementById("url") as HTMLInputElement;

// Get the text picker
const txtPicker = document.getElementById("pickerTxt") as HTMLInputElement;
const textArea = document.getElementById("text") as HTMLTextAreaElement;

// Get the file picker
const filePicker  = document.getElementById("pickerFile") as HTMLInputElement;
const fileContent = document.getElementById("myFile") as HTMLInputElement;
const fileSubmitButton = document.getElementById("submitFile") as HTMLInputElement;
let fileContentStr:string ="";
// Get timeoffset
const timeoffsetInput = document.getElementById(
  "timeoffset"
) as HTMLInputElement;

// Get subtitle size in px
const subSizepxl = document.getElementById("sizeSub") as HTMLInputElement;

// Button to save changes
const saverBtn = document.getElementById("saver") as HTMLButtonElement;

// Notification div
const notification = document.getElementById("notification");

/*import { spawn } from "child_process";
const childPython = spawn('python', ['Hello.py','Codespace']);

childPython.stdout.on('data', (data: any) => {
  console.log(`stdout: ${data}`);
})*/

getInfosFromLocalStorage([
  "textTrack",
  "urlTextTrack",
  "fileTextTrack",
  "subtitleType",
  "textTrackPicker",
  "timeoffset",
  "sizeSub"
]).then((res: IOptionsTextTrackManager) => {
  textArea.value = res.textTrack || "";
  fileContent.value = res.fileTextTrack || "";
  subtitleType.value = res.subtitleType || "srt";
  timeoffsetInput.value = res.timeoffset || "0";
  subSizepxl.value = res.sizeSub || "28";
  urlInput.value = res.urlTextTrack || "";
  if (res.textTrackPicker === "URL") {
    urlPicker.checked = true;
    txtPicker.checked = false;
    filePicker.checked = false;
    textArea.style.display = "none";
    urlInput.style.display = "block";
    fileContent.style.display = "none";
    fileSubmitButton.style.display = "none";
  } else if (res.textTrackPicker === "LOCAL") {
    urlPicker.checked = false;
    txtPicker.checked = true;
    filePicker.checked = false;
    urlInput.style.display = "none";
    textArea.style.display = "block";
    fileContent.style.display = "none";
    fileSubmitButton.style.display = "none";
  } else if (res.textTrackPicker === "FILE") {
    urlPicker.checked = false;
    txtPicker.checked = false;
    filePicker.checked = true;
    urlInput.style.display = "none";
    textArea.style.display = "none";
    fileContent.style.display = "block";
    fileSubmitButton.style.display = "block";

  }
});

urlPicker.onclick = () => {
  if (urlPicker.checked) {
    txtPicker.checked = false;
    filePicker.checked = false;
    urlInput.style.display = "block";
    textArea.style.display = "none";
    fileContent.style.display = "none";
    fileSubmitButton.style.display = "none";
  }
};
txtPicker.onclick = () => {
  if (txtPicker.checked) {
    urlPicker.checked = false;
    filePicker.checked = false;
    urlInput.style.display = "none";
    textArea.style.display = "block";
    fileContent.style.display = "none";
    fileSubmitButton.style.display = "none";
  }
};
filePicker.onclick = () => {
  if (filePicker.checked) {
    urlPicker.checked = false;
    txtPicker.checked = false;
    urlInput.style.display = "none";
    textArea.style.display = "none";
    fileContent.style.display = "block";
    fileSubmitButton.style.display = "block";
  }
};

//fileSubmitButton.onclick = () => {
  
  fileContent.addEventListener("change", handleFileSelect, false);

  function handleFileSelect(event: Event) {

    const target = event.target as HTMLInputElement;
    const file: File = (target.files as FileList)[0];

    if (file) {
      // Hacer algo con el archivo
      console.warn(file.name);

      const reader = new FileReader();
      reader.readAsText(file, "UTF-8");
      reader.onload = function (event) {
        const content = event.target?.result as string;
        // Hacer algo con el contenido del archivo
        console.warn(content);
        //fileContent.value = content;
        fileContentStr = content;
        //console.warn(fileContent.value);
      };
    }
  }

//}

saverBtn.onclick = () => {
  setInfosOnLocalStorage({
    subtitleType: subtitleType.value,
    textTrack: txtPicker.checked ? textArea.value : "",
    urlTextTrack: urlPicker.checked ? urlInput.value : "",
    fileTextTrack: filePicker.checked ? /*fileContent.value*/fileContentStr : "",
    textTrackPicker: urlPicker.checked ? "URL" : (txtPicker.checked ? "LOCAL" : "FILE"),
    timeoffset: timeoffsetInput.value,
    sizeSub: subSizepxl.value || "28"
  }).then(() => {
    if (notification === null) {
      return;
    }
    notification.innerText = "Saved!";
    notification.style.color = "#21ba45";
    setTimeout(() => {
      notification.innerText = "";
    }, 3000);
  });
};
