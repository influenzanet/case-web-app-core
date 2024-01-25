import { Report as RR } from "../../../../api/types/studyAPI";
import { getReportsForUser } from "../../../../api/studyAPI";

interface ReportData {
  key: string;
  value: string;
  dtype?: string | undefined;
}

type ReportDataObject = Record<string, any>;

type Report<T extends ReportDataObject> = {
  key: string;
  data: T;
};

type ReportRequestParameters = Parameters<typeof getReportsForUser>;

async function getReport<TData extends ReportDataObject>(
  request: ReportRequestParameters
): Promise<Report<ReportDataObject>[]> {
  const response = await getReportsForUser(...request);

  const r = response.data.reports.map((re: RR) => {
    const result: Report<TData> = {
      key: re.key,
      data: reportDataToObject(re.data) as TData,
    };

    return result;
  });

  return r;
}

function reportDataToObject(data: Array<ReportData>): Record<string, any> {
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
