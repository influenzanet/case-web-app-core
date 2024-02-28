import IUserSymptomsHistoryReportParser from "../../models/IUserSymptomsHistoryReportParser";
import UserSymptomsHistoryReportParserV1 from "./UserSymptomsHistoryReportParserV1";

const parsers: Array<IUserSymptomsHistoryReportParser> = [new UserSymptomsHistoryReportParserV1()];

export default parsers;
