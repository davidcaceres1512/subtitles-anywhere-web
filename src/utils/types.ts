export interface IOptionsTextTrackManager {
  textTrack?: string;
  urlTextTrack?: string;
  fileTextTrack?: string;
  subtitleType?: string;
  textTrackPicker?: "URL" | "LOCAL" | "FILE";
  timeoffset?: string;
  sizeSub?: string;
}
