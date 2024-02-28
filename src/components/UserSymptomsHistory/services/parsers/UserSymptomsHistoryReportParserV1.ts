import { ImageBrowserViewModel } from "../../../ImageBrowser/models/ImageBrowserViewModel";
import IUserSymptomsHistoryReportParser from "../../models/IUserSymptomsHistoryReportParser";
import { SymptomsResult } from "../../models/SymptomsResult";
import { ParsedReport } from "../../../../utils/Reports/models/ReportModels";
import { SymptomsConfig } from "../config/SymptomsConfig";

class UserSymptomsHistoryReportParserV1
  implements IUserSymptomsHistoryReportParser
{
  version = "v1";

  parse = (report: ParsedReport, config: SymptomsConfig) => {
    const viewModel: ImageBrowserViewModel = {
      date: report.timestamp,
      imageUrl: this.reportDataToImage(
        report.parsedData as SymptomsResult,
        config
      ),
    };

    return viewModel;
  };

  private reportDataToImage(data: SymptomsResult, config: SymptomsConfig) {
    const genderConfig = config[data.gender];

    for (const symptoms of genderConfig) {
      for (const symptom in symptoms) {
        if (data.symptoms.includes(symptom)) {
          return symptoms[symptom];
        }
      }
    }

    const defaultSymptom = genderConfig.find((element) => "default" in element);

    if (!defaultSymptom) {
      throw new Error(
        "No default symptom found. This should never happen since we have a runtime check"
      );
    }

    return defaultSymptom.default;
  }
}

export default UserSymptomsHistoryReportParserV1;
