import { ImageBrowserViewModel } from "../../../ImageBrowser/models/ImageBrowserViewModel";
import IUserSymptomsHistoryReportParser from "../../models/IUserSymptomsHistoryReportParser";
import { SymptomsResult } from "../../models/SymptomsResult";
import { ParsedReport } from "../../../../utils/Reports/models/ReportModels";

class UserSymptomsHistoryReportParserV1
  implements IUserSymptomsHistoryReportParser
{
  version = "v1";

  parse = (report: ParsedReport, config: any) => {
    const viewModel: ImageBrowserViewModel = {
      date: report.timestamp,
      imageUrl: this.reportDataToImage(
        report.parsedData as SymptomsResult,
        config
      ),
    };

    return viewModel;
  };

  private reportDataToImage(data: SymptomsResult, config: any) {
    const genderConfig = config[data.gender];

    for (const symptoms of genderConfig) {
      for (const symptom in symptoms) {
        if (data.symptoms.includes(symptom)) {
          return symptoms[symptom];
        }
      }
    }

    const defaultSymptom = genderConfig.find((element: any) =>
      Object.prototype.hasOwnProperty.call(element, "default")
    );
    if (defaultSymptom) {
      return defaultSymptom["default"];
    }
  }
}

export default UserSymptomsHistoryReportParserV1;
