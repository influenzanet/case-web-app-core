import { getExternalOrLocalContentURL, LoadingPlaceholder, ReportList as ReportListDisplay } from 'case-web-ui';
import { Profile } from 'case-web-ui/build/types/profile';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { getReportsForUser } from '../../api/studyAPI';
import { ReportHistory } from '../../api/types/studyAPI';
import { RootState } from '../../store/rootReducer';
import { format as formatDate, isDate } from "date-fns";

interface ReportListProps {
  pageKey: string;
  itemKey: string;
  studyKeys?: string[];
  reportKey?: string;
  className?: string;
  dateLocales?: Array<{ code: string, locale: any, format: string }>;
  cardBgOverride?: string;
}

interface ReportDisplayProps {
  timestamp: number;
  reportName: string;
  studyName?: string;
  cardIcon?: string;
  subtitle: string;
  profile?: Profile;
  summary?: string;
  data: Array<DataDisplay>;
}

interface DataDisplay {
  label?: string;
  value: string;
  useMarkdown?: boolean;
}

const ReportList: React.FC<ReportListProps> = (props) => {
  const [loading, setLoading] = useState(false);
  const { t, i18n } = useTranslation([props.pageKey, 'reports']);
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const avatars = useSelector((state: RootState) => state.config.avatars);
  const [reportHistory, setReportHistory] = useState<ReportHistory | undefined>();
  const [reportCardInfos, setReportCardInfos] = useState<ReportDisplayProps[]>([]);

  useEffect(() => {
    fetchReportHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);


  useEffect(() => {
    if (!reportHistory) {
      setReportCardInfos([]);
      return
    }
    const reports = reportHistory.reports.map(report => {
      let t = report.timestamp;
      if (typeof (t) === "string") {
        t = parseInt(t);
      }
      return {
        ...report,
        timestamp: t
      }
    })

    const sortedReports = reports.sort((a, b) => b.timestamp - a.timestamp);
    const reportCards = sortedReports.map((report): ReportDisplayProps => {

      const icon = report.data.find(d => d.key === 'icon');
      const summary = report.data.find(d => d.key === 'summary');

      const details: DataDisplay[] = []
      report.data.forEach(d => {
        if (d.key === 'icon' || d.key === 'summary') {
          return;
        }
        details.push(resolveReportData(report.key, d));
      });

      return {
        timestamp: report.timestamp,
        reportName: t(`reports:${report.key}.title`),
        studyName: t(`reports:studyNames.${report.studyKey}`),
        cardIcon: icon ? getExternalOrLocalContentURL(t(`reports:icons.${icon}`)) : undefined,
        subtitle: formatDate(new Date(report.timestamp * 1000), 'Pp', { locale: props.dateLocales?.find(dl => dl.code === i18n.language)?.locale }),
        profile: currentUser.profiles.find(p => p.id === report.profileId),
        summary: summary ? resolveReportData(report.key, summary).value : undefined,
        data: details,
      }
    });

    setReportCardInfos(reportCards);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language, reportHistory]);

  const resolveReportData = (reportKey: string, data: { key: string; value: string; dtype?: string }): DataDisplay => {
    const displayData: DataDisplay = {
      label: t(`reports:${reportKey}.${data.key}.label`),
      value: '',
      useMarkdown: false,
    }
    switch (data.dtype) {
      case 'rawMessage':
        displayData.useMarkdown = true
        displayData.value = data.value
        displayData.label = undefined
        break;
      case 'float':
        displayData.value = data.value
        break;
      case 'int':
        displayData.value = data.value
        break;
      case 'date':
        displayData.value = formatDate(new Date(parseInt(data.value) * 1000), 'Pp', { locale: props.dateLocales?.find(dl => dl.code === i18n.language)?.locale })
        break;
      case 'string':
        displayData.value = data.value
        break;
      default:
        displayData.value = t(`reports:${reportKey}.${data.key}.${data.value}`)
        break;
    }
    return displayData;
  }

  const fetchReportHistory = async () => {
    if (loading) { return; }
    setLoading(true);
    try {
      const resp = await getReportsForUser(
        props.studyKeys,
        undefined,
        props.reportKey,
        undefined,
        undefined
      );
      setReportHistory(resp.data);
    } catch (e: any) {
      console.error(e.response);
      return;
    } finally {
      setLoading(false);
    }
  }


  const loadingContent = () => <div>
    <LoadingPlaceholder
      color="secondary"
      minHeight={300}
    />
  </div>

  const renderContent = () => <div className={props.className}>
    <ReportListDisplay
      texts={{
        title: t(`${props.itemKey}.title`),
        subtitle: t(`${props.itemKey}.subtitle`).length > 0 ? t(`${props.itemKey}.subtitle`) : undefined,
        cardActionBtn: t(`${props.itemKey}.cardActionBtn`),
        detailDialog: {
          title: t(`${props.itemKey}.detailDialog.title`),
          closeBtn: t(`${props.itemKey}.detailDialog.closeBtn`),
        },
        emptyList: t(`${props.itemKey}.emptyList`),
        infoParagraph: t(`${props.itemKey}.infoParagraph`),
      }}
      reports={reportCardInfos}
      avatars={avatars}
      cardBgOverride={props.cardBgOverride}
    />
  </div>

  return (
    <React.Fragment>
      {loading ? loadingContent() : renderContent()}
    </React.Fragment>
  );
};

export default ReportList;
