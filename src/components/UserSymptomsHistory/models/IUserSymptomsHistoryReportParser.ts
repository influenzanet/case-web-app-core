import { ParsedReport } from "../../../utils/Reports/models/ReportModels";
import { ImageBrowserViewModel } from "../../ImageBrowser/models/ImageBrowserViewModel";

interface IUserSymptomsHistoryReportParser {
  version: string;
  parse: (report: ParsedReport, config: any) => ImageBrowserViewModel;
}

export default IUserSymptomsHistoryReportParser;
