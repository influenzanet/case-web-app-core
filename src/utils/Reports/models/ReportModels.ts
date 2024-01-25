import { Report } from "../../../api/types/studyAPI";

interface ReportData {
  key: string;
  value: string;
  dtype?: string | undefined;
}

export class ParsedReport implements Report {
  studyKey: string;
  profileId: string;
  id: string;
  key: string;
  participantId: string;
  responseId: string;
  timestamp: number;
  data: Array<ReportData>;
  parsedData: Record<string, any>;

  constructor(report: Report) {
    this.studyKey = report.studyKey;
    this.profileId = report.profileId;
    this.id = report.id;
    this.key = report.key;
    this.participantId = report.participantId;
    this.responseId = report.responseId;
    this.timestamp = report.timestamp;
    this.data = report.data;
    this.parsedData = this.reportDataToObject(report.data);
  }

  private reportDataToObject(data: Array<ReportData>) {
    const reportDataObject: any = {};

    data.forEach((el: any) => {
      let value: string | Array<string>;

      // TODO add number
      switch (el.dtype) {
        case "string":
          value = el.value;
          break;
        case "keyList":
          value = el.value.split(";");
          break;
        default:
          value = el.value;
          break;
      }

      reportDataObject[el.key] = value;
    });

    return reportDataObject;
  }
}
