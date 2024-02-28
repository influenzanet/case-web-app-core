import { ParsedReport } from "../../../utils/Reports/models/ReportModels";
import { ImageBrowserViewModel } from "../../ImageBrowser/models/ImageBrowserViewModel";
import { SymptomsConfig } from "../services/config/SymptomsConfig";

interface IUserSymptomsHistoryReportParser {
  version: string;
  parse: (
    report: ParsedReport,
    config: SymptomsConfig
  ) => ImageBrowserViewModel;
}

export default IUserSymptomsHistoryReportParser;
