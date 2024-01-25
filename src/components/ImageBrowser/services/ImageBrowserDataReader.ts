import { ImageBrowserViewModel } from "../models/ImageBrowserViewModel";

export abstract class ImageBrowserDataReader {
  abstract next: (count: number) => Promise<Array<ImageBrowserViewModel>>;
}
