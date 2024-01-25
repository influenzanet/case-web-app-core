import { ImageBrowserViewModel } from "../../ImageBrowser/models/ImageBrowserViewModel";
import { ImageBrowserDataReader } from "../../ImageBrowser/services/ImageBrowserDataReader";

import parsers from "./parsers";
import defaultConfig from "./config/symptomsConfig.json";
import { Report } from "../../../api/types/studyAPI";
import { ParsedReport } from "../../../utils/Reports/models/ReportModels";
import { getReportsForUser } from "../../../api/studyAPI";

type ReportRequestParameters = Parameters<typeof getReportsForUser>;

export class UserSymptomsHistoryReportReader extends ImageBrowserDataReader {
  static config: any = defaultConfig;
  studyId: string;
  profileId: string;
  startingDate: number | undefined = undefined;
  hasMoreData = true;

  private constructor(studyId: string, profileId: string) {
    super();
    this.studyId = studyId;
    this.profileId = profileId;
  }

  static init = async (studyId: string, profileId: string) => {
    fetch("/assets/configs/userSymptoms/config.json").then((response) => {
      if (!response.ok) {
        return;
      }

      UserSymptomsHistoryReportReader.config = response.json();
    });

    return new UserSymptomsHistoryReportReader(studyId, profileId);
  };

  next = async (count: number): Promise<Array<ImageBrowserViewModel>> => {
    let symptomsResults: ImageBrowserViewModel[] = [];

    if (!this.hasMoreData) {
      return symptomsResults;
    }

    const requestParameters: ReportRequestParameters = [
      [this.studyId],
      [this.profileId],
      "symptomsFeedback", // read from shared model
      undefined,
      this.startingDate,
      undefined,
      count,
    ];

    let response;

    try {
      response = await getReportsForUser(...requestParameters);

      if (!response?.data?.reports) {
        return symptomsResults;
      }

      const reports = response.data.reports;

      symptomsResults = this.parseReports(reports);

      const reportCount = reports.length;
      if (reportCount > 0) {
        this.startingDate = reports[reportCount - 1].timestamp;
      }

      this.hasMoreData = reportCount === count;
    } catch {
      // there's nothing we can do since we don't have a logger
    }

    return symptomsResults;
  };

  private parseReports(reports: Report[]): ImageBrowserViewModel[] {
    const result: ImageBrowserViewModel[] = [];

    reports.reduce((result: ImageBrowserViewModel[], report: Report) => {
      const parsedReport: ParsedReport = new ParsedReport(report);

      // we skip report that do not have a version
      if (parsedReport.parsedData.version) {
        const parser = parsers.find(
          (item) => item.version === parsedReport.parsedData.version
        );

        // we skip report for which we do not have a parser
        if (parser) {
          result.push(
            parser.parse(parsedReport, UserSymptomsHistoryReportReader.config)
          );
        }
      }

      return result;
    }, result);

    return result;
  }
}
