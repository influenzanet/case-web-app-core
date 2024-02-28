import { ImageBrowserViewModel } from "../../ImageBrowser/models/ImageBrowserViewModel";
import { ImageBrowserDataReader } from "../../ImageBrowser/services/ImageBrowserDataReader";

import parsers from "./parsers";
import defaultConfig from "./config/symptomsConfig.json";
import { Report } from "../../../api/types/studyAPI";
import { ParsedReport } from "../../../utils/Reports/models/ReportModels";
import { getReportsForUser } from "../../../api/studyAPI";
import {
  SymptomsConfig,
  isValidUserSymptomsHistoryConfig,
} from "./config/SymptomsConfig";

type ReportRequestParameters = Parameters<typeof getReportsForUser>;

export class UserSymptomsHistoryReportReader extends ImageBrowserDataReader {
  static config: SymptomsConfig = defaultConfig as SymptomsConfig;
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
    try {
      const response = await fetch("/assets/configs/userSymptoms/config.json");

      if (response.ok && response.status >= 200 && response.status < 300) {
        const jsonData = await response.json();

        if (isValidUserSymptomsHistoryConfig(jsonData)) {
          UserSymptomsHistoryReportReader.config = jsonData;
        } else {
          console.error(
            "UserSymptomsHistoryReportReader: Invalid configuration format, using the default configuration"
          );
        }
      }
    } catch (error) {
      console.error(
        "UserSymptomsHistoryReportReader: Error fetching or processing configuration, using the default configuration:",
        error
      );
    }

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
    } catch (error) {
      console.error(
        "UserSymptomsHistoryReportReader: error fetching reports: ",
        error
      );
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
